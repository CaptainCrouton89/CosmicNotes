# Mercury API Documentation

This document provides comprehensive guidance for working with the Mercury API routes.

## API Structure & Naming Conventions

### Route Organization
```
/api/
├── note/          # Note CRUD operations
├── tag/           # Tag management
├── cluster/       # AI-generated summaries
├── item/          # Collection items
├── chat/          # AI chat interfaces
├── settings/      # User preferences
├── review/        # Review functionality
├── todo/          # Todo management
└── auth/          # Authentication callbacks
```

### Naming Patterns
- **Resource Routes**: `/api/{resource}/[id]/route.ts` for single resources
- **Collection Routes**: `/api/{resource}/route.ts` for collections
- **Action Routes**: `/api/{resource}/[id]/{action}/route.ts` for specific actions
- **Nested Resources**: `/api/{parent}/[parentId]/{child}/route.ts`

## Common Patterns & Gotchas

### 1. Edge Runtime (CRITICAL)
```typescript
// REQUIRED on every route file
export const runtime = "edge";
```
**Gotcha**: Forgetting this causes deployment failures. Edge runtime limitations:
- No Node.js APIs (fs, path, etc.)
- No file uploads (use standard runtime if needed)
- Limited to 25MB response size

### 2. Service Layer Pattern
```typescript
// Standard pattern for all routes
import { initializeServices } from "@/lib/services";

export async function GET(request: Request) {
  const services = await initializeServices();
  // Use services.noteService, services.tagService, etc.
}
```
**Gotcha**: Never instantiate services directly. Always use `initializeServices()`.

### 3. Error Handling
```typescript
import { UserError, ApplicationError } from "@/lib/errors";

// User errors (400)
throw new UserError("Invalid input");

// System errors (500)
throw new ApplicationError("Database connection failed");

// Standard error response
catch (error) {
  if (error instanceof UserError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  console.error("API Error:", error);
  return Response.json(
    { error: error instanceof Error ? error.message : "Unknown error" },
    { status: 500 }
  );
}
```

### 4. Request Parsing
```typescript
// Query parameters
const { searchParams } = new URL(request.url);
const page = parseInt(searchParams.get("page") || "1");

// Path parameters
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const noteId = params.id;
}

// JSON body
const body = await request.json();
```

### 5. Pagination Pattern
```typescript
// Request
?page=1&limit=20

// Response
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    totalCount: number,
    hasMore: boolean
  }
}
```

## Authentication & Authorization

### Pattern
Authentication is handled by Supabase middleware (`src/lib/supabase/middleware.ts`), not individual routes.

```typescript
// Routes automatically receive authenticated user via services
const services = await initializeServices();
// services already has authenticated supabase client
```

### Gotchas
- Never check auth in individual routes
- All `/api/*` routes are protected by default
- Public routes must be explicitly allowed in middleware

## Error Handling Best Practices

### 1. Use Typed Errors
```typescript
// Good
throw new UserError("Note not found");

// Bad
throw new Error("Note not found");
```

### 2. Consistent Error Responses
```typescript
// Always return this structure
{
  error: string
}
```

### 3. Log System Errors Only
```typescript
if (!(error instanceof UserError)) {
  console.error("Unexpected error:", error);
}
```

## Edge Runtime Considerations

### Do's
- Use streaming for large responses
- Leverage Edge caching
- Keep responses under 25MB
- Use JSON for all data

### Don'ts
- Use Node.js-specific modules
- Access the file system
- Use Buffer (use Uint8Array)
- Perform heavy computations

### Streaming Example (Chat)
```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of aiStream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
    controller.close();
  },
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  },
});
```

## Critical Endpoints

### 1. Note Management
- `GET /api/note/[noteId]` - Fetch single note with relations
- `PUT /api/note/[noteId]` - Update note (title, content, metadata)
- `DELETE /api/note/[noteId]` - Soft delete
- `POST /api/note` - Create new note
- `GET /api/note/search` - Semantic search with embeddings

### 2. AI Chat Integration
- `POST /api/chat` - General chat with tool support
- `POST /api/note/chat` - Note-specific chat
- `POST /api/cluster/chat` - Cluster-specific chat
- Tools: search, createNote, webScrape, getCurrentWeather

### 3. Tag Operations
- `GET /api/tag` - List all tags with note counts
- `POST /api/tag/cleanup` - AI-powered tag consolidation
- `POST /api/tag/apply-merges` - Execute tag merges
- `POST /api/tag/refine` - Refine tag names

### 4. Cluster Management
- `GET /api/cluster/[id]` - Get cluster with items
- `POST /api/tag/[id]/cluster/[category]` - Generate cluster
- `POST /api/cluster/[id]/refresh` - Regenerate summary

### 5. Action Endpoints
- `POST /api/note/[id]/refresh` - Update note metadata/embeddings
- `POST /api/note/suggest-tags` - AI tag suggestions
- `GET /api/note/[id]/chat-history` - Retrieve chat history
- `GET /api/review/week` - Weekly review data

## Common Gotchas

1. **Missing Edge Runtime**: Causes "Dynamic server usage" errors
2. **Direct Supabase Import**: Use services instead
3. **Synchronous Heavy Operations**: Use streaming or background jobs
4. **Missing Error Boundaries**: Always wrap in try-catch
5. **Hardcoded User IDs**: Get from authenticated context
6. **Not Validating Input**: Use Zod for complex inputs
7. **Forgetting Pagination**: Always limit large queries
8. **Raw SQL Without Params**: SQL injection risk
9. **Not Handling Null Cases**: Check for missing resources
10. **Streaming Without Headers**: Set proper content-type

## Database Interaction Patterns

### Through Services
```typescript
// Always use services
const notes = await services.noteService.searchNotes(query);

// Never direct Supabase queries in routes
// Bad: const { data } = await supabase.from('cosmic_memory')...
```

### Transaction Pattern
Services handle transactions internally. Routes should call single service methods that encapsulate the full operation.

## Testing Routes

```bash
# Local testing
curl http://localhost:3900/api/note/123

# With auth header (in production)
curl -H "Authorization: Bearer $TOKEN" https://app.com/api/note/123
```

## Performance Tips

1. Use `select` to limit fields
2. Implement proper indexes (see migrations)
3. Batch operations when possible
4. Cache immutable data
5. Stream large responses
6. Use Edge caching headers
7. Paginate all list endpoints

Remember: Routes are thin controllers. Business logic belongs in services.