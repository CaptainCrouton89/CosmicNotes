# Cosmic Notes

Cosmic Notes is a modern note-taking application designed to help you organize your thoughts, ideas, and tasks with powerful AI-powered features. The application uses natural language processing to automatically suggest tags, categorize content, and help you find related notes.

## Features

- **Rich Text Editor**: Create and edit notes with a full-featured Markdown editor
- **Automatic Tagging**: AI suggests relevant tags based on your note content
- **Note Categorization**: Organize notes by categories (scratchpad, to-do, journal, etc.)
- **Personal/Work Zones**: Separate notes into personal or work zones
- **Search**: Powerful semantic search to find notes by content similarity
- **Tag Management**: Add, merge, and manage tags to organize your knowledge
- **Chat Interface**: Interact with your notes through a conversational interface
- **Clusters**: Automatically group related notes together
- **Responsive UI**: Modern interface built with React and Tailwind CSS

## Technology Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit
- **API Communication**: RTK Query
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **AI Capabilities**: Anthropic Claude, OpenAI
- **UI Components**: Radix UI & custom components
- **Text Editor**: MDXEditor

## Getting Started

### Prerequisites

- Node.js 18.x or later
- pnpm 8.x or later
- Supabase account
- Anthropic API key (for AI features)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key (optional)

# Optional configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3900
```

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3900](http://localhost:3900) to access the application.

### Database Setup

1. Create a new Supabase project
2. Run the SQL queries in `supabase_match_function.sql` to set up the vector matching functionality
3. Pull the database types (requires Supabase CLI):
   ```bash
   pnpm db:pull
   ```

## Project Structure

- `/src/app`: Next.js app router pages and components
- `/src/components`: Reusable UI components
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility functions, API services, and Redux store
- `/src/types`: TypeScript type definitions

## Key Features Explained

### Note Creation

Notes are created with metadata including:

- Content (Markdown)
- Category (scratchpad, to-do, journal, collection, etc.)
- Zone (personal, work)
- Tags (automatically suggested and manually selectable)

### Tag System

The tag system helps organize content through:

- Automatic tag suggestion based on note content
- Manual tag selection in a dialog after note creation
- Tag management for merging and organizing

### AI Integration

AI capabilities include:

- Content analysis for tag suggestion
- Semantic search for finding related notes
- Chat interface for interacting with your note collection

## Development Workflow

The project uses a task-based development system:

1. Run `pnpm list` to see current tasks
2. Tasks are tracked in the `/tasks` directory
3. Use scripts in `/scripts` for task management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
