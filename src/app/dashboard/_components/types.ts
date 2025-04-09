export interface Note {
  id: number;
  title?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
  content?: string;
}

export interface TagFamily {
  id: number;
  tag: string;
  created_at: string;
  clusters?: { id: number; category: string; tag_count: number }[];
  todo_items?: { id: number; item: string; done: boolean }[];
}

export interface CommonProps {
  onNoteClick: (noteId: number) => void;
  onTagFamilyClick: (tagFamilyId: number) => void;
  onCreateNote: (category?: string) => void;
  onDeleteNote?: (noteId: number) => void;
  getTitle: (note: { title?: string; category?: string }) => string;
}
