"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notesApi } from "@/lib/redux/services/notesApi";
import { MDXEditorMethods } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

// Define the TagSuggestion interface
interface TagSuggestion {
  tag: string;
  confidence: number;
  selected: boolean;
}

export default function Home() {
  const [note, setNote] = useState("");
  const [createNote, { isLoading: isSaving }] =
    notesApi.useCreateNoteMutation();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<number | null>(null);
  const [savingTags, setSavingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEditorChange = useCallback((markdown: string) => {
    setNote(markdown);
  }, []);

  const toggleTagSelection = useCallback((index: number) => {
    setSuggestedTags((prev) =>
      prev.map((tag, i) =>
        i === index ? { ...tag, selected: !tag.selected } : tag
      )
    );
  }, []);

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    try {
      // Get the latest content from the editor
      const currentContent = editorRef.current?.getMarkdown() || note;

      // Create the note
      const result = await createNote({
        content: currentContent,
        embedding: "",
      }).unwrap();

      // Store the created note ID for tag operations
      setCreatedNoteId(result.id);

      // Get tag suggestions
      try {
        const suggestResponse = await fetch(
          `/api/note/${result.id}/suggest-tags`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!suggestResponse.ok) {
          throw new Error("Failed to get tag suggestions");
        }

        const data = await suggestResponse.json();

        // Convert to TagSuggestion format and pre-select tags with high confidence
        // Also filter out any X20 tags that might have slipped through
        const suggestions: TagSuggestion[] = data.tags
          .filter(
            (tag: { tag: string; confidence: number }) =>
              tag.tag !== "X20" && !tag.tag.includes("X20")
          )
          .map((tag: { tag: string; confidence: number }) => ({
            tag: tag.tag,
            confidence: tag.confidence,
            selected: tag.confidence >= 0.8,
          }));

        setSuggestedTags(suggestions);
        setShowTagDialog(true);
      } catch (err) {
        console.error("Error getting tag suggestions:", err);
        setError("Failed to get tag suggestions");

        // Clear the editor even if tag suggestions fail
        setNote("");
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setError("Failed to save note");
    }
  };

  const saveSelectedTags = useCallback(async () => {
    if (!createdNoteId) return;

    try {
      setSavingTags(true);

      // Filter selected tags and also ensure no X20 tags are saved
      const tagsToSave = suggestedTags
        .filter(
          (tag) => tag.selected && tag.tag !== "X20" && !tag.tag.includes("X20")
        )
        .map((tag) => ({
          tag: tag.tag,
          confidence: tag.confidence,
        }));

      const response = await fetch(`/api/note/${createdNoteId}/save-tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: tagsToSave }),
      });

      if (!response.ok) {
        throw new Error("Failed to save tags");
      }

      // Close the dialog and navigate to the note page
      setShowTagDialog(false);

      // Clear the editor after successful save
      setNote("");
      if (editorRef.current) {
        editorRef.current.setMarkdown("");
      }

      // Optionally navigate to the created note
      router.push(`/note/${createdNoteId}`);
    } catch (err) {
      console.error("Error saving tags:", err);
      setError("Failed to save tags");
    } finally {
      setSavingTags(false);
    }
  }, [createdNoteId, suggestedTags, router]);

  const skipTags = useCallback(() => {
    // Just close the dialog and clear the editor
    setShowTagDialog(false);
    setNote("");
    if (editorRef.current) {
      editorRef.current.setMarkdown("");
    }
  }, []);

  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <div className="space-y-8 flex-1 min-h-0 flex flex-col">
      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      )}

      <div className="space-y-4 flex-1 min-h-0 flex flex-col">
        <h2 className="text-xl font-semibold">New Note</h2>
        <div
          className="w-full border rounded-md overflow-hidden flex-1 min-h-0 cursor-text"
          onClick={focusEditor}
        >
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

      {/* Tag Selection Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Tags</DialogTitle>
            <DialogDescription>
              Select tags for your note. Tags with high confidence are
              pre-selected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {suggestedTags.map((tag, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${index}`}
                    checked={tag.selected}
                    onCheckedChange={() => toggleTagSelection(index)}
                  />
                  <div className="flex items-center justify-between w-full">
                    <label
                      htmlFor={`tag-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {tag.tag}
                    </label>
                    <Badge variant="outline" className="ml-auto">
                      {Math.round(tag.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="ghost" onClick={skipTags}>
              Skip Tags
            </Button>
            <Button onClick={saveSelectedTags} disabled={savingTags}>
              {savingTags ? "Saving Tags..." : "Save Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
