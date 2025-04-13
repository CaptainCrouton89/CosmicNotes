"use client";

import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { ToolbarHeader } from "@/components/editor/ToolbarHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { formatDateOnly } from "@/lib/utils";
import { Category, Zone } from "@/types/types";
import "@mdxeditor/editor/style.css";
import { ArrowLeft, Check, Clock, Loader2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useState } from "react";
import {
  CategorySelector,
  ItemList,
  NoteActions,
  TagList,
  ZoneSelector,
} from "./_components";
import {
  useNoteActions,
  useNoteEditor,
  useNoteItems,
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
  const { deleting, deleteNote } = useNoteActions(noteId);

  const {
    note,
    loading,
    content,
    saving,
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

  const { tags, tagDeleting, handleTagDelete, addTag } = useNoteTags(noteId);

  const { updatingField, updateCategory, updateZone } = useNoteMetadata(
    noteId,
    note?.content ?? ""
  );

  // Note items hook
  const {
    items,
    loading: itemsLoading,
    deleting: itemsDeleting,
    creating: itemsCreating,
    hasItems,
    isLoading: isLoadingItems,
    toggleItemStatus,
    createItem,
    deleteItem,
    refetchItems,
  } = useNoteItems(note);

  // Update editor content when note data is loaded
  useEffect(() => {
    if (note?.content && editorRef.current && !hasItems) {
      editorRef.current.setMarkdown(note.content);
    }
    if (note?.title) {
      setTitleValue(note.title);
    }
  }, [note, editorRef, hasItems]);

  // Refresh items when note is refreshed
  useEffect(() => {
    if (refreshing && hasItems) {
      refetchItems();
    }
  }, [refreshing, hasItems, refetchItems]);

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

  // Skip rendering or processing if deletion is in progress
  if (deleting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Deleting note...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col flex-1 py-6">
      <NoteActions
        onRefresh={refreshNote}
        onSave={saveNote}
        onDelete={deleteNote}
        hasChanges={hasChanges}
        isRefreshing={refreshing}
        isSaving={saving}
        disabled={!note || isEditingTitle}
      />
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
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
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help text-muted-foreground text-xs">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateOnly(note?.updated_at || "")}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>Created:</strong> {note?.created_at}
                    </div>
                    <div>
                      <strong>Last updated:</strong> {note?.updated_at}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {saving && (
                <div className="flex items-center gap-2">
                  <span>Saving...</span>
                </div>
              )}
            </TooltipProvider>
          </div>
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
        <div className="space-y-4 flex flex-col flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs px-4">
            {/* Note Metadata */}

            {/* Zone Selector */}
            {note.zone !== undefined && (
              <ZoneSelector
                zone={note.zone as Zone}
                updating={updatingField === "zone"}
                onUpdateZone={(zone) => updateZone(zone as Zone)}
                allowNull={false}
              />
            )}

            {/* Category Selector */}
            {note.category !== undefined && (
              <CategorySelector
                category={note.category}
                updating={updatingField === "category"}
                onUpdateCategory={(category) =>
                  updateCategory(category as Category)
                }
                allowNull={false}
              />
            )}

            {/* Tags */}
            <TagList
              tags={tags}
              onDeleteTag={handleTagDelete}
              deletingTag={tagDeleting}
              onAddTags={addTag}
            />
          </div>

          {/* Show ItemList if note has items, otherwise show the markdown editor */}
          {ITEM_CATEGORIES.includes(note.category) ? (
            <div className="w-full overflow-hidden flex-1 p-4">
              {isLoadingItems ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2">Loading items...</span>
                </div>
              ) : (
                <ItemList
                  items={items}
                  loading={itemsLoading}
                  deleting={itemsDeleting}
                  creating={itemsCreating}
                  onToggleStatus={toggleItemStatus}
                  onCreateItem={createItem}
                  onDeleteItem={deleteItem}
                />
              )}
            </div>
          ) : (
            <div
              className="w-full overflow-hidden flex-1 min-h-0 cursor-text"
              onClick={focusEditor}
            >
              <ToolbarHeader />
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
          )}
        </div>
      )}
    </div>
  );
}
