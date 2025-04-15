"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { ForwardRefEditor } from "@/components/editor/ForwardRefEditor";
import { ToolbarHeader } from "@/components/editor/ToolbarHeader";
import { RightHeader } from "@/components/header/RightHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatWindow } from "@/hooks/useChatWindow";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setHeader } from "@/lib/redux/slices/uiSlice";
import { formatDate, formatDateOnly } from "@/lib/utils";
import { Category, Zone } from "@/types/types";
import "@mdxeditor/editor/style.css";
import {
  Brain,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  MoreVertical,
} from "lucide-react";
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
import { useExports } from "./hooks/useExports";
// Client-side only chat button to prevent hydration issues
const ChatButton = ({
  isChatVisible,
  toggleChat,
}: {
  isChatVisible: boolean;
  toggleChat: () => void;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during SSR and initial render
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="ml-2 whitespace-nowrap">
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={isChatVisible ? "default" : "outline"}
      size="sm"
      onClick={toggleChat}
      className="ml-2 whitespace-nowrap"
    >
      {isChatVisible ? (
        <>
          <div className="flex items-center gap-1 hidden lg:flex">
            <span>Close Chat</span>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <Brain className="h-4 w-4" />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1 hidden lg:block flex">
            <ChevronLeft
              className={`h-4 w-4 inline-flex ${
                isChatVisible ? "rotate-180" : ""
              } transition-transform`}
            />
            <span className="inline-flex">AI Chat</span>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <Brain className="h-4 w-4" />
          </div>
        </>
      )}
    </Button>
  );
};

export default function NotePage() {
  const params = useParams();
  const noteId = Number(params.id);
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const { toggleChat, isChatVisible } = useChatWindow();
  // Use custom hooks
  const { deleting, deleteNote } = useNoteActions(noteId);
  const dispatch = useAppDispatch();

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
    isItemCategory,
    isLoading: isLoadingItems,
    toggleItemStatus,
    createItem,
    deleteItem,
    refetchItems,
  } = useNoteItems(note);

  // Update editor content when note data is loaded
  useEffect(() => {
    if (note?.content && editorRef.current && !isItemCategory) {
      editorRef.current.setMarkdown(note.content);
    }
    if (note?.title) {
      setTitleValue(note.title);
      dispatch(setHeader(note.title));
    }
  }, [note, editorRef, isItemCategory]);

  // Refresh items when note is refreshed or when category changes
  useEffect(() => {
    if (refreshing || (note && ITEM_CATEGORIES.includes(note.category))) {
      refetchItems();
    }
  }, [refreshing, note, refetchItems]);

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

  const { exportRawText, exportToPDF } = useExports(editorRef, note);

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
    <div className="flex flex-col min-h-0 h-full relative">
      <RightHeader>
        <div className="flex items-center gap-2">
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
                    <strong>Created:</strong>{" "}
                    {formatDate(note?.created_at || "")}
                  </div>
                  <div>
                    <strong>Last updated:</strong>{" "}
                    {formatDate(note?.updated_at || "")}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={refreshNote}
                disabled={!note || isEditingTitle}
                className="cursor-pointer"
              >
                {refreshing
                  ? "Regenerating..."
                  : "Regenerate AI Classifications"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportRawText}
                disabled={!note || isEditingTitle}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Raw Text
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToPDF}
                disabled={!note || isEditingTitle}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </RightHeader>
      <div className="sticky top-0 z-20 w-full p-3 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          {note?.zone !== undefined && (
            <ZoneSelector
              zone={note.zone as Zone}
              updating={updatingField === "zone"}
              onUpdateZone={(zone) => updateZone(zone as Zone)}
              allowNull={false}
            />
          )}

          {note?.category !== undefined && (
            <CategorySelector
              category={note.category}
              updating={updatingField === "category"}
              onUpdateCategory={(category) =>
                updateCategory(category as Category)
              }
              allowNull={false}
            />
          )}
          <TagList
            tags={tags}
            onDeleteTag={handleTagDelete}
            deletingTag={tagDeleting}
            onAddTags={addTag}
          />
        </div>
        <div className="flex items-center gap-2">
          <NoteActions
            onSave={saveNote}
            onDelete={deleteNote}
            hasChanges={hasChanges}
            isSaving={saving}
            disabled={!note || isEditingTitle}
          />

          {/* Chat Toggle Button - Now using the client-only wrapper component */}
          <ChatButton isChatVisible={isChatVisible} toggleChat={toggleChat} />
        </div>
      </div>

      {/* Main content and chat area */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Main content section */}
        <div
          className={`w-full ${
            isChatVisible ? "md:w-3/5 overflow-y-auto" : "md:w-full"
          } pt-4 px-4 md:px-6 transition-all duration-300 flex flex-col overflow-y-auto pb-4`}
        >
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
            <div className="flex flex-col flex-1">
              {/* Show ItemList if note has items, otherwise show the markdown editor */}
              {ITEM_CATEGORIES.includes(note.category) ? (
                <div className="w-full overflow-hidden flex-1">
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

        {/* Chat panel */}
        <div
          className={`relative transition-all duration-300 ease-in-out ${
            isChatVisible
              ? "w-full md:w-2/5 border-t md:border-t-0 md:border-l border-gray-200 md:h-full flex flex-col"
              : "w-0 md:w-0 overflow-hidden"
          }`}
        >
          <ChatPanel
            endpoint="/api/note/chat"
            isVisible={isChatVisible}
            chatId={noteId.toString()}
            onToggle={toggleChat}
            additionalBody={{ note: note }}
          />
        </div>
      </div>
    </div>
  );
}
