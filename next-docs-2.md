<documentation>
# Supabase Server-Side Auth with Next.js (App Router)

## Overview

This guide explains how to set up server-side authentication in a Next.js app using Supabase, specifically with the App Router. It covers installing dependencies, configuring environment variables, creating Supabase client utilities, handling authentication middleware, and protecting routes.

---

## Key Steps

### 1. Install Required Packages

Install the Supabase client and SSR helper:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

### 2. Configure Environment Variables

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

Obtain these values from your Supabase project dashboard.

---

### 3. Create Supabase Client Utilities

Create a `utils/supabase` directory with:

- `client.ts` for browser/client components
- `server.ts` for server components, actions, and route handlers

Example for `client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

### 4. Set Up Middleware for Auth Token Refresh

Create `middleware.ts` at the project root (or in `src/`). This middleware:

- Refreshes expired auth tokens
- Passes refreshed tokens to server components and the browser

Example:

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude static/image/favicon routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Security Note:** Always use `supabase.auth.getUser()` to protect pages and user data. Do not trust `supabase.auth.getSession()` in server code.

---

### 5. Create a Login Page

Implement a login page using a Server Action to call Supabase's signup/login functions. Use the server client utility.

Example:

```tsx
import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  );
}
```

---

### 6. Update Auth Confirmation Path

If email confirmation is enabled, update the confirmation URL in the Supabase dashboard:

- Go to Auth templates > Confirm signup
- Change `{{ .ConfirmationURL }}` to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

---

### 7. Create Auth Confirmation Route Handler

Handle email confirmation by exchanging the token for an auth session.

Example (`app/auth/confirm/route.ts`):

```typescript
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }
  redirect("/error");
}
```

---

### 8. Protect Server Components and Access User Info

Use the server client utility to get the authenticated user in server components.

Example (`app/private/page.tsx`):

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function PrivatePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return <p>Hello {data.user.email}</p>;
}
```

---

## Best Practices & Notes

- Always use `supabase.auth.getUser()` for authentication checks on the server.
- Middleware is essential for keeping auth tokens fresh and secure.
- Never trust session data from cookies alone; always revalidate with Supabase.
- Use the client utility for browser-side Supabase calls (e.g., for realtime features).

---

## Links Used

- https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
  </documentation>
