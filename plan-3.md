# Plan for Standardizing Data Transformations

## Overview

This document outlines a comprehensive plan to standardize data transformations in the Cosmic application. The goal is to eliminate type casting issues, reduce code duplication, and implement a consistent pattern for transforming data between database entities and application models.

## Core Problem Areas

1. **Inconsistent Transformation Patterns**

   - Each service implements its own data transformation logic
   - Similar transformations are implemented differently across the codebase
   - No standard approach to handling relationships between entities

2. **Type Safety Issues**

   - Frequent use of `as unknown as` type casts
   - Direct mapping between database types and application models
   - Inconsistent handling of optional fields and relationships

3. **Code Duplication**
   - Similar transformation logic repeated across services
   - No central utilities for common transformations
   - Redundant type definitions and conversion logic

## Solution Approach

### 1. Implement Entity Mappers

Create dedicated mapper modules for each entity type:

```typescript
// src/lib/mappers/note-mapper.ts
import { Database } from "@/types/database.types";
import { CompleteNote, Note } from "@/types/types";
import { tagMapper } from "./tag-mapper";
import { itemMapper } from "./item-mapper";

type DbNote = Database["public"]["Tables"]["cosmic_memory"]["Row"];
type DbNoteWithRelations = DbNote & {
  cosmic_memory_tag_map?: Array<{
    cosmic_tags: Database["public"]["Tables"]["cosmic_tags"]["Row"];
  }>;
  cosmic_collection_item?: Array<
    Database["public"]["Tables"]["cosmic_collection_item"]["Row"]
  >;
};

export const noteMapper = {
  /**
   * Map a database note to an application Note
   */
  toNote(dbNote: DbNote): Note {
    return {
      id: dbNote.id,
      title: dbNote.title,
      content: dbNote.content,
      zone: dbNote.zone,
      category: dbNote.category,
      created_at: dbNote.created_at,
      updated_at: dbNote.updated_at,
      metadata: dbNote.metadata,
    };
  },

  /**
   * Map a database note with relations to a CompleteNote
   */
  toCompleteNote(dbNote: DbNoteWithRelations): CompleteNote {
    // First get the base note
    const note = this.toNote(dbNote);

    // Add tags if available
    const tags = dbNote.cosmic_memory_tag_map
      ? dbNote.cosmic_memory_tag_map.map((mapping) =>
          tagMapper.toTag(mapping.cosmic_tags)
        )
      : [];

    // Add items if available
    const items = dbNote.cosmic_collection_item
      ? dbNote.cosmic_collection_item.map((item) => itemMapper.toItem(item))
      : [];

    // Return the complete note
    return {
      ...note,
      tags,
      items,
    };
  },

  /**
   * Convert application Note to database insert format
   */
  toDbInsert(
    note: Partial<Note> & { content: string }
  ): Database["public"]["Tables"]["cosmic_memory"]["Insert"] {
    return {
      title: note.title || "",
      content: note.content,
      zone: note.zone || "personal",
      category: note.category || "scratchpad",
      metadata: note.metadata || {},
      embedding: "", // This will be generated elsewhere
      type: "note", // Default type
    };
  },
};
```

### 2. Create Type Helpers

Develop TypeScript utility types to improve type safety:

```typescript
// src/lib/typing/db-helpers.ts
import { Database } from "@/types/database.types";

// Type helper to get the row type for a table
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

// Type helper to get the insert type for a table
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

// Type helper to get the update type for a table
export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Type helper for joined tables
export type JoinedRow<
  T extends keyof Database["public"]["Tables"],
  R extends Record<string, any>
> = TableRow<T> & R;

// Type helper for database relations
export type WithRelation<T, R extends string, V> = T & Record<R, V>;
```

### 3. Implement Relationship Handling

Create a standardized approach to database relationships:

```typescript
// src/lib/mappers/relation-mapper.ts
import { Database } from "@/types/database.types";

export interface RelationConfig {
  // Define how to join tables for complex relations
  path: string;
  // Define how to transform the joined data
  transform: (data: any) => any;
}

export const RelationMap = {
  // Define standard relations
  NOTE_TAGS: {
    path: "cosmic_memory_tag_map(cosmic_tags(*))",
    transform: (data: any) => {
      if (!data?.cosmic_memory_tag_map) return [];
      return data.cosmic_memory_tag_map.map((map: any) => map.cosmic_tags);
    },
  },
  NOTE_ITEMS: {
    path: "cosmic_collection_item(*)",
    transform: (data: any) => {
      return data?.cosmic_collection_item || [];
    },
  },
  CLUSTER_TAG: {
    path: "cosmic_tags(*)",
    transform: (data: any) => data?.cosmic_tags,
  },
  // Add more standard relations as needed
};

/**
 * Build a select query with the specified relations
 */
export function buildSelectWithRelations(
  baseTable: string,
  relations: Array<RelationConfig | keyof typeof RelationMap>
): string {
  let query = "*";

  relations.forEach((relation) => {
    if (typeof relation === "string") {
      // Use predefined relation
      if (RelationMap[relation]) {
        query += `, ${RelationMap[relation].path}`;
      }
    } else {
      // Use custom relation config
      query += `, ${relation.path}`;
    }
  });

  return query;
}

/**
 * Process related data from a query result
 */
export function processRelations<T>(
  data: any,
  relations: Array<RelationConfig | keyof typeof RelationMap>
): T {
  const result = { ...data };

  relations.forEach((relation) => {
    if (typeof relation === "string") {
      // Use predefined relation
      if (RelationMap[relation]) {
        const key = relation.toLowerCase();
        result[key] = RelationMap[relation].transform(data);
      }
    } else {
      // Use custom relation config
      const key = relation.path.split("(")[0];
      result[key] = relation.transform(data);
    }
  });

  return result as T;
}
```

### 4. Implement Base Repository Pattern

Create a base repository pattern to standardize data access:

```typescript
// src/lib/repositories/base-repository.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export abstract class BaseRepository<
  TModel,
  TCompleteModel extends TModel,
  TDbEntity extends { id: number },
  TDbInsert
> {
  protected supabase: SupabaseClient<Database>;
  protected table: keyof Database["public"]["Tables"];

  constructor(
    supabase: SupabaseClient<Database>,
    table: keyof Database["public"]["Tables"]
  ) {
    this.supabase = supabase;
    this.table = table;
  }

  // Abstract methods that should be implemented by child classes
  protected abstract toModel(dbEntity: TDbEntity): TModel;
  protected abstract toCompleteModel(dbEntity: any): TCompleteModel;
  protected abstract toDbInsert(model: Partial<TModel>): TDbInsert;

  // Common methods for all repositories
  async getById(id: number): Promise<TCompleteModel> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.getCompleteSelectQuery())
      .eq("id", id)
      .single();

    if (error) throw error;

    return this.toCompleteModel(data);
  }

  async create(model: Partial<TModel>): Promise<TCompleteModel> {
    const dbInsert = this.toDbInsert(model);

    const { data, error } = await this.supabase
      .from(this.table)
      .insert(dbInsert)
      .select(this.getCompleteSelectQuery())
      .single();

    if (error) throw error;

    return this.toCompleteModel(data);
  }

  // Additional helper methods
  protected getCompleteSelectQuery(): string {
    // Override in child classes to provide the full select query
    return "*";
  }
}
```

### 5. Unified Service Factory

Create a factory to instantiate services with consistent dependencies:

```typescript
// src/lib/services/service-factory.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// Import all mappers
import { noteMapper } from "@/lib/mappers/note-mapper";
import { tagMapper } from "@/lib/mappers/tag-mapper";
import { itemMapper } from "@/lib/mappers/item-mapper";
import { clusterMapper } from "@/lib/mappers/cluster-mapper";

export const createServiceLayer = (supabase: SupabaseClient<Database>) => {
  // Create entity mappers with consistent approach
  const mappers = {
    note: noteMapper,
    tag: tagMapper,
    item: itemMapper,
    cluster: clusterMapper,
  };

  // Create services with consistent approach
  const noteService = new NoteService(supabase, mappers);
  const tagService = new TagService(supabase, mappers);
  const itemService = new ItemService(supabase, mappers);
  const clusterService = new ClusterService(supabase, mappers);

  // Set dependencies
  noteService.setTagService(tagService);
  noteService.setItemService(itemService);
  tagService.setNoteService(noteService);
  tagService.setClusterService(clusterService);

  return {
    noteService,
    tagService,
    itemService,
    clusterService,
    mappers,
  };
};
```

## Implementation Plan

### Phase 1: Create Core Mappers (2-3 days)

1. Define mapper interfaces and base structure

   - Create `Mapper` interface with standard methods
   - Implement base utility functions for mappers
   - Create type helpers for database and application models

2. Implement entity mappers

   - Create `note-mapper.ts`
   - Create `tag-mapper.ts`
   - Create `item-mapper.ts`
   - Create `cluster-mapper.ts`

3. Create relationship handling utilities
   - Implement `relation-mapper.ts`
   - Define standard relations for all entities
   - Create utility functions for building queries with relations

### Phase 2: Repository Pattern Implementation (2-3 days)

1. Create base repository

   - Implement `BaseRepository` abstract class
   - Add core CRUD operations with proper typing
   - Create utility methods for common operations

2. Implement entity repositories

   - Create `NoteRepository` extending `BaseRepository`
   - Create `TagRepository` extending `BaseRepository`
   - Create `ItemRepository` extending `BaseRepository`
   - Create `ClusterRepository` extending `BaseRepository`

3. Add specialized repository methods
   - Add entity-specific operations to repositories
   - Implement complex query methods with proper transformations
   - Create integration tests for repositories

### Phase 3: Service Layer Refactoring (3-4 days)

1. Refactor `NoteService` to use mappers

   - Update all methods to use the note mapper
   - Remove type casting and inconsistent transformations
   - Add unit tests for the refactored service

2. Refactor `TagService` to use mappers

   - Update all methods to use the tag mapper
   - Replace direct database access with repositories where applicable
   - Add unit tests for the refactored service

3. Refactor `ItemService` and `ClusterService`

   - Update all methods to use the respective mappers
   - Remove type casting and inconsistent transformations
   - Add unit tests for the refactored services

4. Implement service factory
   - Create unified service initialization
   - Handle circular dependencies properly
   - Add integration tests for the service layer

### Phase 4: API Layer Updates (2-3 days)

1. Update API endpoints to use mappers

   - Modify API route handlers to use the new services
   - Ensure consistent response formats
   - Add validation for incoming data using mappers

2. Standardize error handling

   - Create consistent error transformation
   - Implement proper error mapping between layers
   - Add better error reporting

3. Add integration tests for API endpoints
   - Test data consistency across layers
   - Verify proper transformation of complex entities
   - Test error handling

### Phase 5: Cleanup and Documentation (1-2 days)

1. Remove deprecated code

   - Delete redundant transformation logic
   - Remove unused type definitions
   - Update imports and dependencies

2. Add documentation

   - Document the mapper pattern and usage
   - Add examples for common operations
   - Update API documentation

3. Create developer guides
   - Add guide for adding new entities
   - Document the transformation flow
   - Provide examples for extending the system

## Code Examples for Key Services

### Example: Refactored ItemService

```typescript
// src/lib/services/item-service.ts
import { Database } from "@/types/database.types";
import { CompleteItem, Item } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "../embeddings";
import { itemMapper } from "../mappers/item-mapper";
import {
  RelationMap,
  buildSelectWithRelations,
} from "../mappers/relation-mapper";
import { TagService } from "./tag-service";

type MapperDictionary = {
  item: typeof itemMapper;
  [key: string]: any;
};

export class ItemService {
  private supabase: SupabaseClient<Database>;
  private tagService: TagService;
  private mappers: MapperDictionary;

  constructor(supabase: SupabaseClient<Database>, mappers: MapperDictionary) {
    this.supabase = supabase;
    this.mappers = mappers;
  }

  async setTagService(tagService: TagService): Promise<void> {
    this.tagService = tagService;
  }

  private async updateClusterAndTagForItem(
    memory?: number,
    tagId?: number
  ): Promise<void> {
    if (!memory && !tagId) return;
    if (tagId) {
      await this.tagService.setTagDirty(tagId);
      return;
    }
    // Additional logic for updating related entities
  }

  async createItem(
    item: Partial<Item> & { item: string; memory: number }
  ): Promise<CompleteItem> {
    // Convert to database format using mapper
    const dbItem = this.mappers.item.toDbInsert(item);

    // Insert into database with relations
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .insert(dbItem)
      .select(
        buildSelectWithRelations("cosmic_collection_item", [
          "NOTE_MEMORY",
          "CLUSTER_WITH_TAG",
        ])
      )
      .single();

    if (error) throw new Error(error.message);

    // Generate embedding
    const embedding = await generateEmbedding(data.item);

    // Map to application model using mapper
    const completeItem = this.mappers.item.toCompleteItem({
      ...data,
      embedding,
    });

    // Update cluster/tag as needed
    await this.updateClusterAndTagForItem(
      completeItem.memory?.id,
      completeItem.cluster?.tag?.id
    );

    return completeItem;
  }

  // Other methods follow a similar pattern...
}
```

## Risks and Mitigations

1. **Risk**: Migration complexity due to extensive codebase changes
   **Mitigation**: Implement changes incrementally, with comprehensive tests at each step

2. **Risk**: Performance impact of additional transformation layers
   **Mitigation**: Optimize critical paths and benchmark before/after performance

3. **Risk**: Learning curve for developers used to the current approach
   **Mitigation**: Create detailed documentation and examples, conduct knowledge sharing sessions

4. **Risk**: Incompatibility with some existing patterns
   **Mitigation**: Create adapter patterns for transitional period

## Success Metrics

Success will be measured by:

1. **Code Consistency**: Elimination of all `as unknown as` type casts
2. **Test Coverage**: Comprehensive test coverage for all mappers and transformations
3. **Type Safety**: No type-related runtime errors in transformed data
4. **Developer Experience**: Simpler, more consistent API for working with entity transformations
5. **Maintainability**: Easier process for adding new entities or modifying existing ones
