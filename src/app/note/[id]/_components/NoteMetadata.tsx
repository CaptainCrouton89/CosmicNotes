import { Clock } from "lucide-react";

interface NoteMetadataProps {
  createdAt: string;
  lastSaved: Date | null;
  isSaving: boolean;
  formatDate: (date: string) => string;
}

export function NoteMetadata({
  createdAt,
  lastSaved,
  isSaving,
  formatDate,
}: NoteMetadataProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>Created: {formatDate(createdAt)}</span>
      </div>
      {lastSaved && (
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <span>Last saved: {formatDate(lastSaved.toISOString())}</span>
          )}
        </div>
      )}
    </>
  );
}
