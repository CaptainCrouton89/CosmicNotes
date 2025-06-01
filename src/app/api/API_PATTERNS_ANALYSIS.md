# Mercury API Routes Analysis

## Overview

The Mercury API follows a RESTful design pattern with Next.js App Router, using Edge Runtime for all routes. The API is organized by resource type with nested routes for related operations.

## Directory Structure

```
src/app/api/
├── chat/
│   ├── noteTools.ts        # AI tool definitions
│   └── route.ts           # General chat endpoint
├── cluster/
│   ├── [id]/
│   │   ├── chat-history/
│   │   │   └── route.ts   # GET/POST cluster chat history
│   │   └── route.ts       # GET/PUT/DELETE specific cluster
│   ├── chat/
│   │   └── route.ts       # POST cluster-specific chat
│   └── route.ts           # GET clusters list
├── item/
│   ├── [id]/
│   │   └── route.ts       # GET/PUT/DELETE specific item
│   └── route.ts           # GET/POST items
├── note/
│   ├── [noteId]/
│   │   ├── chat-history/
│   │   │   └── route.ts   # GET/POST note chat history
│   │   ├── item/
│   │   │   └── route.ts   # POST items to note
│   │   ├── refresh/
│   │   │   └── route.ts   # POST refresh note metadata
│   │   ├── tag/
│   │   │   └── [tagId]/
│   │   │       └── route.ts # DELETE note-tag relation
│   │   └── route.ts       # GET/PUT/DELETE specific note
│   ├── chat/
│   │   └── route.ts       # POST note-specific chat
│   ├── search/
│   │   └── route.ts       # GET semantic search
│   ├── suggest-tags/
│   │   └── route.ts       # POST AI tag suggestions
│   └── route.ts           # GET/POST notes
├── review/
│   ├── [id]/
│   │   └── route.ts       # GET/PUT specific review
│   ├── week/
│   │   └── route.ts       # GET weekly review data
│   └── route.ts           # GET reviews list
├── settings/
│   └── route.ts           # GET/PUT user settings
├── tag/
│   ├── [id]/
│   │   ├── cluster/
│   │   │   ├── [category]/
│   │   │   │   └── route.ts # POST generate cluster
│   │   │   └── route.ts     # GET clusters for tag
│   │   └── route.ts         # GET/PUT/DELETE specific tag
│   ├── apply-merges/
│   │   └── route.ts       # POST apply tag merges
│   ├── cleanup/
│   │   └── route.ts       # POST cleanup problematic tags
│   ├── refine/
│   │   └── route.ts       # POST AI tag refinement
│   └── route.ts           # GET/POST tags
└── todo/
    ├── [id]/
    │   └── route.ts       # GET/PUT/DELETE specific todo
    └── route.ts           # GET todos list
```

## Core Patterns

### 1. Route Structure

All routes follow consistent patterns:

```typescript
export const runtime = "edge"; // All routes use Edge Runtime

// Standard HTTP methods
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {}
export async function POST(req: NextRequest) {}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {}
```

### 2. Service Layer Pattern

All routes use dependency injection through `initializeServices()`:

```typescript
import { initializeServices } from "@/lib/services";

export async function GET(req: NextRequest) {
  const { noteService, tagService } = await initializeServices();
  // Use services for business logic
}
```

### 3. Error Handling

Consistent error handling pattern across all routes:

```typescript
try {
  // Route logic
} catch (error) {
  if (error instanceof UserError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (error instanceof ApplicationError) {
    console.error(`${error.message}: ${JSON.stringify(error.data)}`);
  } else {
    console.error(error);
  }
  
  return NextResponse.json(
    { error: "There was an error processing your request" },
    { status: 500 }
  );
}
```

### 4. Authentication

Authentication is handled via Supabase middleware:
- The middleware runs on all routes except static files
- It checks for authenticated users and redirects to `/login` if not authenticated
- Individual routes don't need to handle auth checks

### 5. Request/Response Patterns

#### Query Parameters
```typescript
const url = new URL(req.url);
const page = parseInt(url.searchParams.get("page") || "1");
const limit = parseInt(url.searchParams.get("limit") || "10");
const category = url.searchParams.get("category") as Category;
```

#### Request Body
```typescript
const requestData = await req.json();
if (!requestData) {
  throw new UserError("Missing request data");
}
```

#### Pagination Response
```typescript
return NextResponse.json({
  content: items,
  pagination: {
    page,
    limit,
    totalCount,
    totalPages,
    hasMore,
  },
});
```

### 6. Streaming Responses (Chat Endpoints)

Chat endpoints use AI SDK for streaming:

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = streamText({
  model: openai(getModeModel(mode)),
  temperature: 0.1,
  system: systemPrompt,
  messages,
  tools: { /* AI tools */ },
});

return result.toDataStreamResponse();
```

### 7. AI Tool Integration

Tools are defined using the `tool` function from the AI SDK:

```typescript
export const basicSearchNotesTool = tool({
  description: "Query notes by filtering",
  parameters: z.object({
    limit: z.number().optional().default(5),
    category: z.enum(CATEGORIES).optional(),
    // ... other params
  }),
  execute: async ({ limit, category }) => {
    const { noteService } = await initializeServices();
    // Tool implementation
  },
});
```

## Common Route Patterns

### 1. Resource CRUD Operations

Standard RESTful pattern for resources:
- `GET /api/[resource]` - List with pagination
- `POST /api/[resource]` - Create new
- `GET /api/[resource]/[id]` - Get specific
- `PUT /api/[resource]/[id]` - Update specific
- `DELETE /api/[resource]/[id]` - Delete specific

### 2. Nested Resource Routes

For related resources:
- `/api/note/[noteId]/tag/[tagId]` - Manage note-tag relations
- `/api/note/[noteId]/item` - Add items to note
- `/api/tag/[id]/cluster` - Get clusters for tag

### 3. Action Routes

For specific operations:
- `/api/note/[noteId]/refresh` - Refresh note metadata
- `/api/tag/cleanup` - Cleanup problematic tags
- `/api/tag/refine` - AI-powered tag refinement
- `/api/note/suggest-tags` - Get AI tag suggestions

### 4. Search Routes

Specialized search endpoints:
- `/api/note/search` - Semantic search using embeddings
- Chat tools provide both basic (filter) and deep (semantic) search

## Key Implementation Details

### 1. Database Interaction

All database operations go through service classes:
```typescript
const { noteService } = await initializeServices();
const note = await noteService.getNoteById(id);
```

### 2. Type Safety

- Uses TypeScript with strict typing
- Zod for runtime validation in AI tools
- Database types generated from Supabase schema

### 3. Performance Optimizations

- Edge Runtime for all routes
- Efficient pagination with limit/offset
- Vector search for semantic queries
- Streaming responses for chat

### 4. Security Considerations

- Input validation using UserError
- Parameterized queries through service layer
- Authentication via Supabase middleware
- Proper error messages (no sensitive data exposure)

## Special Patterns

### 1. Chat History Management

Both notes and clusters have chat history:
- `GET` retrieves existing history
- `POST` saves new history
- History includes messages and metadata

### 2. AI Integration

Multiple AI-powered endpoints:
- Chat interfaces with tool support
- Tag suggestion and refinement
- Cluster generation
- Web scraping and search capabilities

### 3. Batch Operations

Some routes handle batch operations:
- `/api/tag/apply-merges` - Apply multiple tag merges
- `/api/tag/cleanup` - Clean multiple problematic tags

## Best Practices Observed

1. **Consistent naming**: Routes follow resource/action pattern
2. **Error boundaries**: All routes wrapped in try-catch
3. **Service layer**: Business logic separated from routes
4. **Type safety**: Full TypeScript with proper types
5. **Edge-first**: All routes use Edge Runtime
6. **Streaming**: Chat responses use streaming for better UX
7. **Validation**: Input validation with clear error messages
8. **Logging**: Errors logged with context
9. **RESTful design**: Standard HTTP methods and status codes
10. **Modular tools**: AI tools defined separately and reused

## Common Utilities

### Error Classes
- `UserError`: Client errors (400)
- `ApplicationError`: Server errors with logging

### Service Initialization
- `initializeServices()`: Creates all services with dependencies

### AI Utilities
- `getModeModel()`: Selects AI model based on mode
- Tool definitions for consistent AI interactions

## Authentication Flow

1. Middleware checks all requests
2. Creates Supabase client with request cookies
3. Calls `auth.getUser()` to verify session
4. Redirects to `/login` if not authenticated
5. Individual routes receive authenticated requests

This architecture provides a clean, maintainable API with consistent patterns, proper error handling, and efficient performance through Edge Runtime and streaming capabilities.