import { Button } from "@/components/ui/button";
import { differenceInDays, format } from "date-fns";
import { AlertCircle, List, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { CommonProps, Note } from "./types";

interface ScratchpadNotesProps
  extends Pick<
    CommonProps,
    "onNoteClick" | "onCreateNote" | "getTitle" | "onDeleteNote"
  > {
  notes: Note[];
  isLoading: boolean;
  error: any;
}

export function ScratchpadNotes({
  notes,
  isLoading,
  error,
  onNoteClick,
  onCreateNote,
  onDeleteNote,
  getTitle,
}: ScratchpadNotesProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Scratchpad Notes</h2>
        </div>
        {notes.length === 0 && !isLoading && !error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNote("Scratchpad")}
            className="h-6 px-2 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            New Scratchpad
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[42px] animate-pulse rounded-md bg-muted/20"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-2 text-red-500 text-sm">
          Failed to load scratchpad notes
        </div>
      ) : notes.length === 0 ? (
        <div className="p-2 text-center text-muted-foreground text-sm">
          No scratchpad notes found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {notes.map((note) => (
            <ScratchpadNoteCard
              key={note.id}
              note={note}
              onClick={() => onNoteClick(note.id)}
              onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
              getTitle={getTitle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ScratchpadNoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete?: () => void;
  getTitle: (note: { title?: string; category?: string }) => string;
}

function ScratchpadNoteCard({
  note,
  onClick,
  onDelete,
  getTitle,
}: ScratchpadNoteCardProps) {
  // Check if the note is older than a week
  const isOld = useCallback((dateString: string) => {
    const noteDate = new Date(dateString);
    const today = new Date();
    return differenceInDays(today, noteDate) >= 7;
  }, []);

  const noteIsOld = isOld(note.created_at);

  // Handle delete button click without triggering the card click
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  return (
    <div
      className={`border rounded-md p-2 cursor-pointer transition-all
        ${noteIsOld ? "border-amber-200 bg-amber-50/40" : "hover:bg-slate-50"} 
        hover:border-slate-300 hover:shadow-sm`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-sm truncate
              ${noteIsOld ? "text-amber-800" : ""}`}
          >
            {getTitle(note)}
            {noteIsOld && (
              <span className="inline-flex ml-1 items-center">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </span>
            )}
          </h3>
          <div className="flex items-center">
            <time
              className={`text-[10px] ${
                noteIsOld ? "text-amber-700" : "text-muted-foreground"
              }`}
            >
              {format(new Date(note.created_at), "MMM d, h:mm a")}
            </time>
            {noteIsOld && (
              <div className="text-[10px] text-amber-600 ml-2">
                (over a week old)
              </div>
            )}
          </div>
        </div>

        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="ml-2 p-1.5 hover:bg-red-100 rounded-md transition-colors
              focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete scratchpad note"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}
