# Supabase Client Architecture Guide

This guide explains the Supabase client configuration and usage patterns in Mercury.

## Client Types

### 1. Browser Client (`client.ts`)
- **Usage**: Client-side React components only
- **Key**: Public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **When to use**: 
  - React component authentication checks
  - Client-side auth state management
  - Never for direct database operations

### 2. Server Client (`server.ts`)
- **Usage**: Server-side code (API routes, server components, services)
- **Key**: Anonymous key with server-side cookie handling
- **When to use**:
  - All API routes
  - Server components
  - Service classes (via dependency injection)
  - Any server-side database operations

### 3. Service Role Client (`serviceRoleServer.ts`)
- **Usage**: Currently unused but available for elevated permissions
- **Key**: Service role key (`SUPABASE_SERVICE_ROLE_KEY`)
- **When to use**:
  - Admin operations bypassing RLS
  - Background jobs
  - Cross-user data operations
  - System-level operations

### 4. Middleware Client (`middleware.ts`)
- **Usage**: Next.js middleware for session management
- **Key**: Anonymous key
- **Purpose**: 
  - Session refresh on every request
  - Authentication redirects
  - Cookie management

## Authentication Patterns

### Server-Side (API Routes)
```typescript
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Client-Side (Components)
```typescript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Service Classes
```typescript
// Always receive client via constructor
constructor(private supabase: SupabaseClient<Database>) {}
```

## Usage Guidelines

### DO:
- Use server client for all API routes
- Pass server client to service classes via dependency injection
- Check authentication before database operations
- Use browser client only for auth state in components
- Scope all queries to authenticated user

### DON'T:
- Use service role client unless absolutely necessary
- Make database queries from client components
- Bypass authentication checks
- Store sensitive keys in client-side code
- Create Supabase clients inside service classes

## Security Considerations

### Critical Points:
1. **RLS Enforcement**: Anonymous key ensures Row Level Security applies
2. **User Scoping**: All queries must include user_id checks
3. **Authentication Gates**: Middleware + API routes enforce auth
4. **Cookie Security**: Server-side cookie handling for session management
5. **Environment Variables**: Never expose service role key to client

### Common Patterns:
```typescript
// API Route Pattern
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const service = new SomeService(supabase);
  // ... use service
}

// Service Pattern
class SomeService {
  constructor(private supabase: SupabaseClient<Database>) {}
  
  async getData(userId: string) {
    // All queries automatically scoped by RLS
    return await this.supabase
      .from('table')
      .select()
      .eq('user_id', userId);
  }
}
```

### Security Gotchas:
1. Service role client bypasses ALL security - use with extreme caution
2. Never trust client-side auth checks for security
3. Always validate user context in API routes
4. RLS policies are your primary security layer
5. Middleware auth check doesn't replace API route checks

## Edge Runtime Compatibility

All clients are Edge Runtime compatible:
- No Node.js specific APIs
- Cookie handling via Next.js cookies() API
- Async session management
- Compatible with Vercel Edge Functions