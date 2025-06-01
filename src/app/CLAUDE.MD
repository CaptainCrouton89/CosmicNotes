# src/app Directory Guide

This directory contains all Next.js App Router routes, layouts, and API endpoints for the Mercury application.

## Directory Structure

```
src/app/
├── (app)/          # Authenticated application routes
├── (marketing)/    # Public marketing pages
├── api/           # Edge API routes
├── auth/          # Authentication endpoints
├── login/         # Login/signup page
└── Root files     # Root layout, globals, etc.
```

## Key Architectural Patterns

### 1. Route Groups

- **(app)**: Protected routes requiring authentication
  - All routes check auth status and redirect to `/login` if not authenticated
  - Wrapped with sidebar layout and main content structure
  - Contains: dashboard, notes, search, tags, settings, chat

- **(marketing)**: Public routes
  - Minimal layout without authentication requirements
  - Currently just landing page, but structured for expansion

### 2. API Route Conventions

**Every API route MUST follow these patterns:**

```typescript
// 1. Always use Edge Runtime
export const runtime = "edge";

// 2. Initialize services with dependency injection
const services = initializeServices(supabase);

// 3. Standard error handling
try {
  // Business logic via services
} catch (err) {
  if (err instanceof UserError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  } else if (err instanceof ApplicationError) {
    console.error(`${err.message}: ${JSON.stringify(err.data)}`);
  }
  return NextResponse.json({ error: "There was an error..." }, { status: 500 });
}
```

### 3. Authentication Pattern

**Server Components (pages):**
```typescript
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  redirect("/login");
}
```

**API Routes:**
```typescript
const { user, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 4. Client vs Server Components

- **Server Components**: Authentication checks, data fetching, layouts
- **Client Components**: Interactive features, form handling, real-time updates
- Most pages use `"use client"` for rich interactivity

## Important Conventions

### Route Parameters (Next.js 15)
Parameters are now Promises and must be awaited or used with `use()`:
```typescript
// Old way (Next.js 14)
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
}

// New way (Next.js 15)
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

### API Response Patterns

**Success Response:**
```typescript
return NextResponse.json({ data: result });
```

**Paginated Response:**
```typescript
return NextResponse.json({
  data: items,
  totalCount,
  page,
  pageSize,
  totalPages: Math.ceil(totalCount / pageSize),
});
```

**Error Response:**
```typescript
return NextResponse.json({ error: "Error message" }, { status: 400 });
```

### Service Layer Usage

**NEVER put business logic in API routes.** Always use services:
```typescript
// ❌ BAD
const { data } = await supabase.from('cosmic_memory').select();

// ✅ GOOD
const notes = await services.noteService.getNotes(userId);
```

## Chat Integration

The app has deep AI chat integration:

1. **Global Chat Panel**: Can be toggled on any page via Redux state
2. **Context-Aware**: Chat knows current note/cluster context
3. **Tool Support**: Chat can search notes, create items, etc.
4. **Streaming**: Uses AI SDK for real-time streaming responses
5. **History**: Persisted per note/cluster in database

## Custom Events

The app uses custom events for cross-component communication:
- `noteModified`: Fired when a note is updated via chat
- `clusterModified`: Fired when a cluster is regenerated

Listen for these in components that need real-time updates.

## PWA Features

- Service worker registration in root layout
- Offline fallback page
- Install prompt component
- Web app manifest configuration

## Common Gotchas

1. **Edge Runtime Limitations**: No Node.js APIs, no file system access
2. **Circular Dependencies**: Always use `initializeServices()` in API routes
3. **Auth Checks**: Do in server components, not middleware
4. **Async Everything**: Most Next.js 15 props are now Promises
5. **Service Worker**: Only works in production or with HTTPS

## File Naming Conventions

- `page.tsx`: Route pages
- `route.ts`: API endpoints
- `layout.tsx`: Layout wrappers
- `_components/`: Feature-specific components
- `hooks/`: Custom hooks for complex logic

## Performance Considerations

1. All API routes use Edge Runtime for faster cold starts
2. Database queries are optimized with proper indexes
3. Vector search uses pgvector for semantic search
4. Images and heavy assets should be optimized

## Testing Approach

- No formal test suite currently
- Manual testing expected before commits
- Use TypeScript for type safety
- Run `pnpm lint` after changes

## Adding New Features

1. **New Page**: Add to appropriate route group
2. **New API**: Follow service layer pattern
3. **Authentication**: Use standard auth check pattern
4. **State Management**: Use Redux slices/RTK Query
5. **UI Components**: Prefer shadcn/ui components

Remember: This is a knowledge management app focused on capturing, organizing, and surfacing information through AI-powered features.