"use client";

import { LeftHeader } from "@/components/header/LeftHeader";
import { RightHeader } from "@/components/header/RightHeader";
import { Button } from "@/components/ui/button";
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { RecentNotes, ScratchpadNotes, Tags } from "./_components";

export default function Dashboard() {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch notes with a larger limit to ensure we have enough data
  const {
    data: notesData,
    error: notesError,
    isLoading: notesLoading,
  } = notesApi.useGetNotesQuery({
    page: 1,
    limit: 50, // Fetch more notes to ensure we have enough for each section
  });

  // API mutation for deleting notes
  const [deleteNote] = notesApi.useDeleteNoteMutation();

  // Fetch tag families
  const {
    data: tagsData,
    error: tagsError,
    isLoading: tagsLoading,
  } = tagsApi.useGetAllTagsQuery();

  // Handle navigation to note detail
  const handleNoteClick = useCallback(
    (noteId: number) => {
      router.push(`/note/${noteId}`);
    },
    [router]
  );

  // Handle navigation to tag
  const handleTagClick = useCallback(
    (tagId: number, category?: string) => {
      if (category) {
        router.push(`/tag/${tagId}?category=${category}`);
      } else {
        router.push(`/tag/${tagId}`);
      }
    },
    [router]
  );

  // Handle create new note
  const handleCreateNote = useCallback(
    (category?: string) => {
      if (category) {
        // If category is specified, add a query parameter
        router.push(`/?category=${category}`);
      } else {
        router.push("/");
      }
    },
    [router]
  );

  // Handle deleting a note
  const handleDeleteNote = useCallback(
    async (noteId: number) => {
      try {
        setDeleteError(null);
        await deleteNote(noteId).unwrap();
      } catch (error) {
        console.error("Failed to delete note:", error);
        setDeleteError("Failed to delete note. Please try again.");
      }
    },
    [deleteNote]
  );

  // Filter and organize notes data
  const { recentNotes, scratchpadNotes } = useMemo(() => {
    if (!notesData?.content) {
      return {
        recentNotes: [],
        scratchpadNotes: [],
      };
    }

    // Get recent notes (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentNotes = notesData.content
      .filter((note) => new Date(note.updated_at) >= sevenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 6); // Show only 6 most recent notes

    // Get scratchpad notes
    const scratchpadNotes = notesData.content
      .filter((note) => note.category === "scratchpad")
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

    return {
      recentNotes,
      scratchpadNotes,
    };
  }, [notesData]);

  // Extract title from note
  const getTitle = useCallback(
    (note: { title?: string; category?: string }) => {
      if (note.title) {
        return note.title;
      }
      return `Untitled ${note.category}`;
    },
    []
  );

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <LeftHeader>
        <h1 className="font-bold">Dashboard</h1>
      </LeftHeader>
      <RightHeader>
        <Button onClick={() => handleCreateNote()} size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" />
          New Note
        </Button>
      </RightHeader>

      {deleteError && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
          {deleteError}
        </div>
      )}

      {/* Recent Notes Section */}
      <RecentNotes
        notes={recentNotes}
        isLoading={notesLoading}
        error={notesError}
        onNoteClick={handleNoteClick}
        onCreateNote={handleCreateNote}
        getTitle={getTitle}
        onTagClick={handleTagClick}
      />

      {/* Tags Section */}
      <Tags
        tags={tagsData?.slice(0, 6) ?? []}
        isLoading={tagsLoading}
        error={tagsError}
        onTagClick={handleTagClick}
      />

      {/* Scratchpad Notes Section */}
      <ScratchpadNotes
        notes={scratchpadNotes}
        isLoading={notesLoading}
        error={notesError}
        onNoteClick={handleNoteClick}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        getTitle={getTitle}
      />
    </div>
  );
}
