"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notesApi } from "@/lib/redux/services/notesApi";
import { useState } from "react";

export default function Home() {
  const [note, setNote] = useState("");
  const [createNote, { isLoading: isSaving }] =
    notesApi.useCreateNoteMutation();

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    try {
      await createNote({
        content: note,
        embedding: "",
      }).unwrap();

      // Clear the note area after successful save
      setNote("");
      console.log("Note saved successfully!");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">New Note</h2>
        <Textarea
          placeholder="Start writing your note here..."
          className="min-h-[300px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <Button
          onClick={handleSaveNote}
          disabled={isSaving || !note.trim()}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
}
