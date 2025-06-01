# Service Layer Architecture Guide

This guide documents the service layer architecture, patterns, and critical implementation details for the Mercury codebase.

## Service Architecture Overview

The service layer uses **dependency injection** with circular dependency management:

```typescript
// Services created without dependencies first
const noteService = new NoteService(supabase);
const tagService = new TagService(supabase);

// Dependencies set via setters to break circular refs
noteService.setTagService(tagService);
tagService.setNoteService(noteService);
```

All services are initialized in `src/lib/services/index.ts` via `initializeServices()`.

## Database Abstraction Layer

### QueryBuilder (`database/query-builder.ts`)

Type-safe Supabase queries that prevent N+1 problems:

```typescript
const qb = createQueryBuilder(supabase);

// Single query with relations
const note = await qb.getByIdWithRelations(
  'cosmic_memory',
  noteId,
  ['tags(cosmic_tags)']
);

// Batch queries
const notes = await qb.selectWithRelations(
  'cosmic_memory',
  ['tags(cosmic_tags)', 'clusters(cosmic_cluster)'],
  query => query.eq('userId', userId)
);
```

### Mapper (`database/mapper.ts`)

Converts database types to domain objects:

```typescript
const completeNote = mapper.toCompleteNote(dbNote, tags, clusters);
const tag = mapper.toTag(dbTag);
```

## Common Service Patterns

1. **Constructor Pattern**
   ```typescript
   constructor(private supabase: SupabaseClient) {}
   ```

2. **Setter for Dependencies**
   ```typescript
   setTagService(tagService: TagService) {
     this.tagService = tagService;
   }
   ```

3. **Error Handling**
   ```typescript
   throw new UserError('Note not found');
   throw new ApplicationError('Database error', { cause: error });
   ```

## Service Dependencies

```
NoteService ←→ TagService
    ↓               ↓
ItemService    ClusterService
                    ↑
             SettingsService
```

- **Circular**: NoteService ↔ TagService
- **One-way**: NoteService → ItemService, ClusterService
- **Standalone**: AIService, SearchService

## Key Service Methods

### NoteService
- `create()`, `update()`, `delete()` - CRUD with tag management
- `getById()`, `getByUser()` - Fetch with relations
- `addTag()`, `removeTag()` - Tag associations
- Automatically generates embeddings and detects categories
- Marks related tags/clusters as dirty on changes

### TagService
- `suggestTags()` - AI-powered tag suggestions with confidence scores
- `mergeTags()` - Merge multiple tags into one
- `generateClustersForTag()` - Create AI summaries per category
- `cleanupUnusedTags()` - Auto-delete orphaned tags

### ClusterService
- `create()`, `update()` - Manage AI-generated summaries
- `markAsDirty()` - Flag for regeneration
- `getByTagAndCategory()` - Fetch specific clusters

### ItemService
- `convertNoteToItems()` - Extract items from note content
- `update()`, `delete()` - Item management
- Updates related tags/clusters on changes

### SearchService (standalone)
- `searchNotes()` - Vector similarity search
- `searchClusters()` - Semantic cluster search
- Uses RPC functions for performance

### AIService (standalone)
- `generateSummary()` - Create AI summaries
- `detectCategory()` - Auto-categorize content
- `generateTags()` - Extract relevant tags
- Schema validation with Zod

## Critical Patterns & Gotchas

### 1. Dirty Flag Pattern
Tags and clusters have `dirty: boolean` to track regeneration needs:
```typescript
await this.tagService.markTagAsDirty(tagId);
```

### 2. Cascade Updates
When notes change → tags/clusters marked dirty → regeneration queued

### 3. Tag Cleanup
Tags auto-delete when no notes reference them:
```typescript
await this.cleanupUnusedTags(userId);
```

### 4. Embedding Management
All content gets embeddings for search:
```typescript
const embedding = await generateEmbedding(content);
```

### 5. Category-Specific Logic
Different processing per category (to-do, journal, etc.):
```typescript
if (category === 'collection') {
  await this.itemService.convertNoteToItems(noteId);
}
```

### 6. Performance Optimizations
- Use RPC functions for complex queries
- Batch operations where possible
- Proper database indices (see `run-sql/04_performance_indices.sql`)

### 7. Transaction Boundaries
Services don't manage transactions - API routes handle them:
```typescript
// In API route, not service
const { data, error } = await supabase.rpc('transaction_function');
```

### 8. Content Sanitization
Remove null bytes before storage:
```typescript
content = content.replace(/\0/g, '');
```

## Common Mistakes to Avoid

1. **Don't create services without dependency injection setup**
2. **Don't forget to mark related entities as dirty on updates**
3. **Don't bypass the QueryBuilder for complex queries (N+1 issues)**
4. **Don't handle transactions in services (let API routes manage)**
5. **Don't forget error handling with proper error classes**
6. **Don't skip tag cleanup after note operations**
7. **Don't forget to generate embeddings for searchable content**

## Service Testing Pattern

Services are designed for easy testing:
```typescript
const mockSupabase = createMockSupabaseClient();
const service = new NoteService(mockSupabase);
service.setTagService(mockTagService);
```

This architecture ensures clean separation of concerns, maintainability, and type safety throughout the application.