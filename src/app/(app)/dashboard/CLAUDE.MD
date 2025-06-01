# Dashboard Architecture Guide

## Overview

The dashboard serves as the main entry point, providing an at-a-glance view of recent notes, tags, and scratchpad items. It follows a modular component architecture with efficient data loading patterns.

## Component Structure

```
dashboard/
├── page.tsx              # Main orchestrator component
└── _components/
    ├── RecentNotes.tsx   # Last 7 days notes
    ├── ScratchpadNotes.tsx # Scratchpad category notes
    └── Tags.tsx          # All tags with note counts
```

### Key Architectural Patterns

1. **Shared Props Interface**: All section components implement `CommonProps` for consistency
2. **Self-Contained Sections**: Each component manages its own loading/error states
3. **Portal-Based Headers**: Uses `LeftHeader`/`RightHeader` rendered into layout targets

## Data Aggregation

### Fetching Strategy
- **Single API Call**: Fetches 50 notes via `notesApi.useGetNotesQuery()`
- **Client-Side Filtering**: Data processed with `useMemo` for each section
- **Tag Data**: Separate query for tags with note counts

### Processing Patterns
```typescript
// Recent notes: Last 7 days, sorted by date
const recentNotes = useMemo(() => 
  notes.filter(note => 
    new Date(note.createdAt) > sevenDaysAgo
  ).sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
, [notes]);

// Scratchpad: Category filter with age calculation
const scratchpadNotes = useMemo(() =>
  notes.filter(note => note.category === 'scratchpad')
, [notes]);
```

## Performance Considerations

### React Optimizations
- **useMemo**: For expensive filtering/sorting operations
- **useCallback**: Stable references for navigation and delete handlers
- **React.memo**: On header components to prevent re-renders

### RTK Query Configuration
- **Cache Duration**: 30 minutes for search results
- **Smart Invalidation**: Tag-based cache invalidation
- **Merge Function**: Supports pagination for future scaling

### Loading States
- Skeleton loaders for perceived performance
- Granular loading per section
- Error boundaries at component level

## Component Interactions

### Navigation Flow
```typescript
const handleNoteClick = useCallback((noteId: string) => {
  router.push(`/note/${noteId}`);
}, [router]);
```

### State Updates
- **Delete Operations**: Optimistic updates with error rollback
- **Cache Invalidation**: Automatic refetch on mutations
- **UI State**: Global chat panel visibility management

## Real-time Updates

Currently uses **polling-based updates** through RTK Query:
- Mutations trigger cache invalidation
- Related queries automatically refetch
- No WebSocket implementation yet

### Future Enhancement Path
```typescript
// Potential Supabase real-time integration
const channel = supabase
  .channel('dashboard-updates')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public',
    table: 'cosmic_memory'
  }, payload => {
    // Invalidate relevant caches
  })
  .subscribe();
```

## Critical Patterns & Gotchas

### 1. **Data Fetching Efficiency**
- Always fetch once, filter multiple times
- Avoid N+1 queries by using includes/joins

### 2. **Error Handling**
```typescript
// Component-level error state
const [deleteError, setDeleteError] = useState<string | null>(null);

// Graceful degradation
if (error) return <div>Unable to load dashboard</div>;
```

### 3. **Mobile Responsiveness**
- Grid layouts: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Touch-friendly targets (min 44px)
- Chat panel auto-hides on mobile

### 4. **Category Color Consistency**
```typescript
const categoryColors = {
  scratchpad: 'bg-yellow-100',
  journal: 'bg-blue-100',
  // ... maintain across app
};
```

### 5. **Performance Monitoring**
```typescript
// Track dashboard load time
useEffect(() => {
  performance.mark('dashboard-loaded');
  // Send to analytics
}, [isLoading]);
```

## Best Practices

1. **Keep Sections Independent**: Each component should be self-sufficient
2. **Optimize Re-renders**: Use memo/callback appropriately
3. **Handle Edge Cases**: Empty states, loading, errors
4. **Maintain Type Safety**: Leverage TypeScript interfaces
5. **Test Data Scenarios**: 0, 1, many, error cases

## Common Pitfalls to Avoid

- Don't fetch data in multiple components (use single source)
- Avoid inline function definitions in render
- Don't mutate RTK Query cache directly
- Remember to handle timezone differences for "recent" calculations
- Test with large datasets (1000+ notes)