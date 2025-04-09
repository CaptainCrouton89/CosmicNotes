import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit, List, Plus } from "lucide-react";
import { CommonProps, Note } from "./types";

interface ScratchpadNotesProps
  extends Pick<CommonProps, "onNoteClick" | "onCreateNote" | "getTitle"> {
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
  getTitle: (note: { title?: string; category?: string }) => string;
}

function ScratchpadNoteCard({
  note,
  onClick,
  getTitle,
}: ScratchpadNoteCardProps) {
  return (
    <div
      className="border rounded-md p-2 cursor-pointer hover:bg-muted/5 transition-all"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm truncate max-w-[65%]">
          {getTitle(note)}
        </h3>
        <div className="flex items-center gap-2">
          <Edit className="h-3 w-3 text-muted-foreground" />
          <time className="text-[10px] text-muted-foreground whitespace-nowrap">
            {format(new Date(note.created_at), "MMM d, h:mm")}
          </time>
        </div>
      </div>
    </div>
  );
}
