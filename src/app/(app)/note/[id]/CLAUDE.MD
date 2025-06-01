# Note Editor - Claude.md

This document provides comprehensive guidance for working with the Mercury note editor implementation.

## Architecture Overview

The note editor uses a **modular, hooks-based architecture** with clear separation of concerns:

- **Main Page** (`page.tsx`) - Orchestrates the entire editing experience
- **Custom Hooks** (`hooks/`) - Encapsulate business logic and state management
- **Components** (`_components/`) - Handle specific UI elements
- **Redux Toolkit Query** - API interactions and caching
- **Real-time Updates** - Custom events and React state

## Component Structure

### Main Page (`page.tsx`)
- Client-side only component (`"use client"`)
- Two distinct views based on category:
  - **Markdown Editor** (MDXEditor) - For most note types
  - **Item List** - For to-do and collection categories
- Integrates AI chat panel with slide animations
- Inline title editing with auto-save

### Sub-components (`_components/`)
- **CategorySelector** - 9 categories: scratchpad, to-do, journal, collection, brainstorm, research, learning, feedback, meeting
- **ZoneSelector** - personal, work, or other zones
- **TagList** - Autocomplete, deletion, keyboard navigation
- **ItemList** - Checkbox items with optimistic updates
- **NoteActions** - Save/delete with confirmation states

## Custom Hooks

### `useNoteEditor`
Core hook for content management:
- Content state and saving
- MDXEditor ref management
- Auto-save on blur
- Title updates
- AI classification refresh

### `useNoteItems`
For to-do/collection categories:
- Sorts incomplete items first
- Optimistic UI updates
- Per-item loading states
- Auto-refetch on category change

### `useNoteMetadata`
- Updates category and zone
- Includes content in requests
- Tracks updating states

### `useNoteTags`
- Add/delete operations
- AI suggestions with confidence scores
- Dialog management
- Cache invalidation

### `useNoteActions`
- Note deletion with navigation
- Prevents duplicate deletions

### `useExports`
- PDF and text export
- Custom PDF styling
- Print-friendly layouts

## State Management

1. **RTK Query** - Primary data layer with caching
2. **Local State** - UI states (dialogs, loading)
3. **Custom Events** - Cross-component communication
   - `noteModified` - AI tool updates
   - `clusterModified` - Tag changes

## MDXEditor Integration

```typescript
// Dynamic import to prevent SSR issues
const ForwardRefEditor = dynamic(
  () => import("@/components/editor/ForwardRefEditor"),
  { ssr: false }
);
```

**Plugins**: lists, headings, images, tables, markdown shortcuts, custom toolbar

## Real-time Updates

1. **Event-based** - Chat interface emits events, note page listens
2. **Auto-save** - On blur with debouncing
3. **Optimistic Updates** - Immediate UI updates with rollback

## Critical Workflows

### Note Loading
1. Fetch via RTK Query
2. Set editor content if no local changes
3. Update Redux UI slice with title

### Content Editing
1. Track changes with `hasChanges` flag
2. Auto-save on blur
3. Manual save via action button

### Category Switching
- Dynamic view switching (editor ↔ item list)
- Triggers item refetch for item categories
- Maintains content during transitions

### AI Integration
- Chat panel with category-specific prompts
- Tool invocations with progress states
- Automatic refresh after AI modifications

## API Endpoints

- `GET/PUT/DELETE /api/note/[noteId]` - Note CRUD
- `POST /api/note/[noteId]/item` - Add items
- `PUT/DELETE /api/note/[noteId]/item/[itemId]` - Update/delete items
- `POST/DELETE /api/note/[noteId]/tag/[tagId]` - Tag management
- `POST /api/note/[noteId]/refresh` - AI classification
- `GET /api/note/suggest-tags` - AI tag suggestions

## Important Gotchas

1. **Item Categories** - "to-do" and "collection" use ItemList, not MDXEditor
2. **Chat History** - Persisted with debouncing to prevent spam
3. **Event Cleanup** - Must remove listeners in useEffect cleanup
4. **Editor Ref** - Can be null, always check before operations
5. **SSR** - MDXEditor requires dynamic import with `ssr: false`
6. **Cache Invalidation** - Tag updates need cross-API invalidation
7. **Deletion Flow** - Shows loading, navigates immediately
8. **Content Sync** - Always include content when updating metadata

## Best Practices

1. Use optimistic updates for better UX
2. Show loading states for all async operations
3. Handle errors gracefully with toast notifications
4. Maintain consistency between editor and API state
5. Clean up event listeners to prevent memory leaks
6. Test category switching thoroughly
7. Ensure proper cache invalidation patterns