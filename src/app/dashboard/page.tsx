"use client";

import { Button } from "@/components/ui/button";
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagFamilyApi } from "@/lib/redux/services/tagFamilyApi";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { RecentNotes, ScratchpadNotes, TagFamilies } from "./_components";

export default function Dashboard() {
  const router = useRouter();

  // Fetch notes with a larger limit to ensure we have enough data
  const {
    data: notesData,
    error: notesError,
    isLoading: notesLoading,
  } = notesApi.useGetNotesQuery({
    page: 1,
    limit: 50, // Fetch more notes to ensure we have enough for each section
  });

  // Fetch tag families
  const {
    data: tagFamiliesData,
    error: tagFamiliesError,
    isLoading: tagFamiliesLoading,
  } = tagFamilyApi.useGetTagFamiliesQuery({
    page: 1,
    limit: 10, // Fetch recent tag families
  });

  // Handle navigation to note detail
  const handleNoteClick = useCallback(
    (noteId: number) => {
      router.push(`/note/${noteId}`);
    },
    [router]
  );

  // Handle navigation to tag family
  const handleTagFamilyClick = useCallback(
    (tagFamilyId: number) => {
      router.push(`/tag-family/${tagFamilyId}`);
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

  // Filter and organize notes data
  const { recentNotes, scratchpadNotes } = useMemo(() => {
    if (!notesData?.notes) {
      return {
        recentNotes: [],
        scratchpadNotes: [],
      };
    }

    // Get recent notes (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentNotes = notesData.notes
      .filter((note) => new Date(note.created_at) >= sevenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6); // Show only 6 most recent notes

    // Get scratchpad notes
    const scratchpadNotes = notesData.notes
      .filter((note) => note.category === "Scratchpad")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return {
      recentNotes,
      scratchpadNotes,
    };
  }, [notesData]);

  // Get recent tag families
  const recentTagFamilies = useMemo(() => {
    if (!tagFamiliesData?.tagFamilies) {
      return [];
    }

    // Sort by created_at and take the 6 most recent
    return [...tagFamiliesData.tagFamilies]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6);
  }, [tagFamiliesData]);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => handleCreateNote()} size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" />
          New Note
        </Button>
      </div>

      {/* Recent Notes Section */}
      <RecentNotes
        notes={recentNotes}
        isLoading={notesLoading}
        error={notesError}
        onNoteClick={handleNoteClick}
        onTagFamilyClick={handleTagFamilyClick}
        onCreateNote={handleCreateNote}
        getTitle={getTitle}
      />

      {/* Tag Families Section */}
      <TagFamilies
        tagFamilies={recentTagFamilies}
        isLoading={tagFamiliesLoading}
        error={tagFamiliesError}
        onTagFamilyClick={handleTagFamilyClick}
      />

      {/* Scratchpad Notes Section */}
      <ScratchpadNotes
        notes={scratchpadNotes}
        isLoading={notesLoading}
        error={notesError}
        onNoteClick={handleNoteClick}
        onCreateNote={handleCreateNote}
        getTitle={getTitle}
      />
    </div>
  );
}
