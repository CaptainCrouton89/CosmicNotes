"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { TagSuggestion } from "@/components/TagSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notesApi } from "@/lib/redux/services/notesApi";
import { CATEGORIES, Category } from "@/types/types";
import { MDXEditorMethods } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

// Component that uses useSearchParams
function HomeContent() {
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category>("scratchpad");
  const [createNote, { isLoading: isSaving }] =
    notesApi.useCreateNoteMutation();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<number | null>(null);
  const [savingTags, setSavingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get category from URL if present
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && CATEGORIES.includes(categoryParam as Category)) {
      setCategory(categoryParam as Category);
    }
  }, [searchParams]);

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

      // Create the note with category if specified
      const result = await createNote({
        content: currentContent,
        embedding: "",
        category: category as Category, // Only include if set
      }).unwrap();

      // Store the created note ID for tag operations
      setCreatedNoteId(result.id);

      if (result.category === "scratchpad") {
        return;
      }
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
        setCategory("scratchpad"); // Reset category too
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setError("Failed to save note");
    }
  };
  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <div className="space-y-8 flex-1 min-h-0 flex flex-col pt-2 pb-4 md:pt-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      )}

      <div className="space-y-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-1 md:mb-4">
          <h2 className="text-xl font-semibold">New Note</h2>
          {category && <Badge className="ml-2">{category}</Badge>}
        </div>
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

      {/* Use the new TagSelectionDialog component */}
      {/* <TagSelectionDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        suggestedTags={suggestedTags}
        onToggleTagSelection={toggleTagSelection}
        onSaveTags={saveSelectedTags}
        onSkipTags={skipTags}
        isSaving={savingTags}
      /> */}
    </div>
  );
}

// Wrap the HomeContent in a Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
