"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notesApi } from "@/lib/redux/services/notesApi";
import { format } from "date-fns";
import { Clock, Edit, List, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

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

  // Handle navigation to note detail
  const handleNoteClick = useCallback(
    (noteId: number) => {
      router.push(`/note/${noteId}`);
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

  // Format date helper function
  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy • h:mm a");
  }, []);

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
      .slice(0, 5); // Show only 5 most recent notes

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => handleCreateNote()}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Recent Notes Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Recent Notes</h2>
        </div>

        {notesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[160px] animate-pulse">
                <CardHeader className="bg-muted/30"></CardHeader>
                <CardContent className="bg-muted/20"></CardContent>
              </Card>
            ))}
          </div>
        ) : notesError ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-red-500">Failed to load recent notes</p>
            </CardContent>
          </Card>
        ) : recentNotes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No recent notes found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNotes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleNoteClick(note.id)}
              >
                <CardHeader>
                  <CardTitle>{getTitle(note)}</CardTitle>
                  <CardDescription className="flex justify-between items-center">
                    <span>{note.category}</span>
                    <time className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "MMM d, yyyy")}
                    </time>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Scratchpad Notes Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <List className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Scratchpad Notes</h2>
        </div>

        {notesLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[80px] animate-pulse">
                <CardContent className="bg-muted/20"></CardContent>
              </Card>
            ))}
          </div>
        ) : notesError ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-red-500">Failed to load scratchpad notes</p>
            </CardContent>
          </Card>
        ) : scratchpadNotes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No scratchpad notes found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleCreateNote("Scratchpad")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Scratchpad Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scratchpadNotes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleNoteClick(note.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">{getTitle(note)}</h3>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(note.created_at)}
                    </time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
