# Plan for Optimizing Cache Invalidation and Implementing Optimistic Updates

## Overview

This document outlines a comprehensive plan to address inefficient cache invalidation patterns and implement optimistic updates in the Cosmic application. These improvements will enhance the user experience by reducing unnecessary network requests and providing immediate feedback for user actions.

## Core Problem Areas

1. **Overly Broad Cache Invalidation**

   - Many operations invalidate entire entity lists with tags like `{ type: "Note", id: "LIST" }`
   - Cross-entity invalidations are common and often unnecessary
   - Limited use of targeted cache updates leads to excessive refetching

2. **Lack of Optimistic Updates**

   - Current operations wait for API responses before updating the UI
   - No immediate feedback for common actions like toggling item status
   - State updates have noticeable delay, especially on slower connections

3. **Circular Dependencies in API Modules**
   - Redux API modules have circular dependencies
   - Cross-API invalidation is handled with dynamic imports or redundant code
   - No centralized approach to cache management

## Solution Approach

### 1. Implement Granular Cache Tags

Replace broad list invalidation with more specific categorization:

```typescript
// Current approach
export const notesApi = createApi({
  reducerPath: "notesApi",
  tagTypes: ["Note"],
  endpoints: (builder) => ({
    getNotes: builder.query({
      providesTags: [{ type: "Note", id: "LIST" }],
    }),
  }),
});

// Improved approach with granular tags
export const notesApi = createApi({
  reducerPath: "notesApi",
  tagTypes: ["Note", "NoteList", "NoteByCategory", "NoteByTag"],
  endpoints: (builder) => ({
    getNotes: builder.query({
      providesTags: (result, error, arg) => {
        // Base tags
        const tags = [{ type: "NoteList", id: "all" }];

        // Add results' individual tags
        if (result?.content) {
          result.content.forEach((note) => {
            tags.push({ type: "Note", id: note.id });
          });
        }

        // Add category-specific tag if category filter was used
        if (arg.category) {
          tags.push({ type: "NoteByCategory", id: arg.category });
        }

        // Add tag-specific tag if tag filter was used
        if (arg.tagId) {
          tags.push({ type: "NoteByTag", id: arg.tagId.toString() });
        }

        return tags;
      },
    }),
  }),
});
```

### 2. Implement Optimistic Updates for Common Actions

Add immediate UI feedback for frequent user actions:

```typescript
// Toggle item completion status with optimistic update
updateItem: builder.mutation<CompleteItem, { id: number; done: boolean }>({
  query: ({ id, done }) => ({
    url: "item",
    method: "PUT",
    body: { id, done },
  }),
  // Only invalidate the specific item
  invalidatesTags: (result, error, { id }) => [{ type: "Item", id }],

  // Add optimistic update
  async onQueryStarted({ id, done }, { dispatch, queryFulfilled }) {
    // Optimistically update the cache
    const patchResult = dispatch(
      itemsApi.util.updateQueryData('getItemsByNoteId', id, draftItems => {
        const item = draftItems.find(item => item.id === id);
        if (item) {
          item.done = done;
        }
      })
    );

    try {
      await queryFulfilled;
      // Success! The cache is already updated
    } catch {
      // Error! Revert the optimistic update
      patchResult.undo();

      // Optionally show an error notification
      console.error('Failed to update item');
    }
  },
}),
```

### 3. Create a Unified Cache Management System

Develop a centralized system to manage cache tags and invalidation:

```typescript
// src/lib/redux/cacheUtils.ts
export const CACHE_TAGS = {
  NOTE: "Note",
  NOTE_LIST: "NoteList",
  NOTE_BY_CATEGORY: "NoteByCategory",
  NOTE_BY_TAG: "NoteByTag",
  TAG: "Tag",
  TAG_LIST: "TagList",
  ITEM: "Item",
  ITEM_LIST: "ItemList",
  CLUSTER: "Cluster",
  CLUSTER_LIST: "ClusterList",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Helper for cross-API invalidation
export const createInvalidationActions = (apis: Record<string, any>) => {
  return {
    invalidateNote: (noteId: number) => {
      Object.values(apis).forEach((api) => {
        if (api.util?.invalidateTags) {
          api.util.invalidateTags([{ type: CACHE_TAGS.NOTE, id: noteId }]);
        }
      });
    },
    // Add more invalidation actions as needed
  };
};
```

### 4. Add Cache Consistency Middleware

Implement middleware to ensure cross-API cache consistency:

```typescript
// src/lib/redux/cacheConsistency.ts
import { Middleware } from "redux";
import { RootState } from "./store";
import { CACHE_TAGS } from "./cacheUtils";
import { apis } from "./services";

export const cacheConsistencyMiddleware: Middleware<{}, RootState> =
  ({ dispatch }) =>
  (next) =>
  (action) => {
    // Execute the action first
    const result = next(action);

    // Check if this was a fulfilled mutation that should trigger cross-API invalidations
    if (action.type?.endsWith("/executeQuery/fulfilled")) {
      const { endpointName, originalArgs } = action.meta;

      // When note tags are updated, invalidate tag-related queries
      if (endpointName === "updateNote" && originalArgs?.note?.tags) {
        const affectedTags = originalArgs.note.tags;
        affectedTags.forEach((tag) => {
          dispatch(
            apis.tagsApi.util.invalidateTags([
              {
                type: CACHE_TAGS.TAG,
                id: typeof tag === "string" ? tag : tag.id,
              },
            ])
          );
        });
      }

      // Add more cross-entity invalidation rules
    }

    return result;
  };
```

### 5. Implement Entity Dependency Tracking

Create a system to track entity relationships for precise invalidation:

```typescript
// src/lib/redux/entityDependencies.ts
type EntityType = "Note" | "Tag" | "Cluster" | "Item";

interface EntityRef {
  type: EntityType;
  id: number | string;
}

// Track which entities depend on others
const dependencyGraph: Record<string, EntityRef[]> = {};

// Build a key for the dependency graph
const buildKey = (ref: EntityRef) => `${ref.type}_${ref.id}`;

export const entityDependencies = {
  // Register a dependency between entities
  register(dependent: EntityRef, dependency: EntityRef) {
    const key = buildKey(dependency);
    if (!dependencyGraph[key]) {
      dependencyGraph[key] = [];
    }

    // Check if this dependency already exists
    const exists = dependencyGraph[key].some(
      (ref) => ref.type === dependent.type && ref.id === dependent.id
    );

    if (!exists) {
      dependencyGraph[key].push(dependent);
    }
  },

  // Get all entities that depend on the specified entity
  getDependents(entity: EntityRef): EntityRef[] {
    return dependencyGraph[buildKey(entity)] || [];
  },
};
```

### 6. Create Optimistic Entity Factories

Develop factories for creating consistent optimistic entities:

```typescript
// src/lib/redux/optimisticEntities.ts
import { Note, Tag, Item } from "@/types/types";

// Create an optimistic note with sensible defaults
export const createOptimisticNote = (partial: Partial<Note>): Note => ({
  id: -Date.now(), // Negative ID to avoid conflicts
  title: partial.title || "New Note",
  content: partial.content || "",
  zone: partial.zone || "personal",
  category: partial.category || "scratchpad",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: partial.metadata || {},
  tags: partial.tags || [],
  ...partial,
});

// Track optimistic entities
const optimisticEntities = new Map<string, number>();

export const trackOptimisticEntity = (tempId: number, entityType: string) => {
  optimisticEntities.set(`${entityType}_${tempId}`, tempId);
};

export const isOptimisticEntity = (id: number, entityType: string): boolean => {
  return optimisticEntities.has(`${entityType}_${id}`);
};
```

## Implementation Plan

### Phase 1: Core Cache Structure Updates (2-3 days)

1. Create the centralized cache tag system

   - Define all cache tag types
   - Create utility functions for tag generation and invalidation
   - Implement the cache consistency middleware

2. Update the Redux store configuration
   - Add the new middleware
   - Configure default cache lifetimes
   - Modify cache storage approach if needed

### Phase 2: API Service Refactoring (3-4 days)

1. Update the API definitions with granular tags

   - Refactor `notesApi.ts`
   - Refactor `tagsApi.ts`
   - Refactor `itemsApi.ts`
   - Refactor `clustersApi.ts`

2. Resolve circular dependencies
   - Implement the unified cache management system
   - Update cross-API invalidation patterns
   - Clean up redundant invalidation code

### Phase 3: Implement Optimistic Updates (3-4 days)

1. Identify high-impact user actions for optimistic updates

   - Item status toggling
   - Note creation/editing
   - Tag addition/removal
   - Other common actions

2. Implement optimistic entity factories

   - Create factory functions for each entity type
   - Add optimistic entity tracking system
   - Implement utilities for reverting optimistic updates

3. Add optimistic update logic to key mutations
   - Update key endpoints in each API slice
   - Implement proper error handling
   - Add undo functionality for failed operations

### Phase 4: Entity Dependency System (2-3 days)

1. Create the entity dependency tracking system

   - Implement the dependency graph
   - Add registration and lookup functions
   - Create utility functions for invalidation

2. Integrate with existing services
   - Update service creation to register dependencies
   - Modify mutation responses to update dependencies
   - Implement automatic invalidation based on dependencies

### Phase 5: Testing and Optimization (2-3 days)

1. Create test cases for cache behavior

   - Verify proper invalidation patterns
   - Test optimistic updates
   - Ensure data consistency

2. Performance testing

   - Measure network request reduction
   - Verify UI responsiveness improvements
   - Test under various network conditions

3. Fine-tune implementations
   - Adjust cache lifetimes based on testing
   - Optimize invalidation patterns
   - Address any discovered issues

## Specific Implementations

Here are detailed implementations for key functionality:

### 1. Note Creation with Optimistic Update

```typescript
createNote: builder.mutation<
  Note,
  Omit<NoteInsert, "embedding"> & { tags?: string[]; tagIds?: number[] }
>({
  query: (note) => ({
    url: "note",
    method: "POST",
    body: note,
  }),
  invalidatesTags: (result) => [
    { type: CACHE_TAGS.NOTE_LIST, id: 'all' },
    ...(result?.category ? [{ type: CACHE_TAGS.NOTE_BY_CATEGORY, id: result.category }] : [])
  ],

  async onQueryStarted(note, { dispatch, queryFulfilled }) {
    // Create optimistic note
    const optimisticNote = createOptimisticNote({
      title: note.title,
      content: note.content,
      zone: note.zone,
      category: note.category,
      // Add any other fields from the input
    });

    // Track this optimistic entity
    trackOptimisticEntity(optimisticNote.id, 'Note');

    // Update the notes list with our optimistic note
    const patchResult = dispatch(
      notesApi.util.updateQueryData(
        'getNotes',
        { page: 1, limit: 10 },
        draft => {
          draft.content.unshift(optimisticNote);
          draft.pagination.totalCount += 1;
        }
      )
    );

    try {
      const response = await queryFulfilled;

      // Replace optimistic note with real one
      dispatch(
        notesApi.util.updateQueryData(
          'getNotes',
          { page: 1, limit: 10 },
          draft => {
            const index = draft.content.findIndex(note => note.id === optimisticNote.id);
            if (index >= 0) {
              draft.content[index] = response.data;
            }
          }
        )
      );
    } catch (err) {
      patchResult.undo();
      console.error('Failed to create note', err);
    }
  }
}),
```

### 2. Adding Tags to a Note with Optimistic Update

```typescript
addTagToNote: builder.mutation<
  void,
  { noteId: number; tagId: number; tagName?: string }
>({
  query: ({ noteId, tagId }) => ({
    url: `note/${noteId}/tag/${tagId}`,
    method: "POST",
  }),
  invalidatesTags: (result, error, { noteId, tagId }) => [
    { type: CACHE_TAGS.NOTE, id: noteId },
    { type: CACHE_TAGS.TAG, id: tagId },
    { type: CACHE_TAGS.NOTE_BY_TAG, id: tagId.toString() },
  ],

  async onQueryStarted(
    { noteId, tagId, tagName },
    { dispatch, queryFulfilled, getState }
  ) {
    // Get tag name if not provided
    let name = tagName;
    if (!name) {
      const state = getState() as RootState;
      const tag = selectTagById(state, tagId);
      name = tag?.name || `Tag ${tagId}`;
    }

    // Add tag optimistically to the note
    const notePatch = dispatch(
      notesApi.util.updateQueryData("getNote", noteId, (draft) => {
        if (!draft.tags.some((t) => t.id === tagId)) {
          draft.tags.push({ id: tagId, name });
        }
      })
    );

    try {
      await queryFulfilled;
    } catch {
      notePatch.undo();
      console.error("Failed to add tag to note");
    }
  },
});
```

## Risks and Mitigations

1. **Risk**: Complex optimistic updates might lead to inconsistent UI states
   **Mitigation**: Comprehensive testing and careful state tracking, with automatic cleanup

2. **Risk**: Over-optimization might make debugging more difficult
   **Mitigation**: Add detailed logging in development mode and maintain clear separation of concerns

3. **Risk**: Cache lifetime management might be too aggressive or too conservative
   **Mitigation**: Implement configurable cache lifetimes and monitor performance in production

4. **Risk**: Version conflicts with optimistic updates
   **Mitigation**: Add version tracking for frequently edited entities and implement conflict resolution

## Success Metrics

Success will be measured by:

1. **Reduced Network Requests**: At least 30% reduction in API calls for common user flows
2. **Improved UI Responsiveness**: Actions feel immediate to users (< 100ms perceived latency)
3. **Data Consistency**: All optimistic updates eventually match server state
4. **Maintainable Code**: Clear patterns for adding new optimistic updates to future features
