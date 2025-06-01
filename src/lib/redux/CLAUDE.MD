# Redux Architecture Guide

This guide documents the Redux implementation in Mercury, including RTK Query patterns, state management, and critical considerations.

## Architecture Overview

```
src/lib/redux/
├── hooks.ts          # Typed hooks (useAppDispatch, useAppSelector)
├── provider.tsx      # Redux Provider wrapper
├── store.ts          # Store configuration
├── slices/           # Redux Toolkit slices
│   ├── clusterSlice.ts   # Cluster state management
│   ├── noteSlice.ts      # Note selection/filtering
│   ├── searchSlice.ts    # Search functionality
│   └── uiSlice.ts        # UI state (dialogs, panels)
└── services/         # RTK Query API services
    ├── clustersApi.ts    # Cluster CRUD
    ├── itemsApi.ts       # To-do/collection items
    ├── notesApi.ts       # Note operations
    ├── settingsApi.ts    # User settings
    └── tagsApi.ts        # Tag management
```

## Slice Organization

### noteSlice
- **Purpose**: Note-related UI state
- **State**: `selectedNote`, `filterTags`, `sortOrder`, `viewMode`
- **Pattern**: Simple synchronous actions

### searchSlice
- **Purpose**: Search functionality
- **State**: `query`, `selectedCategory`, `results`, `hasSearched`
- **Pattern**: Integrates with RTK Query via `extraReducers`

### uiSlice
- **Purpose**: Global UI state
- **State**: `isChatVisible`, `header`, `headerMeta`, `isSearchDialogOpen`
- **Note**: Fixed initial state prevents SSR hydration mismatches

### clusterSlice
- **Purpose**: Cluster-related state
- **State**: `activeCluster`, `activeCategory`, `clusterMap`, `validNoteCategories`
- **Pattern**: Updates via `extraReducers` when tag data fetched

## RTK Query Service Patterns

### Common Configuration
```typescript
export const apiService = createApi({
  reducerPath: 'apiService',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api',
    fetchFn: fetch // Edge Runtime
  }),
  tagTypes: ['Tag', 'AnotherTag'],
  endpoints: (builder) => ({...})
})
```

### Service Highlights

**notesApi**:
- Pagination with stable cache keys via `serializeQueryArgs`
- `merge` function appends paginated results
- Cross-service tag invalidation
- Granular cache control with individual note tags

**itemsApi**:
- **Most complex optimistic updates**
- Updates multiple cache entries simultaneously
- Handles cluster view + note view consistency
- Full rollback on failure

**tagsApi**:
- Tag suggestions via mutation (POST)
- Cross-invalidates with notesApi
- Manages refinement and cluster generation

## State Shape & Data Flow

### Complete Redux State
```typescript
{
  note: NoteState,
  search: SearchState,
  ui: UiState,
  cluster: ClusterState,
  // RTK Query managed state
  notesApi: {...},
  tagsApi: {...},
  clustersApi: {...},
  itemsApi: {...},
  settingsApi: {...}
}
```

### Data Flow
1. Component → dispatch action/mutation
2. Reducer → synchronous state update
3. RTK Query → async operation with loading/error states
4. Cache invalidation → automatic refetch
5. Component → re-render with new data

## Optimistic Updates & Caching

### Optimistic Update Pattern
```typescript
onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
  // 1. Optimistically update cache
  const patches = [];
  patches.push(
    dispatch(api.util.updateQueryData('endpoint', arg, (draft) => {
      // Update draft
    }))
  );
  
  // 2. Wait for server response
  try {
    await queryFulfilled;
  } catch {
    // 3. Rollback on failure
    patches.forEach(p => p.undo());
  }
}
```

### Caching Strategies
- **Tag-based invalidation**: Precise control over refetches
- **Pagination handling**: Merge prevents duplicates
- **Cross-service invalidation**: Maintains data consistency
- **Timed caching**: Search results cached 30min (`keepUnusedDataFor: 1800`)

## Critical Gotchas & Best Practices

### Gotchas
1. **Circular Dependencies**: Use dynamic imports between API services
   ```typescript
   const { notesApi } = await import('./notesApi');
   ```

2. **SSR Hydration**: Always use fixed initial state in slices
   ```typescript
   const initialState: UiState = {
     isChatVisible: false, // Not undefined!
   }
   ```

3. **Type Instantiation**: Simplify complex types to avoid TS errors
   ```typescript
   // Avoid: DeepPartial<ComplexType>
   // Use: Specific interface
   ```

4. **Manual Cache Updates**: Sometimes required for complex scenarios
   ```typescript
   const cache = api.util.selectInvalidatedBy(getState(), [{ type: 'Tag' }]);
   ```

### Best Practices
1. **Type Safety**: Full TypeScript coverage with typed hooks
2. **Separation**: UI state in slices, server state in RTK Query
3. **Modular Services**: Independent but cross-invalidating
4. **Performance**: Optimistic updates for instant feedback
5. **Error Handling**: Consistent rollback patterns

### Unique Patterns
1. **Stable Pagination**: Custom `serializeQueryArgs` prevents cache duplication
2. **Dynamic Invalidation**: Services invalidate each other's caches
3. **State-Driven UI**: Redux drives most UI decisions
4. **Comprehensive Tags**: Every data type can be precisely invalidated

## Integration with Services

RTK Query services integrate with the service layer (`src/lib/services/`):
- API routes call service methods
- RTK Query handles caching/invalidation
- Service layer contains business logic
- Clean separation of concerns

## Usage Examples

### Basic Query
```typescript
const { data, isLoading, error } = useGetNotesQuery({ 
  page: 1, 
  limit: 10 
});
```

### Mutation with Optimistic Update
```typescript
const [updateItem] = useUpdateItemMutation();

await updateItem({ 
  id: itemId, 
  done: true 
}).unwrap();
```

### Cross-Service Invalidation
```typescript
// In tagsApi
provideTags: ['Tag'],
// In notesApi
invalidatesTags: ['Tag'], // Refetches tag data
```

This architecture provides robust state management with excellent DX through automatic hook generation and intelligent caching.