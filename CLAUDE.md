# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start development server on port 3900 with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Next.js linting
- `pnpm db:pull` - Generate TypeScript types from Supabase database schema

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router, React 19
- **Styling**: Tailwind CSS 4, Shadcn UI components
- **State**: Redux Toolkit with RTK Query
- **Database**: Supabase (PostgreSQL with vector search)
- **AI**: Anthropic Claude and OpenAI APIs
- **Editor**: MDXEditor for rich text

### Key Architectural Patterns

1. **Service Layer Architecture**

   - All business logic lives in service classes under `src/lib/services/`
   - Services use dependency injection pattern
   - Database operations go through `database/index.ts` wrapper

2. **API Routes Structure**

   - RESTful patterns in `src/app/api/`
   - All routes use Edge Runtime for performance
   - Standard error handling with `UserError` and `ApplicationError`

3. **Redux State Management**

   - Feature-based slices in `src/lib/redux/slices/`
   - RTK Query services in `src/lib/redux/services/`
   - Optimistic updates for better UX

4. **Component Organization**
   - Feature-based structure with `_components` folders
   - Custom hooks in `hooks/` folders for complex logic
   - Shared UI components in `src/components/ui/`

### Database Schema

Main tables:

- `cosmic_memory` - Notes with vector embeddings
- `cosmic_tags` - Tags with hierarchical relationships
- `cosmic_cluster` - AI-generated summaries of related notes
- `cosmic_collection_item` - Items extracted from notes

### Key Concepts

- **Categories**: Notes are categorized as scratchpad, to-do, journal, collection, learning, research, meeting, feedback, or brainstorm
- **Zones**: Personal or Work for organization
- **Vector Search**: Notes have embeddings for semantic search
- **Clusters**: AI-generated summaries linking related notes by tag

### Development Notes

- Always use the service layer for business logic, never put it in components or API routes
- Use Edge Runtime for all API routes unless file uploads are needed
- Follow the existing error handling patterns with proper error classes
- Maintain type safety by running `pnpm db:pull` after database schema changes
- The app supports PWA features including offline mode
- I am already running the dev server at all times