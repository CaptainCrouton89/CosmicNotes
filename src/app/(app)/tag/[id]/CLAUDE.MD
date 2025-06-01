# Tag Page Architecture Guide

## Overview

The tag page (`/tag/[id]`) is a core feature of Mercury that displays notes organized by tag and category, with AI-generated cluster summaries and integrated chat functionality.

## Architecture

### Component Structure

```
tag/[id]/
├── page.tsx                     # Main page with Redux integration
├── _components/
│   ├── Header.tsx              # Tag name display with inline editing
│   ├── TagHeader.tsx           # Category tabs (scratchpad, journal, etc.)
│   ├── GenerateClusterButton.tsx # AI cluster generation trigger
│   ├── ClusterSummaryItems.tsx # Items display (DEPRECATED - use SimilarItemsList)
│   ├── RelatedNotes.tsx        # Grid of notes in category
│   ├── ChatButtons.tsx         # Chat panel toggles
│   └── LoadingStates.tsx       # Loading/error/empty states
└── hooks/
    └── useClusterItems.ts      # Extract items from cluster notes
```

### State Management

**Redux Slices:**

- `clusterSlice`: Manages active cluster, category, cluster map, valid categories
- `uiSlice`: Controls chat panel visibility

**RTK Query:**

- `tagsApi.useGetTagQuery`: Fetches tag with all relations
- `tagsApi.useGenerateClusterForCategoryMutation`: Triggers cluster generation

## Tag-Cluster Relationship

### Database Schema

- **cosmic_tags**: Parent tag entity
- **cosmic_cluster**: AI summaries per tag/category with embeddings
- **cosmic_memory**: Notes associated with tags
- **cosmic_collection_item**: Extracted items from notes

### Key Relationships

- One tag has multiple clusters (one per category)
- Clusters aggregate notes of the same category
- Clusters contain vector embeddings for semantic search
- Clusters can be marked "dirty" when underlying notes change

## AI Cluster Generation Workflow

### 1. Trigger Points

- GenerateClusterButton (manual)
- Empty state (automatic suggestion)
- Refresh dirty clusters

### 2. Generation Process

```
UI → API Route → TagService → ClusterService → AI Service → Database
```

### 3. Category-Specific Handling

- **Content Categories** (journal, learning, research): Full AI summaries with GPT-4
- **Item Categories** (to-do, collection): Empty clusters, items managed separately
- **Quick Categories** (scratchpad, feedback): Lighter summaries with GPT-4-mini

### 4. AI Prompt System

Each category has:

- Custom system prompt defining AI role
- Specific formatting instructions
- Model selection (GPT-4 vs GPT-4-mini)
- Output structure requirements

## Chat Integration

### Architecture

- ChatPanel component with ChatInterface
- Endpoint: `/api/cluster/chat`
- Context: All notes from current tag
- Tools: Note search, creation, update capabilities

### Chat History

- Stored in `cosmic_cluster.chat_history` (JSON)
- Auto-saved with 1-second debounce
- Loaded on component mount
- Cleared via UI action

### Suggested Prompts

- Category-specific prompts in `categoryPrompts.ts`
- Queue system for closed → open chat transitions
- Immediate append when chat is open

## Real-time Updates

### Event System

- `clusterModified`: Fired when clusters change
- `noteModified`: Fired when notes update
- Triggers automatic data refresh
- No cleanup on unmount (potential memory leak)

## Critical Features & Gotchas

### Performance Considerations

- **No pagination**: All notes loaded at once
- **Large datasets**: Can slow down with 100+ notes
- **Full re-renders**: Category switches reload entire component

### Error Handling Issues

- No error boundaries
- Inconsistent error patterns
- Silent failures in offline mode
- Console.error without user feedback

### Security Gaps

- No access control on tags
- Missing permission checks
- Any user can merge/modify any tag
- No CSRF protection

### Mobile Limitations

- Fixed chat height (500px)
- Small touch targets
- Bottom chat toggle can be obscured
- No offline support for tag routes

### Known Issues

- ClusterSummaryItems is deprecated but still used
- Race conditions in concurrent cluster generation
- Event listeners not cleaned up properly
- Multiple `any` type assertions

## Best Practices

### When Working on Tag Pages

1. Always check for existing clusters before generating
2. Handle empty states gracefully
3. Clean up event listeners on unmount
4. Use proper TypeScript types (avoid `any`)
5. Implement loading states for all async operations

### API Integration

1. Use Edge Runtime for performance
2. Add proper error handling with UserError/ApplicationError
3. Validate category parameters server-side
4. Implement request timeouts (60s max)

### State Updates

1. Use Redux for shared state
2. Keep local state minimal
3. Dispatch cluster events for cross-component updates
4. Avoid direct cluster manipulation outside services

## Common Workflows

### Adding New Category

1. Update category enum in types
2. Add prompts to categoryPrompts.ts
3. Update TagHeader tabs
4. Add specific cluster generation logic if needed

### Modifying Cluster Generation

1. Update prompts in `src/lib/prompts/`
2. Adjust ClusterService logic
3. Consider embedding regeneration
4. Test with various note counts

### Debugging Chat Issues

1. Check chat_history in database
2. Verify cluster context is passed
3. Monitor custom events in console
4. Check for tool invocation errors
