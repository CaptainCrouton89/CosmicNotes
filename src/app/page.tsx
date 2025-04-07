"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function Home() {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: note,
        }),
      });

      if (response.ok) {
        // Clear the note area after successful save
        setNote("");
        console.log("Note saved successfully!");
      } else {
        console.error("Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
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
