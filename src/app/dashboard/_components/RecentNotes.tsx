import { format } from "date-fns";
import { Clock, Edit } from "lucide-react";
import { CommonProps, Note } from "./types";

interface RecentNotesProps extends CommonProps {
  notes: Note[];
  isLoading: boolean;
  error: any;
}

export function RecentNotes({
  notes,
  isLoading,
  error,
  onNoteClick,
  getTitle,
}: RecentNotesProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent Notes</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[90px] animate-pulse rounded-md bg-muted/30"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-2 text-red-500 text-sm">
          Failed to load recent notes
        </div>
      ) : notes.length === 0 ? (
        <div className="p-2 text-center text-muted-foreground text-sm">
          No recent notes found
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {notes.map((note) => (
            <NoteCard
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

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  getTitle: (note: { title?: string; category?: string }) => string;
}

function NoteCard({ note, onClick, getTitle }: NoteCardProps) {
  return (
    <div
      className="border bg-card rounded-md p-2.5 cursor-pointer hover:shadow-sm hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="font-medium text-sm truncate max-w-[80%]">
            {getTitle(note)}
          </h3>
          <Edit className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
            {note.category}
          </span>
          <time className="text-[10px] text-muted-foreground">
            {format(new Date(note.created_at), "MMM d")}
          </time>
        </div>
      </div>
    </div>
  );
}
