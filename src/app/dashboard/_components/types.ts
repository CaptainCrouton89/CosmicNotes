export interface CommonProps {
  onNoteClick: (noteId: number) => void;
  onTagClick: (tagId: number) => void;
  onCreateNote: (category?: string) => void;
  onDeleteNote?: (noteId: number) => void;
  getTitle: (note: { title?: string; category?: string }) => string;
}
