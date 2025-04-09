export interface Note {
  id: number;
  title?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  cosmic_tags?: { tag: string }[];
}
