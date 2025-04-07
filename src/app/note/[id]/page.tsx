"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Note {
  id: number;
  content: string;
  created_at: string;
  metadata: Record<string, any>;
}

export default function NotePage() {
  const params = useParams();
  const noteId = params.id;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchNote() {
      try {
        setLoading(true);
        const response = await fetch(`/api/note/${noteId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch note");
        }
        const data = await response.json();
        setNote(data.note);
        setContent(data.note.content);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Note Details</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {saving
            ? "Saving..."
            : lastSaved
            ? `Last saved: ${formatDate(lastSaved.toISOString())}`
            : ""}
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
          {/* <div className="p-6 border rounded-lg bg-card"> */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] w-full"
            placeholder="Write your note..."
          />
          {/* </div> */}
        </div>
      )}
    </div>
  );
}
