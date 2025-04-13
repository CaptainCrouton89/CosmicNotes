"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { ToolbarHeader } from "@/components/editor/ToolbarHeader";
import {
  TagSelectionDialog,
  TagSuggestionWithSelected,
} from "@/components/TagSelectionDialog";
import { Button } from "@/components/ui/button";
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { CATEGORIES, Category, Zone } from "@/types/types";
import { MDXEditorMethods } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { SaveIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CategorySelector } from "./note/[id]/_components/CategorySelector";
import { ZoneSelector } from "./note/[id]/_components/ZoneSelector";
// Component that uses useSearchParams
function HomeContent() {
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [zone, setZone] = useState<Zone | undefined>(undefined);
  const [createNote, { isLoading: isSaving }] =
    notesApi.useCreateNoteMutation();
  const [updateNote] = notesApi.useUpdateNoteMutation();
  const [suggestTags] = tagsApi.useSuggestTagsMutation();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [suggestedTags, setSuggestedTags] = useState<
    TagSuggestionWithSelected[]
  >([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<number | null>(null);
  const [savingTags, setSavingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const saveSelectedTags = useCallback(async () => {
    if (!createdNoteId) return;

    try {
      setSavingTags(true);

      // Filter selected tags and prepare them for saving
      const tagsToSave = suggestedTags
        .filter((tag) => tag.selected)
        .map((tag) => tag.name);

      // Update the note with selected tags
      await updateNote({
        id: createdNoteId,
        note: { tags: tagsToSave },
      }).unwrap();

      // Clear editor and reset state
      setNote("");
      setCategory("scratchpad");
      setShowTagDialog(false);
      if (editorRef.current) {
        editorRef.current.setMarkdown("");
      }
    } catch (err) {
      console.error("Error saving tags:", err);
      setError("Failed to save tags");
    } finally {
      setSavingTags(false);
    }
  }, [createdNoteId, suggestedTags, updateNote]);

  const skipTags = useCallback(() => {
    // Clear editor and reset state without saving tags
    setNote("");
    setCategory("scratchpad");
    setShowTagDialog(false);
    if (editorRef.current) {
      editorRef.current.setMarkdown("");
    }
  }, []);

  const addCustomTag = useCallback((tag: string) => {
    setSuggestedTags((prev) => [
      ...prev,
      { name: tag, confidence: 0.8, selected: true },
    ]);
  }, []);

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    try {
      // Get the latest content from the editor
      const currentContent = editorRef.current?.getMarkdown() || note;

      // Create the note with category if specified
      const createNotePromise = createNote({
        content: currentContent,
        category: category as Category, // Only include if set
        zone: zone as Zone,
      }).unwrap();

      if (category === "scratchpad") {
        // For scratchpad notes, just clear the editor
        setNote("");
        setCategory(undefined);
        setZone(undefined);
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
        return;
      }

      const suggestedTagsPromise = suggestTags(currentContent).unwrap();

      const newNote = await createNotePromise;
      setCreatedNoteId(newNote.id);
      if (newNote.category === "scratchpad") {
        // For scratchpad notes, just clear the editor
        setNote("");
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
        return;
      }
      // Get tag suggestions using Redux API
      try {
        const tags = await suggestedTagsPromise;
        // Convert to TagSuggestion format and pre-select tags with high confidence
        const suggestions: TagSuggestionWithSelected[] = tags.map((tag) => ({
          name: tag.name,
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
      setShowTagDialog(false);
    }
  };

  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      )}

      <ToolbarHeader />
      <div className="w-full flex-1 min-h-0 cursor-text" onClick={focusEditor}>
        <ForwardRefEditor
          ref={editorRef}
          markdown={note}
          onChange={handleEditorChange}
          autoFocus={true}
        />
      </div>
      <div className="flex items-center gap-2 xl:gap-4 xl:self-auto self-start absolute top-3 right-3">
        <CategorySelector
          category={category}
          updating={isSaving}
          onUpdateCategory={setCategory}
        />
        <ZoneSelector zone={zone} updating={isSaving} onUpdateZone={setZone} />
        <Button
          onClick={handleSaveNote}
          variant="ghost"
          disabled={isSaving || !note.trim()}
        >
          <SaveIcon className="w-4 h-4" />
          {isSaving ? "Saving..." : ""}
        </Button>
      </div>

      {/* Tag selection dialog */}
      <TagSelectionDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        suggestedTags={suggestedTags}
        onToggleTagSelection={toggleTagSelection}
        onSaveTags={saveSelectedTags}
        onSkipTags={skipTags}
        isSaving={savingTags}
        onAddCustomTag={addCustomTag}
      />
    </>
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
