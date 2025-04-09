"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { TagSelectionDialog } from "@/components/TagSelectionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "@mdxeditor/editor/style.css";
import { ArrowLeft, Check, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useState } from "react";
import { Zone } from "../_types";
import {
  CategorySelector,
  NoteActions,
  NoteMetadata,
  TagList,
  ZoneSelector,
} from "./_components";
import {
  useNoteActions,
  useNoteEditor,
  useNoteMetadata,
  useNoteTags,
} from "./hooks";

export default function NotePage() {
  const params = useParams();
  const noteId = Number(params.id);
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  // Use custom hooks
  const {
    note,
    loading,
    content,
    saving,
    lastSaved,
    hasChanges,
    error,
    refreshing,
    editorRef,
    handleEditorChange,
    saveNote,
    refreshNote,
    focusEditor,
    updateNoteTitle,
  } = useNoteEditor(noteId);

  const {
    tags,
    suggestedTags,
    showTagDialog,
    tagDeleting,
    setShowTagDialog,
    toggleTagSelection,
    saveSelectedTags,
    handleTagDelete,
  } = useNoteTags(noteId);

  const { updatingField, formatDate, updateCategory, updateZone } =
    useNoteMetadata(noteId, note?.content);

  const { deleting, deleteNote } = useNoteActions(noteId);

  // Update editor content when note data is loaded
  useEffect(() => {
    if (note?.content && editorRef.current) {
      editorRef.current.setMarkdown(note.content);
    }
    if (note?.title) {
      setTitleValue(note.title);
    }
  }, [note, editorRef]);

  const handleTitleClick = () => {
    if (!note || loading) return;
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!titleValue.trim()) {
      setTitleValue(note?.title || "");
      setIsEditingTitle(false);
      return;
    }

    if (titleValue !== note?.title) {
      await updateNoteTitle(titleValue);
    }

    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(note?.title || "");
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 py-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="text-xl xl:text-2xl font-bold w-full max-w-xs xl:max-w-md"
                placeholder="Note Title"
                onBlur={handleTitleSave}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTitleSave}
                className="text-green-500"
              >
                <Check className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTitleCancel}
                className="text-red-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-xl xl:text-2xl font-bold truncate max-w-xs xl:max-w-md xl:max-w-lg cursor-pointer hover:text-primary transition-colors px-2 py-1"
              onClick={handleTitleClick}
              title="Click to edit title"
            >
              {note?.title || "Note Details"}
            </h1>
          )}
        </div>

        <NoteActions
          onRefresh={refreshNote}
          onSave={saveNote}
          onDelete={deleteNote}
          hasChanges={hasChanges}
          isRefreshing={refreshing}
          isSaving={saving}
          isDeleting={deleting}
          disabled={!note || isEditingTitle}
        />
      </div>

      {/* Replace with TagSelectionDialog component */}
      <TagSelectionDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        suggestedTags={suggestedTags}
        onToggleTagSelection={toggleTagSelection}
        onSaveTags={saveSelectedTags}
        isSaving={saving}
        onSkipTags={() => setShowTagDialog(false)}
      />

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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
            {/* Note Metadata */}
            <NoteMetadata
              createdAt={note.created_at}
              lastSaved={lastSaved}
              isSaving={saving}
              formatDate={formatDate}
            />

            {/* Category Selector */}
            {note.category !== undefined && (
              <CategorySelector
                category={note.category}
                updating={updatingField === "category"}
                onUpdateCategory={updateCategory}
              />
            )}

            {/* Zone Selector */}
            {note.zone !== undefined && (
              <ZoneSelector
                zone={note.zone as Zone}
                updating={updatingField === "zone"}
                onUpdateZone={updateZone}
              />
            )}

            {/* Tags */}
            <TagList
              tags={tags}
              onDeleteTag={handleTagDelete}
              deletingTag={tagDeleting}
            />
          </div>

          <div
            className="w-full border rounded-md overflow-hidden flex-1 cursor-text"
            onClick={focusEditor}
          >
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
