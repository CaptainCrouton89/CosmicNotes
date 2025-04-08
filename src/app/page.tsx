"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { Button } from "@/components/ui/button";
import { notesApi } from "@/lib/redux/services/notesApi";
import { MDXEditorMethods } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useCallback, useRef, useState } from "react";

export default function Home() {
  const [note, setNote] = useState("");
  const [createNote, { isLoading: isSaving }] =
    notesApi.useCreateNoteMutation();
  const editorRef = useRef<MDXEditorMethods>(null);

  const handleEditorChange = useCallback((markdown: string) => {
    setNote(markdown);
  }, []);

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    try {
      // Get the latest content from the editor
      const currentContent = editorRef.current?.getMarkdown() || note;

      await createNote({
        content: currentContent,
        embedding: "",
      }).unwrap();

      // Clear the editor after successful save
      setNote("");
      if (editorRef.current) {
        editorRef.current.setMarkdown("");
      }
      console.log("Note saved successfully!");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">New Note</h2>
        <div className="w-full border rounded-md overflow-hidden min-h-[300px]">
          <ForwardRefEditor
            ref={editorRef}
            markdown={note}
            onChange={handleEditorChange}
          />
        </div>
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
