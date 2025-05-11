<documentation>
# Supabase + Next.js Quickstart Guide

## Overview

This guide explains how to set up a Supabase project, create a database table, and query data from a Next.js application.

---

## 1. Create a Supabase Project

- Go to [database.new](https://database.new/) to create a new Supabase project.
- In the Table Editor, create a new table and insert sample data, or use the SQL Editor with the following SQL:

```sql
-- Create the table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- Insert sample data
insert into instruments (name)
values ('violin'), ('viola'), ('cello');

-- Enable Row Level Security (RLS)
alter table instruments enable row level security;
```

- Make the table publicly readable by adding an RLS policy:

```sql
create policy "public can read instruments"
on public.instruments
for select to anon
using (true);
```

---

## 2. Create a Next.js App

- Use the official template with Supabase, TypeScript, and Tailwind CSS:

```bash
npx create-next-app -e with-supabase
```

---

## 3. Configure Environment Variables

- Rename `.env.example` to `.env.local`.
- Add your Supabase Project URL and Anon Key (found in your Supabase dashboard):

```
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

---

## 4. Query Supabase Data in Next.js

- Create a file at `app/instruments/page.tsx`:

```typescript
import { createClient } from "@/utils/supabase/server";

export default async function Instruments() {
  const supabase = await createClient();
  const { data: instruments } = await supabase.from("instruments").select();
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}
```

---

## 5. Start the App

- Run the development server:

```bash
npm run dev
```

- Visit [http://localhost:3000/instruments](http://localhost:3000/instruments) to see the list of instruments.

---

## Next Steps

- Set up [Authentication](https://supabase.com/docs/guides/auth) for your app.
- [Insert more data](https://supabase.com/docs/guides/database/import-data) into your database.
- Use [Supabase Storage](https://supabase.com/docs/guides/storage) for file uploads.

---

## Links Used

- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
  </documentation>
