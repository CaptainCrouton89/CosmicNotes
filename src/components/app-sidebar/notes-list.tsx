import Link from "next/link";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Note } from "@/types/types";

interface NotesListProps {
  notes: Note[];
  emptyMessage: string;
  loading: boolean;
  error: any;
  titleFallback?: string;
}

// Component for rendering a list of notes
export const NotesList = ({
  notes,
  emptyMessage,
  loading,
  error,
  titleFallback = "Untitled",
}: NotesListProps) => {
  if (loading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  if (error) {
    return <div className="px-4 py-2 text-red-500">An error occurred</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="px-4 py-2 text-muted-foreground">{emptyMessage}</div>
    );
  }

  return (
    <SidebarMenu>
      {notes.map((note) => (
        <SidebarMenuItem key={note.id}>
          <SidebarMenuButton className="w-full text-left" asChild>
            <Link href={`/note/${note.id}`} className="flex justify-between">
              <span>
                {note.title || note.cosmic_tags?.[0]?.tag || titleFallback}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};
