# Search Implementation Guide

This document provides guidance for working with the search functionality in Mercury's codebase.

## Architecture Overview

The search feature implements **semantic vector search** using OpenAI embeddings and PostgreSQL's pgvector extension. It searches both notes and AI-generated clusters with real-time filtering capabilities.

### Key Components

- **Search Page** (`page.tsx`) - Client component managing search state and UI
- **SearchBox** - Input with category filter and tag refinement
- **SearchResults** - Displays notes and clusters separately
- **NoteCard/ClusterCard** - Render individual results with highlighting

## Vector Search Pattern

### 1. Embedding Generation
```typescript
// lib/embeddings.ts
const embedding = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: text.replace(/\n/g, " ")
});
// Returns 1536-dimensional vector
```

### 2. Search Service Flow
```typescript
// lib/services/search-service.ts
async searchNotes(query, filters) {
  // Generate embedding for query
  const embedding = await generateEmbedding(query);
  
  // Call Supabase RPC function with vector
  const { data } = await db.rpc('search_notes_with_tags', {
    query_embedding: embedding,
    match_count: 30,
    match_threshold: 0.2,
    filter_category,
    filter_zone,
    filter_tags
  });
}
```

### 3. Database Function
The `search_notes_with_tags` RPC function:
- Performs cosine similarity matching
- Filters by category/zone/tags in single query
- Returns notes with tags joined
- Orders by similarity score

## Filter Components

### CategoryFilter Pattern
- Dropdown with 9 categories (to-do, scratchpad, journal, etc.)
- Each category has icon and color theme
- Updates trigger new search via Redux dispatch

### Tag Refinement
- Opens `TagSelectionDialog` for multi-select
- Selected tags stored in Redux search slice
- Applied as AND filter in search query

## Search Result Rendering

### Highlighting Strategy
```typescript
const highlightText = (text: string, query: string) => {
  const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
  return text.split(regex).map((part, i) => 
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
};
```

### Content Truncation
- Notes: 150 characters with ellipsis
- Clusters: 200 characters
- Preserves word boundaries

## Performance Optimizations

### Database Level
1. **Vector Index**: Automatic via pgvector
2. **Composite Indices**:
   ```sql
   idx_cosmic_memory_tag_map_tag -- tag lookups
   idx_cosmic_memory_tag_map_note -- note mappings
   idx_cosmic_memory_category_zone -- filter performance
   ```

### API Level
- Edge Runtime for ~50ms faster cold starts
- Configurable similarity threshold (default: 0.2)
- Match count limit (default: 30)

### Frontend Level
1. **RTK Query Caching**:
   - 30-minute cache retention
   - Automatic deduplication
   - Optimistic updates

2. **Debouncing Pattern**:
   ```typescript
   // Local state for immediate UI updates
   const [localQuery, setLocalQuery] = useState("");
   
   // Redux state for actual search
   const handleSearch = () => {
     dispatch(setQuery(localQuery));
   };
   ```

## Integration Points

### Redux State Shape
```typescript
searchSlice: {
  query: string;
  categoryFilter: Category | null;
  selectedTags: string[];
  isSearching: boolean;
}
```

### API Endpoints
- `GET /api/note/search` - Vector search with filters
- `GET /api/cluster` - Fetch all clusters (client-side filter)

## Critical Patterns & Gotchas

### 1. **Embedding Consistency**
Always preprocess text the same way:
```typescript
text.replace(/\n/g, " ") // Replace newlines with spaces
```

### 2. **Similarity Threshold**
- Default: 0.2 (lower = more similar)
- Too low: Few/no results
- Too high: Irrelevant results

### 3. **Filter Precedence**
Filters applied in this order:
1. Vector similarity (must pass threshold)
2. Category filter (exact match)
3. Zone filter (exact match)
4. Tag filter (must have all selected tags)

### 4. **Client-Side Cluster Search**
Clusters are filtered client-side because:
- Small dataset (typically <100 clusters)
- Avoids embedding regeneration
- Simplifies caching strategy

### 5. **Error Handling**
- Embedding failures fallback to empty results
- Network errors show toast notifications
- Invalid filters silently ignored

## Best Practices

1. **Always generate embeddings server-side** - Never expose API keys
2. **Use Edge Runtime** for search routes - Better performance
3. **Implement debouncing** for search input - Reduce API calls
4. **Cache aggressively** - Search results rarely change
5. **Highlight thoughtfully** - Only highlight visible text
6. **Test with edge cases** - Empty queries, special characters, long text

## Common Tasks

### Adding New Filter
1. Add to search slice state
2. Update `searchNotes` service method
3. Modify database RPC function
4. Add UI component to SearchBox
5. Update cache keys if needed

### Adjusting Search Relevance
1. Modify similarity threshold in service
2. Consider different embedding models
3. Add keyword search fallback
4. Implement result re-ranking

### Improving Performance
1. Add database indices for new filters
2. Implement pagination (currently loads all)
3. Consider elasticsearch for scale
4. Add server-side result caching