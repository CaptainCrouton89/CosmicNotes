"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { Database } from "@/types/database.types";
import { MDXEditorMethods } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Define Note type from the same source as notesApi
type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"] & {
  cosmic_tags?: {
    tag: string;
    confidence: number;
    created_at: string;
  }[];
};

interface Tag {
  id: number;
  note: number;
  tag: string;
  confidence: number;
  created_at: string;
}

export default function NotePage() {
  const params = useParams();
  const noteId = params.id;

  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tagDeleting, setTagDeleting] = useState<string | null>(null);

  // Add Redux hooks
  const {
    data: note,
    isLoading: loading,
    refetch,
  } = notesApi.useGetNoteQuery(Number(noteId), {
    skip: !noteId,
  }) as {
    data: Note | undefined;
    isLoading: boolean;
    refetch: () => Promise<{ data: Note | undefined }>;
  };
  const [updateNote] = notesApi.useUpdateNoteMutation();
  const [deleteNoteMutation] = notesApi.useDeleteNoteMutation();
  const [deleteTag] = tagsApi.useDeleteTagMutation();

  // Define a function to fetch tags that can be reused
  const fetchTags = useCallback(async () => {
    if (!noteId) return;

    try {
      const tagsResponse = await fetch(`/api/note/${noteId}/tags`);

      if (!tagsResponse.ok) {
        throw new Error("Failed to fetch tags");
      }

      const tagsData = await tagsResponse.json();
      setTags(tagsData.tags);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to load tags");
    }
  }, [noteId]);

  // Fetch tags when the component mounts
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Update content when note data is loaded
  useEffect(() => {
    if (loading) {
      // Clear editor content while loading to prevent showing stale content
      setContent("");
    } else if (note) {
      setContent(note.content);
      console.log("Note content:", note.content);
      setLastSaved(new Date());
      setHasChanges(false);

      // Also manually reset editor content if reference exists
      if (editorRef.current) {
        editorRef.current.setMarkdown(note.content);
      }
    }
  }, [note, loading, noteId]);

  const handleEditorChange = useCallback((markdown: string) => {
    setContent(markdown);
    setHasChanges(true);
  }, []);

  const saveNote = useCallback(async () => {
    if (!note) return;

    try {
      setSaving(true);
      // Get the latest content from the editor
      const currentContent = editorRef.current?.getMarkdown() || content;

      await updateNote({
        id: Number(noteId),
        note: { content: currentContent },
      }).unwrap();

      // Refetch the note data and tags to ensure UI is updated
      await Promise.all([refetch(), fetchTags()]);

      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [note, noteId, content, updateNote, refetch, fetchTags]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${month} ${day}, ${year} at ${hours}:${minutes}`;
  };

  const deleteNote = useCallback(async () => {
    if (!note) return;

    try {
      setDeleting(true);
      // Replace direct fetch with RTK Query mutation
      await deleteNoteMutation(Number(noteId)).unwrap();

      setDeleteDialogOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
      setDeleting(false);
    }
  }, [note, noteId, router, deleteNoteMutation]);

  // Add refresh note function
  const refreshNote = useCallback(async () => {
    if (!noteId) return;

    try {
      setRefreshing(true);

      const response = await fetch(`/api/note/${noteId}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: noteId }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh note");
      }

      // Refetch note data and tags after refresh
      await Promise.all([refetch(), fetchTags()]);
    } catch (err) {
      console.error("Error refreshing note:", err);
      setError("Failed to refresh note");
    } finally {
      setRefreshing(false);
    }
  }, [noteId, refetch, fetchTags]);

  // Add a function to handle tag deletion
  const handleTagDelete = useCallback(
    async (tag: string) => {
      if (!noteId) return;

      try {
        setTagDeleting(tag);

        await deleteTag({
          noteId: Number(noteId),
          tag,
        }).unwrap();

        // Refresh tags after deletion
        await fetchTags();
      } catch (err) {
        console.error("Error deleting tag:", err);
        setError("Failed to delete tag");
      } finally {
        setTagDeleting(null);
      }
    },
    [noteId, deleteTag, fetchTags]
  );

  return (
    <div className="space-y-6 flex flex-col flex-1">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl lg:text-2xl font-bold truncate max-w-xs lg:max-w-md xl:max-w-lg">
            {note?.title || "Note Details"}
          </h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 self-end lg:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNote}
            disabled={refreshing || !note}
            className="h-9 px-3"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={saveNote}
            disabled={saving || !hasChanges || !note}
            className="h-9 px-3"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={!note}
                className="h-9 px-3"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Note</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this note? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteNote}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <p>Loading note...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      ) : !note ? (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-lg">
          Note not found
        </div>
      ) : (
        <div className="space-y-4 flex flex-col flex-1">
          <div className="flex flex-col gap-1 text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Created: {formatDate(note.created_at)}</span>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 ml-6">
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <span>Last saved: {formatDate(lastSaved.toISOString())}</span>
                )}
              </div>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Tags:</span>
              </div>
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1.5 pr-1 group"
                >
                  <span>{tag.tag}</span>
                  <span className="opacity-60">
                    {Math.round(tag.confidence * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleTagDelete(tag.tag);
                    }}
                    className="ml-1 p-0.5 rounded-full opacity-0 group-hover:opacity-70 hover:opacity-100 hover:bg-muted-foreground/10 transition-opacity"
                    title="Remove tag"
                    aria-label={`Remove tag ${tag.tag}`}
                    disabled={tagDeleting === tag.tag}
                  >
                    {tagDeleting === tag.tag ? (
                      <div className="w-3 h-3 border-t-2 border-muted-foreground rounded-full animate-spin"></div>
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="w-full border rounded-md overflow-hidden flex-1">
            <ForwardRefEditor
              key={String(noteId)}
              ref={editorRef}
              markdown={content}
              onChange={handleEditorChange}
              onBlur={() => {
                if (hasChanges) {
                  saveNote();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
