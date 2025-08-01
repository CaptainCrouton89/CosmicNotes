"use client";

import { ZoneSelector } from "@/app/(app)/note/[id]/_components";
import { CategorySelector } from "@/app/(app)/note/[id]/_components/CategorySelector";
import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { ToolbarHeader } from "@/components/editor/ToolbarHeader";
import { LeftHeader } from "@/components/header/LeftHeader";
import { RightHeader } from "@/components/header/RightHeader";
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
import { useCallback, useEffect, useRef, useState } from "react";

const LOCAL_STORAGE_KEY = "homeContent_draft";

export default function HomeContent({
  initialSearchParams,
}: {
  initialSearchParams: { [key: string]: string | string[] | undefined };
}) {
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
  const [zoneForDialog, setZoneForDialog] = useState<Zone | undefined>(
    undefined
  );
  const [categoryForDialog, setCategoryForDialog] = useState<
    Category | undefined
  >(undefined);

  // Load draft from local storage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft && !note) {
      setNote(savedDraft);
      if (editorRef.current) {
        editorRef.current.setMarkdown(savedDraft);
      }
    }
  }, []);

  // Auto-save to local storage whenever note content changes
  useEffect(() => {
    if (note.trim()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, note);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [note]);

  // Clear local storage when note is successfully saved
  const clearDraft = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const categoryParam = initialSearchParams.category;
    if (categoryParam && CATEGORIES.includes(categoryParam as Category)) {
      setCategory(categoryParam as Category);
    }
  }, [initialSearchParams]);

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

  const handleConfirmAndSaveNoteDetails = useCallback(
    async (
      finalSuggestedTags: TagSuggestionWithSelected[],
      finalZone: Zone | undefined,
      finalCategory: Category | undefined
    ) => {
      if (!createdNoteId) return;

      try {
        setSavingTags(true);

        const tagsToSave = finalSuggestedTags
          .filter((tag) => tag.selected)
          .map((tag) => tag.name);

        await updateNote({
          id: createdNoteId,
          note: { tags: tagsToSave, zone: finalZone, category: finalCategory },
        }).unwrap();

        // Clear draft and reset form after successful save
        clearDraft();
        setNote("");
        setCategory(undefined);
        setZone(undefined);
        setZoneForDialog(undefined);
        setCategoryForDialog(undefined);
        setShowTagDialog(false);
        setCreatedNoteId(null);
        setSuggestedTags([]);
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
      } catch (err) {
        console.error("Error saving note details:", err);
        setError("Failed to save note details");
      } finally {
        setSavingTags(false);
      }
    },
    [createdNoteId, updateNote, setCategory, setZone, clearDraft]
  );

  const addCustomTag = useCallback((tag: string) => {
    setSuggestedTags((prev) => [
      ...prev,
      { name: tag, confidence: 0.8, selected: true },
    ]);
  }, []);

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    try {
      const currentContent = editorRef.current?.getMarkdown() || note;
      const createNotePromise = createNote({
        content: currentContent,
        category: category as Category,
        zone: zone as Zone,
      }).unwrap();

      if (category === "scratchpad") {
        // Clear draft and reset form for scratchpad saves
        clearDraft();
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
        // Clear draft and reset form for scratchpad saves
        clearDraft();
        setNote("");
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
        return;
      }
      setZoneForDialog(newNote.zone);
      setCategoryForDialog(newNote.category);

      try {
        const tags = await suggestedTagsPromise;
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
        // Clear draft and reset form on error
        clearDraft();
        setNote("");
        setCategory("scratchpad");
        setZone(undefined);
        setCategoryForDialog(undefined);
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

  // Listen for global save event (Command+S)
  useEffect(() => {
    const handleGlobalSave = (event: CustomEvent) => {
      const { pathname } = event.detail;
      // Only handle save if we're on the home page
      if (pathname === "/") {
        handleSaveNote();
      }
    };

    window.addEventListener('globalSave', handleGlobalSave as EventListener);
    return () => {
      window.removeEventListener('globalSave', handleGlobalSave as EventListener);
    };
  }, [handleSaveNote]);

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      )}
      <LeftHeader>
        <h1 className="font-bold">Cosmic Notes</h1>
      </LeftHeader>
      <ToolbarHeader />
      <div className="w-full flex-1 min-h-0 cursor-text" onClick={focusEditor}>
        <ForwardRefEditor
          ref={editorRef}
          markdown={note}
          onChange={handleEditorChange}
          autoFocus={true}
        />
      </div>
      <RightHeader>
        <div className="flex items-center gap-2 xl:gap-4 self-auto">
          <CategorySelector
            category={category}
            updating={isSaving}
            onUpdateCategory={setCategory}
          />
          <ZoneSelector
            zone={zone}
            updating={isSaving}
            onUpdateZone={setZone}
          />
          <Button
            onClick={handleSaveNote}
            variant="ghost"
            disabled={isSaving || !note.trim()}
          >
            <SaveIcon className="w-4 h-4" />
            {isSaving ? "Saving..." : ""}
          </Button>
        </div>
      </RightHeader>

      <TagSelectionDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        suggestedTags={suggestedTags}
        onToggleTagSelection={toggleTagSelection}
        onSave={handleConfirmAndSaveNoteDetails}
        isSaving={savingTags}
        onAddCustomTag={addCustomTag}
        initialZone={zoneForDialog}
        initialCategory={categoryForDialog}
      />
    </>
  );
}
