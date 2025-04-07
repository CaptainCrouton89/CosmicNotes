"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Tag, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Tag {
  id: number;
  tag: string;
  confidence: number;
  created_at: string;
}

interface Note {
  id: number;
  content: string;
  created_at: string;
  metadata: Record<string, string | number | boolean | null>;
}

export default function NotePage() {
  const params = useParams();
  const noteId = params.id;

  const [note, setNote] = useState<Note | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchNote() {
      try {
        setLoading(true);
        const [noteResponse, tagsResponse] = await Promise.all([
          fetch(`/api/note/${noteId}`),
          fetch(`/api/note/${noteId}/tags`),
        ]);

        if (!noteResponse.ok) {
          throw new Error("Failed to fetch note");
        }

        if (!tagsResponse.ok) {
          throw new Error("Failed to fetch tags");
        }

        const noteData = await noteResponse.json();
        const tagsData = await tagsResponse.json();

        setNote(noteData.note);
        setTags(tagsData.tags);
        setContent(noteData.note.content);
        setLastSaved(new Date());
      } catch (err) {
        console.error("Error fetching note:", err);
        setError("Failed to load note");
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [noteId]);

  const saveNote = useCallback(async () => {
    if (!note) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/note/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      const data = await response.json();
      setNote(data.note);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [note, noteId, content]);

  // Auto-save after 10 seconds of no typing
  useEffect(() => {
    if (!note) return;

    const timer = setTimeout(() => {
      saveNote();
    }, 10000);

    return () => clearTimeout(timer);
  }, [content, saveNote, note]);

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
      const response = await fetch(`/api/note/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setDeleteDialogOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
      setDeleting(false);
    }
  }, [note, noteId, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Note Details</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {saving
              ? "Saving..."
              : lastSaved
              ? `Last saved: ${formatDate(lastSaved.toISOString())}`
              : ""}
          </div>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={!note}>
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created: {formatDate(note.created_at)}</span>
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
                  className="text-xs flex items-center gap-1.5"
                >
                  <span>{tag.tag}</span>
                  <span className="opacity-60">
                    {Math.round(tag.confidence * 100)}%
                  </span>
                </Badge>
              ))}
            </div>
          )}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={saveNote}
            className="min-h-[200px] w-full"
            placeholder="Write your note..."
          />
        </div>
      )}
    </div>
  );
}
