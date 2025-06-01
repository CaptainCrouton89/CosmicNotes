# Components Architecture Guide

This document provides guidance for working with components in the Mercury codebase.

## Directory Organization

```
src/components/
├── ui/               # Reusable UI primitives (Radix UI + Tailwind)
├── app-sidebar/      # Application sidebar feature
├── chat/             # Chat-related components
├── editor/           # MDX editor components
├── header/           # Portal-based header components
├── home-content/     # Home page specific content
└── (root)            # Feature components and dialogs
```

## UI Primitives (`ui/`)

All UI primitives follow these patterns:

1. **Built on Radix UI** with Tailwind styling
2. **Use CVA** for variant management
3. **Support `asChild`** prop for composition
4. **Implement `forwardRef`** for ref handling
5. **Extend native HTML props** for type safety

### Core Primitives

- **Form**: `button`, `input`, `textarea`, `label`, `checkbox`, `form`
- **Layout**: `card`, `separator`, `tabs`, `badge`
- **Overlays**: `dialog`, `dropdown-menu`, `sheet`, `tooltip`
- **Navigation**: `sidebar`
- **Feedback**: `skeleton`, `use-toast`
- **Selectors**: `generic-selector`, `entity-selector`

### Button Example Pattern

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: { default: "...", destructive: "...", outline: "..." },
      size: { default: "...", sm: "...", lg: "...", icon: "..." }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

## Feature Components

### Chat Interface (`chat-interface.tsx`)

- **Vercel AI SDK** integration with `useChat`
- **Three AI modes**: standard, medium, high
- **History persistence** via API endpoints
- **Tool invocation tracking** for note/cluster modifications
- **Auto-scrolling** with proper ref handling

Key Props:
```typescript
interface ChatInterfaceProps {
  initialMessages?: Message[];
  noteId?: string;
  clusterId?: string;
  onNoteModified?: () => void;
  onClusterModified?: () => void;
}
```

### Tag Selection Dialog (`TagSelectionDialog.tsx`)

- **Multi-step flow** for note creation
- **Autocomplete** with keyboard navigation
- **AI tag suggestions** with confidence scores
- **Zone/Category selection** integration

### Search Dialog (`search-dialog.tsx`)

- **Global search** for notes and clusters
- **Debounced input** for performance
- **Keyboard shortcuts** (Cmd+K)
- **Result highlighting** and navigation

### App Sidebar (`app-sidebar/`)

- **Time-based sections** (Today, Yesterday, Past Week, etc.)
- **Expandable/collapsible** sections
- **Notes list** with category badges
- **Tag browser** with counts

## Complex Components

### MDX Editor (`editor/`)

- **InitializedMDXEditor**: Full-featured MDX editor
- **ForwardRefEditor**: Ref forwarding wrapper
- **ToolbarHeader**: Portal-based toolbar
- **Custom styles** in `styles.css`

Configuration pattern:
```typescript
plugins={[
  toolbarPlugin({ toolbarContents: () => <KitchenSinkToolbar /> }),
  listsPlugin(),
  quotePlugin(),
  headingsPlugin(),
  // ...
]}
```

### Selector Components

**GenericSelector** - Base multi-select component:
- Search functionality
- Option creation
- Keyboard navigation
- Custom rendering

**EntitySelector** - Specialized for entities:
- Built on GenericSelector
- Adds entity-specific features

## State Management Patterns

1. **Local state** for UI concerns (open/close, hover)
2. **Redux** for shared application state
3. **URL state** for navigation-related state
4. **Server state** via RTK Query

## Critical Patterns & Gotchas

### 1. Portal Usage
- Headers use portals for toolbar injection
- Dialogs render in document.body
- Always cleanup portal content on unmount

### 2. Ref Forwarding
- All form components support refs
- Use `React.forwardRef` consistently
- Editor components require special ref handling

### 3. Event Handling
- Prevent event bubbling in nested interactive elements
- Use `e.stopPropagation()` in dropdown items
- Handle keyboard navigation properly

### 4. Performance
- Memoize expensive components (ChatPanel)
- Use `useDebounce` for search inputs
- Lazy load heavy components (Editor)

### 5. Accessibility
- All interactive elements have proper ARIA labels
- Keyboard navigation for all controls
- Focus management in dialogs/sheets

## Component Naming Conventions

- **UI primitives**: lowercase (`button.tsx`)
- **Feature components**: PascalCase (`ChatInterface.tsx`)
- **Hooks**: `use-` prefix (`use-toast.ts`)
- **Sub-components**: Folder with index exports

## Common Props Patterns

```typescript
// Extending HTML elements
interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props
}

// Variant props with CVA
interface ComponentProps extends VariantProps<typeof componentVariants> {
  // Additional props
}

// Polymorphic components
interface ComponentProps {
  asChild?: boolean; // Render as child component
}
```

## Testing Considerations

- UI primitives are stable and rarely need updates
- Feature components may need mocking for complex dependencies
- Use data-testid for E2E testing targets
- Mock API calls in component tests