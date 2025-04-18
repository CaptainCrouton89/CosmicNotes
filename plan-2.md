# Optimized Plan for Cache Invalidation and Optimistic Updates with RTK Query

## Overview

This document outlines a comprehensive plan to address inefficient cache invalidation patterns and implement optimistic updates in the Cosmic application using modern RTK Query best practices. These improvements will enhance user experience by reducing unnecessary network requests and providing immediate feedback for user actions.

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

### 1. Implement Hierarchical Cache Tags

Replace broad list invalidation with a structured tag hierarchy that represents entity relationships:

```typescript
// src/lib/redux/api/tagTypes.ts
export const TAG_TYPES = {
  NOTE: "Note",
  TAG: "Tag",
  ITEM: "Item",
  CLUSTER: "Cluster",
  SETTINGS: "Settings",
} as const;

export type TagType = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];

// Helper functions for generating tags
export const tagTypes = {
  // Generate full tag list for a query
  note: {
    all: { type: TAG_TYPES.NOTE, id: "LIST" },
    byId: (id: number) => ({ type: TAG_TYPES.NOTE, id }),
    byCategory: (category: string) => ({
      type: TAG_TYPES.NOTE,
      id: `category-${category}`,
    }),
    byTag: (tagId: number) => ({ type: TAG_TYPES.NOTE, id: `tag-${tagId}` }),
    list: (filters?: Record<string, any>) => {
      return {
        type: TAG_TYPES.NOTE,
        id: filters ? `list-${JSON.stringify(filters)}` : "LIST",
      };
    },
  },
  // Similar for other entity types
  tag: {
    all: { type: TAG_TYPES.TAG, id: "LIST" },
    byId: (id: number) => ({ type: TAG_TYPES.TAG, id }),
    withNotes: { type: TAG_TYPES.TAG, id: "with-notes" },
  },
  item: {
    all: { type: TAG_TYPES.ITEM, id: "LIST" },
    byId: (id: number) => ({ type: TAG_TYPES.ITEM, id }),
    byNote: (noteId: number) => ({
      type: TAG_TYPES.ITEM,
      id: `note-${noteId}`,
    }),
    byCluster: (clusterId: number) => ({
      type: TAG_TYPES.ITEM,
      id: `cluster-${clusterId}`,
    }),
  },
  cluster: {
    all: { type: TAG_TYPES.CLUSTER, id: "LIST" },
    byId: (id: number) => ({ type: TAG_TYPES.CLUSTER, id }),
    byTag: (tagId: number) => ({ type: TAG_TYPES.CLUSTER, id: `tag-${tagId}` }),
    byCategory: (category: string) => ({
      type: TAG_TYPES.CLUSTER,
      id: `category-${category}`,
    }),
  },
};
```

Apply this tag system to API endpoints:

```typescript
// Enhanced notesApi with improved tag patterns
export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    getNotes: builder.query<
      PaginatedResponse<Note>,
      { page?: number; limit?: number; category?: string; tagId?: number }
    >({
      query: ({ page = 1, limit = 10, category, tagId }) => {
        let url = `note?page=${page}&limit=${limit}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (tagId) url += `&tagId=${tagId}`;
        return url;
      },
      providesTags: (result, error, arg) => {
        const tags = [tagTypes.note.all];

        // Add category-specific tag if category filter was used
        if (arg.category) {
          tags.push(tagTypes.note.byCategory(arg.category));
        }

        // Add tag-specific tag if tag filter was used
        if (arg.tagId) {
          tags.push(tagTypes.note.byTag(arg.tagId));
        }

        // Add individual note tags
        if (result?.content) {
          tags.push(
            ...result.content.map((note) => tagTypes.note.byId(note.id))
          );
        }

        return tags;
      },
      // Configure cache lifetime (30 minutes)
      keepUnusedDataFor: 1800,
    }),
    // Other endpoints...
  }),
});
```

### 2. Implement Optimistic Updates with Proper Rollback

Add immediate UI feedback with proper optimistic update patterns:

```typescript
// Modern optimistic update pattern for toggling item completion
updateItem: builder.mutation<CompleteItem, { id: number; done: boolean; noteId?: number }>({
  query: ({ id, done }) => ({
    url: "item",
    method: "PUT",
    body: { id, done },
  }),
  // Selectively invalidate only the specific item
  invalidatesTags: (result, error, { id }) => [tagTypes.item.byId(id)],

  // Optimistic update implementation
  async onQueryStarted({ id, done, noteId }, { dispatch, queryFulfilled }) {
    // Collection of patches for potential rollback
    const patches = [];

    // Update the specific item by ID if it's cached
    patches.push(
      dispatch(
        itemsApi.util.updateQueryData('getItemById', id, draft => {
          Object.assign(draft, { done });
        })
      )
    );

    // Update item in the note items list if noteId is provided
    if (noteId) {
      patches.push(
        dispatch(
          itemsApi.util.updateQueryData('getItemsByNoteId', noteId, draft => {
            const item = draft.find(item => item.id === id);
            if (item) {
              item.done = done;
            }
          })
        )
      );
    }

    try {
      // Wait for the mutation to complete
      const { data: updatedItem } = await queryFulfilled;

      // If we have noteId, we can update the specific note in the cache
      if (noteId) {
        dispatch(
          notesApi.util.updateQueryData('getNote', noteId, draft => {
            if (draft.items) {
              const item = draft.items.find(item => item.id === id);
              if (item) {
                Object.assign(item, updatedItem);
              }
            }
          })
        );
      }
    } catch (error) {
      // If the mutation fails, undo all optimistic updates
      patches.forEach(patch => patch.undo());

      console.error('Failed to update item', error);
    }
  },
}),
```

### 3. Centralized Cache Management

Resolve circular dependencies and implement a centralized approach to cache management:

```typescript
// src/lib/redux/api/apiSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TAG_TYPES } from "./tagTypes";

// Base API slice with shared configuration
export const baseApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: () => ({}),
});

// Re-export from a central location
export { TAG_TYPES, tagTypes } from "./tagTypes";

// Export helpers for cross-API cache operations
export const invalidateCache = {
  note: (id: number, dispatch: any) => {
    dispatch(baseApi.util.invalidateTags([{ type: TAG_TYPES.NOTE, id }]));
  },
  tag: (id: number, dispatch: any) => {
    dispatch(baseApi.util.invalidateTags([{ type: TAG_TYPES.TAG, id }]));
  },
  // Add more as needed
};

// Individual API slices can now inject endpoints to the base API
// This resolves circular dependencies between API modules
```

Use this centralized approach in individual API slices:

```typescript
// src/lib/redux/services/notesApi.ts
import { baseApi, tagTypes } from "../api/apiSlice";

// Export the enhanced API with endpoints injected
export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotes: builder.query<
      PaginatedResponse<Note>,
      { page?: number; limit?: number; category?: string; tagId?: number }
    >({
      query: ({ page = 1, limit = 10, category, tagId }) => {
        let url = `note?page=${page}&limit=${limit}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (tagId) url += `&tagId=${tagId}`;
        return url;
      },
      providesTags: (result, error, arg) => {
        // Same tag logic as before
      },
    }),
    // Other endpoints...
  }),
  // Important: Don't override existing endpoints
  overrideExisting: false,
});

// Extract and export the generated hooks
export const {
  useGetNotesQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  // Add other hooks as needed
} = notesApi;
```

### 4. Sophisticated Refetching and Cache Lifecycle

Implement proper cache lifecycle management:

```typescript
// src/lib/redux/api/cacheLifecycle.ts
import { baseApi, TAG_TYPES } from "./apiSlice";

export const setCacheLifecycleOptions = {
  // Critical data should be kept fresh
  shortTerm: {
    // 5 minutes
    keepUnusedDataFor: 300,
    // Always refetch when component mounts
    refetchOnMountOrArgChange: true,
  },
  // Reference data can be kept longer
  mediumTerm: {
    // 30 minutes
    keepUnusedDataFor: 1800,
    // Refetch on mount if the data is older than 10 minutes
    refetchOnMountOrArgChange: 600,
  },
  // Rarely changing data
  longTerm: {
    // 2 hours
    keepUnusedDataFor: 7200,
    // Only refetch if arguments change
    refetchOnMountOrArgChange: false,
  },
};

// Subscribe to store changes to implement cross-endpoint cache management
export const setupCacheLifecycle = (store) => {
  // Listen for specific actions that should trigger cross-endpoint cache invalidation
  return (next) => (action) => {
    const result = next(action);

    // Example: When a note with tags is updated, invalidate related tag caches
    if (
      action.type.endsWith("/executeQuery/fulfilled") &&
      action.meta.arg.endpointName === "updateNote"
    ) {
      const { id, note } = action.meta.arg.originalArgs;

      if (note.tags || note.tagIds) {
        // Invalidate related tag caches
        store.dispatch(
          baseApi.util.invalidateTags([
            { type: TAG_TYPES.TAG, id: "LIST" },
            // Invalidate specific tags if available
            ...(note.tagIds || []).map((tagId) => ({
              type: TAG_TYPES.TAG,
              id: tagId,
            })),
          ])
        );
      }
    }

    return result;
  };
};
```

## Implementation Plan

### Phase 1: API Architecture Refactoring (3-4 days)

1. Create the centralized tag type system

   - Implement the TAG_TYPES and helper functions
   - Create the base API slice with proper tag types
   - Implement utilities for cross-API invalidation

2. Refactor API modules to use the centralized pattern
   - Convert each API module to use the injectEndpoints pattern
   - Remove circular dependencies between API modules
   - Update imports and exports for the new structure

### Phase 2: Enhanced Cache Invalidation (3-4 days)

1. Implement hierarchical tag patterns for each entity type

   - Update all providesTags functions with more granular tags
   - Refine invalidatesTags for more precise cache invalidation
   - Add entity relationship awareness to the tag system

2. Configure cache lifetime settings for different data types
   - Implement the cache lifecycle configuration system
   - Apply appropriate keepUnusedDataFor settings to each query
   - Set up proper refetchOnMountOrArgChange behavior

### Phase 3: Optimistic Updates Implementation (4-5 days)

1. Identify and implement optimistic updates for high-impact actions

   - Item completion toggling
   - Note creation and editing
   - Tag addition and removal
   - Task creation and deletion

2. Implement the updateQueryData pattern consistently
   - Create helper utilities for common optimistic update patterns
   - Implement proper rollback mechanisms
   - Test and refine the optimistic update flow

### Phase 4: Hook Refactoring and Component Integration (3-4 days)

1. Update custom hooks to leverage RTK Query features

   - Refactor useNoteItems to eliminate manual state management
   - Update useClusterItems to use optimistic updates
   - Consolidate duplicated logic in custom hooks

2. Refine component integration
   - Update components to properly handle loading, error and success states
   - Implement proper conditional fetching with skip
   - Add appropriate error handling and retry logic

### Phase 5: Testing and Performance Optimization (3-4 days)

1. Implement comprehensive testing

   - Create unit tests for cache behavior
   - Test optimistic updates and rollback scenarios
   - Verify cross-entity cache consistency

2. Performance monitoring and optimization
   - Implement tracking for network request reduction
   - Profile and optimize render performance
   - Tune cache settings based on real-world usage patterns

## Specific Implementation Examples

### 1. Note Creation with Optimistic Update

```typescript
createNote: builder.mutation<
  Note,
  Omit<NoteInput, "embedding"> & { tags?: string[]; tagIds?: number[] }
>({
  query: (note) => ({
    url: "note",
    method: "POST",
    body: note,
  }),
  // Target cache invalidation based on the created note properties
  invalidatesTags: (result) => [
    tagTypes.note.all,
    ...(result?.category ? [tagTypes.note.byCategory(result.category)] : []),
    ...(result?.tags?.map(tag => tagTypes.tag.byId(typeof tag === 'number' ? tag : tag.id)) || [])
  ],

  async onQueryStarted(note, { dispatch, queryFulfilled }) {
    // Helper for creating an optimistic note with sensible defaults
    const createOptimisticNote = (data: Partial<Note>): Note => ({
      id: -Date.now(), // Temporary negative ID to avoid conflicts
      title: data.title || "New Note",
      content: data.content || "",
      zone: data.zone || "personal",
      category: data.category || "scratchpad",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: data.metadata || {},
      ...data
    });

    // Create an optimistic note
    const optimisticNote = createOptimisticNote({
      title: note.title,
      content: note.content,
      zone: note.zone,
      category: note.category,
    });

    // Get the current filter arguments
    const listQueryArg = { page: 1, limit: 10 };

    // Add to list cache optimistically
    const patchResult = dispatch(
      notesApi.util.updateQueryData('getNotes', listQueryArg, draft => {
        draft.content.unshift(optimisticNote);
        draft.pagination.totalCount += 1;
      })
    );

    try {
      // Wait for the actual API response
      const { data: createdNote } = await queryFulfilled;

      // Replace the optimistic note with the real one
      dispatch(
        notesApi.util.updateQueryData('getNotes', listQueryArg, draft => {
          const index = draft.content.findIndex(note => note.id === optimisticNote.id);
          if (index >= 0) {
            draft.content[index] = createdNote;
          }
        })
      );

      // Cache the note detail view proactively
      dispatch(
        notesApi.util.upsertQueryData('getNote', createdNote.id, createdNote)
      );

    } catch (error) {
      // Undo the optimistic update on error
      patchResult.undo();
      console.error('Failed to create note', error);
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
  // More specific tag invalidation
  invalidatesTags: (result, error, { noteId, tagId }) => [
    tagTypes.note.byId(noteId),
    tagTypes.tag.byId(tagId),
    tagTypes.note.byTag(tagId),
  ],

  async onQueryStarted(
    { noteId, tagId, tagName },
    { dispatch, queryFulfilled, getState }
  ) {
    // Utility function to find a tag by ID
    const selectTagById = (state, id) => {
      const tagResult = baseApi.endpoints.getTag.select(id)(state);
      return tagResult.data;
    };

    // Get tag name if not provided
    let name = tagName;
    if (!name) {
      const state = getState();
      const tag = selectTagById(state, tagId);
      name = tag?.name || `Tag ${tagId}`;
    }

    // Collection of patches for potential rollback
    const patches = [];

    // Add tag optimistically to the note
    patches.push(
      dispatch(
        notesApi.util.updateQueryData("getNote", noteId, (draft) => {
          if (!draft.tags) {
            draft.tags = [];
          }

          if (!draft.tags.some((t) => t.id === tagId)) {
            draft.tags.push({ id: tagId, name });
          }
        })
      )
    );

    // Also update the tag with the note connection if this cache exists
    patches.push(
      dispatch(
        tagsApi.util.updateQueryData("getTag", tagId, (draft) => {
          if (!draft.notes) {
            draft.notes = [];
          }

          if (!draft.notes.some(n => n.id === noteId)) {
            // Find the note in cache, or create a placeholder
            const noteResult = notesApi.endpoints.getNote.select(noteId)(getState());
            const note = noteResult.data || { id: noteId };
            draft.notes.push(note);
            draft.note_count = (draft.note_count || 0) + 1;
          }
        })
      )
    );

    try {
      await queryFulfilled;
      // Success! The cache is already updated and will be properly invalidated
    } catch (error) {
      // Revert all optimistic updates
      patches.forEach(patch => patch.undo());
      console.error("Failed to add tag to note", error);
    }
  },
}),
```

### 3. Item Completion Toggle with Optimistic Updates

```typescript
updateItem: builder.mutation<
  CompleteItem,
  { id: number; done: boolean; noteId?: number; clusterId?: number }
>({
  query: ({ id, done }) => ({
    url: "item",
    method: "PUT",
    body: { id, done },
  }),
  // Targeted invalidation
  invalidatesTags: (result, error, { id }) => [tagTypes.item.byId(id)],

  async onQueryStarted({ id, done, noteId, clusterId }, { dispatch, queryFulfilled }) {
    // Helper for updating items in different caches
    const updateItemInCache = (endpointName, arg, updater) => {
      return dispatch(
        itemsApi.util.updateQueryData(endpointName, arg, draft => {
          updater(draft);
        })
      );
    };

    // Collection of patches
    const patches = [];

    // Update the specific item in any relevant cache
    if (noteId) {
      patches.push(
        updateItemInCache('getItemsByNoteId', noteId, draft => {
          const item = draft.find(item => item.id === id);
          if (item) {
            item.done = done;
            item.updated_at = new Date().toISOString();
          }
        })
      );

      // Also update the note cache if it exists
      patches.push(
        dispatch(
          notesApi.util.updateQueryData('getNote', noteId, draft => {
            if (draft.items) {
              const item = draft.items.find(item => item.id === id);
              if (item) {
                item.done = done;
                item.updated_at = new Date().toISOString();
              }
            }
          })
        )
      );
    }

    if (clusterId) {
      patches.push(
        dispatch(
          clustersApi.util.updateQueryData('getCluster', clusterId, draft => {
            if (draft.cluster_items) {
              const item = draft.cluster_items.find(item => item.id === id);
              if (item) {
                item.done = done;
                item.updated_at = new Date().toISOString();
              }
            }
          })
        )
      );
    }

    try {
      // Wait for the actual API response
      const { data: updatedItem } = await queryFulfilled;

      // We can optionally update additional fields from the server response
      // if needed, as the server might update more than just the done status

    } catch (error) {
      // Undo all optimistic updates on error
      patches.forEach(patch => patch.undo());
      console.error('Failed to update item status', error);
    }
  }
}),
```

## Risks and Mitigations

1. **Risk**: Complex optimistic updates might lead to inconsistent UI states
   **Mitigation**:

   - Use RTK Query's updateQueryData patches with proper undo support
   - Apply comprehensive testing for each optimistic update scenario
   - Implement monitoring for optimistic update failures

2. **Risk**: Over-optimization might make debugging more difficult
   **Mitigation**:

   - Use the Redux DevTools for tracking cache state
   - Add detailed logging in development mode
   - Create a debug middleware that tracks cache operations

3. **Risk**: Cache lifetime management might be too aggressive or too conservative
   **Mitigation**:

   - Implement data-driven cache lifetime adjustment
   - Add configurable cache settings via environment variables
   - Monitor cache hit/miss rates in production

4. **Risk**: Circular dependencies between API slices
   **Mitigation**:
   - Use the injectEndpoints pattern with a base API slice
   - Implement a centralized tag type system
   - Create proper abstractions for cross-API invalidation

## Success Metrics

1. **Reduced Network Requests**

   - At least 40% reduction in redundant API calls for common user flows
   - Measurable decrease in overall API server load

2. **Improved Perceived Performance**

   - User actions feel immediate (< 100ms perceived latency)
   - Elimination of loading spinners for common actions like toggling items
   - Reduced time-to-interactive for data-heavy screens

3. **Code Quality**

   - Elimination of circular dependencies between API modules
   - Reduced duplication in cache management code
   - More consistent patterns for data fetching and mutations

4. **Developer Experience**
   - Simplified component implementation with less manual state management
   - Clear patterns for adding new optimistic updates
   - Improved type safety for API operations
