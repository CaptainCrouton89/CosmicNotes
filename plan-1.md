# Plan for Resolving N+1 Query Problems

## Overview

This document outlines a comprehensive plan to address the N+1 query problems identified in the Cosmic application. These issues occur when the application makes one query to fetch a list of records, followed by additional queries for each record to fetch related data.

## Core Problem Areas

1. **ClusterService.getClusterById()**

   - Initial query fetches a cluster
   - Subsequent queries fetch tag mappings, notes, and for each note, tags and items

2. **TagService.getTag()**

   - Initial query fetches a tag
   - Additional queries fetch tag mappings and related data

3. **SearchService.searchNotes()**
   - Initial query searches for notes
   - Additional queries fetch tags for each note

## Solution Approach

### 1. Create a Query Builder Utility

Develop a utility class to build consistent, type-safe nested queries:

```typescript
// src/lib/services/database/query-builder.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export class QueryBuilder<T extends keyof Database["public"]["Tables"]> {
  constructor(private supabase: SupabaseClient<Database>, private table: T) {}

  // Base query builder with type safety
  select(columns: string) {
    return this.supabase.from(this.table).select(columns);
  }

  // Helper for common nested queries
  selectWithRelations(baseColumns: string, relations: Record<string, string>) {
    let query = baseColumns;

    Object.entries(relations).forEach(([relation, columns]) => {
      query += `, ${relation}(${columns})`;
    });

    return this.select(query);
  }

  // Additional helpers for common query patterns
  byId(id: number) {
    return {
      ...this,
      query: this.select("*").eq("id", id),
    };
  }

  // Add more utility methods as needed
}
```

### 2. Create Custom Supabase RPC Functions

Implement PostgreSQL functions to optimize complex queries:

```sql
-- Get tag with related notes and clusters in a single query
CREATE OR REPLACE FUNCTION public.get_tag_with_relations(
  tag_id bigint
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT
    json_build_object(
      'id', t.id,
      'name', t.name,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'dirty', t.dirty,
      'notes', COALESCE(
        (SELECT json_agg(n.*)
         FROM cosmic_memory_tag_map tm
         JOIN cosmic_memory n ON tm.note = n.id
         WHERE tm.tag = t.id),
        '[]'::json
      ),
      'clusters', COALESCE(
        (SELECT json_agg(c.*)
         FROM cosmic_cluster c
         WHERE c.tag = t.id),
        '[]'::json
      ),
      'note_count', (
        SELECT COUNT(*)
        FROM cosmic_memory_tag_map tm
        WHERE tm.tag = t.id
      )
    ) INTO result
  FROM cosmic_tags t
  WHERE t.id = tag_id;

  RETURN result;
END;
$$;

-- Enhanced search_notes function that includes tags
CREATE OR REPLACE FUNCTION public.search_notes_with_tags(
  query_embedding vector(1536),
  match_threshold float8,
  match_count int,
  filter_category text DEFAULT NULL,
  filter_zone text DEFAULT NULL,
  filter_tag_ids bigint[] DEFAULT NULL
)
RETURNS SETOF json
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
DECLARE
  result json;
  note_record record;
  note_ids bigint[];
BEGIN
  -- Get matching notes
  SELECT array_agg(id) INTO note_ids
  FROM (
    SELECT id, 1 - (embedding <=> query_embedding) as score
    FROM cosmic_memory
    WHERE (1 - (embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR category = filter_category)
    AND (filter_zone IS NULL OR zone = filter_zone)
    ORDER BY score DESC
    LIMIT match_count
  ) AS matched_notes;

  -- Filter by tags if provided
  IF filter_tag_ids IS NOT NULL AND array_length(filter_tag_ids, 1) > 0 THEN
    SELECT array_agg(DISTINCT note) INTO note_ids
    FROM cosmic_memory_tag_map
    WHERE note = ANY(note_ids)
    AND tag = ANY(filter_tag_ids);
  END IF;

  -- Return notes with their tags in one query
  FOR note_record IN
    SELECT
      n.*,
      1 - (n.embedding <=> query_embedding) as score,
      COALESCE(
        (SELECT json_agg(t.*)
         FROM cosmic_memory_tag_map tm
         JOIN cosmic_tags t ON tm.tag = t.id
         WHERE tm.note = n.id),
        '[]'::json
      ) as tags
    FROM cosmic_memory n
    WHERE n.id = ANY(note_ids)
    ORDER BY 1 - (n.embedding <=> query_embedding) DESC
  LOOP
    result := row_to_json(note_record);
    RETURN NEXT result;
  END LOOP;

  RETURN;
END;
$$;
```

### 3. Refactor Core Service Methods

#### ClusterService.getClusterById()

```typescript
async getClusterById(id: number): Promise<CompleteCluster> {
  // Single query with nested selects
  const { data, error } = await this.supabase
    .from("cosmic_cluster")
    .select(`
      *,
      cosmic_tags(*),
      cosmic_collection_item(*),
      tag_notes:cosmic_tags!cosmic_cluster_tag_fkey(
        cosmic_memory_tag_map(
          cosmic_memory(*)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  // Transform the nested result to match the expected CompleteCluster structure
  const notes = data.tag_notes.cosmic_memory_tag_map
    .filter(mapping => mapping.cosmic_memory.category === data.category)
    .map(mapping => mapping.cosmic_memory);

  return {
    ...data,
    tag: data.cosmic_tags,
    note_count: notes.length,
    notes: notes,
    cluster_items: data.cosmic_collection_item.map(item => ({
      ...item,
      cluster: undefined,
      embedding: item.embedding || "[]",
      memory: undefined,
    })),
  };
}
```

#### TagService.getTag()

```typescript
async getTag(id: number): Promise<CompleteTag> {
  // Use the custom RPC function
  const { data, error } = await this.supabase
    .rpc('get_tag_with_relations', { tag_id: id });

  if (error) throw error;

  // The data is already in the expected format
  return data as unknown as CompleteTag;
}
```

#### SearchService.searchNotes()

```typescript
export async function searchNotes(
  query: string,
  matchCount: number = 10,
  matchThreshold: number = 0.5,
  category: string | null = null,
  zone: string | null = null,
  tags: string[] | null = null,
  tagIds: number[] | null = null
): Promise<(Note & { tags: Tag[]; score: number })[]> {
  // Get embedding for the query
  const embeddingString = await generateEmbedding(query);
  const embedding = JSON.parse(embeddingString);

  const supabaseClient = await createClient();

  // Use the enhanced RPC function
  const { data: notes, error } = await supabaseClient.rpc(
    "search_notes_with_tags",
    {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_category: category,
      filter_zone: zone,
      filter_tag_ids: tagIds,
    }
  );

  if (error) {
    throw new ApplicationError("Failed to search notes", {
      supabaseError: error,
    });
  }

  // Transform the results to match the expected type
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    zone: note.zone,
    category: note.category,
    created_at: note.created_at,
    updated_at: note.updated_at,
    metadata: note.metadata,
    tags: note.tags || [],
    score: note.score,
  }));
}
```

## Implementation Plan

### Phase 1: Setup (1-2 days)

- Create QueryBuilder utility class
- Add testing utilities for benchmarking and comparing results
- Create database migrations for new RPC functions

### Phase 2: Core Services Refactoring (3-5 days)

- Refactor TagService.getTag to use the new get_tag_with_relations function
- Update ClusterService.getClusterById with nested queries
- Refactor SearchService.searchNotes to use search_notes_with_tags
- Add comprehensive tests for each refactored method

### Phase 3: Secondary Services and Edge Cases (2-3 days)

- Refactor remaining service methods that exhibit N+1 query patterns:
  - NoteService.getNoteById
  - ItemService.getItems
  - ClusterService.getClusters
- Handle edge cases (null values, empty relationships)
- Add proper error handling

### Phase 4: Performance Validation (1-2 days)

- Run benchmarks comparing old vs new implementations
- Verify data consistency
- Document performance improvements
- Fix any regressions

### Phase 5: Integration (1-2 days)

- Update API endpoints to work with new service implementations
- Ensure type compatibility with frontend
- Deploy changes with monitoring in place

## Testing Strategy

1. **Unit Tests**:

   - Create tests for each refactored method
   - Verify data consistency between old and new implementations
   - Test edge cases (empty results, error conditions)

2. **Performance Tests**:

   - Create a performance testing module
   - Record query times before and after changes
   - Count database operations for key user flows

3. **Integration Tests**:
   - Test the entire request flow from API to database
   - Ensure frontend components receive compatible data structures

## Measuring Success

Success will be measured by:

1. **Reduced Query Count**: At least 50% reduction in database queries for target operations
2. **Improved Response Times**: At least 30% improvement in service method response times
3. **Data Consistency**: 100% match between old and new data structures
4. **No Regressions**: All existing functionality continues to work correctly

## Risks and Mitigations

1. **Risk**: Supabase nested queries might not work as expected for complex relationships
   **Mitigation**: Fall back to custom RPC functions for the most complex cases

2. **Risk**: Type safety challenges with nested query results
   **Mitigation**: Create dedicated mapper functions for transforming results

3. **Risk**: Performance might vary in production environment
   **Mitigation**: Add monitoring and query logging to production

4. **Risk**: Breaking changes to API response structures
   **Mitigation**: Ensure transformed data matches existing structures exactly
