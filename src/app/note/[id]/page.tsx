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
import "@mdxeditor/editor/style.css";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
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
    openTagDialog,
  } = useNoteTags(noteId);

  const { updatingField, formatDate, updateCategory, updateZone } =
    useNoteMetadata(noteId, note?.content);

  const { deleting, deleteNote } = useNoteActions(noteId);

  // Update editor content when note data is loaded
  useEffect(() => {
    if (note?.content && editorRef.current) {
      editorRef.current.setMarkdown(note.content);
    }
  }, [note, editorRef]);

  return (
    <div className="space-y-6 flex flex-col flex-1 py-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl xl:text-2xl font-bold truncate max-w-xs xl:max-w-md xl:max-w-lg">
            {note?.title || "Note Details"}
          </h1>
        </div>

        <NoteActions
          onRefresh={refreshNote}
          onSave={saveNote}
          onDelete={deleteNote}
          hasChanges={hasChanges}
          isRefreshing={refreshing}
          isSaving={saving}
          isDeleting={deleting}
          disabled={!note}
        />
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveSelectedTags} disabled={saving}>
              {saving ? "Saving Tags..." : "Save Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
