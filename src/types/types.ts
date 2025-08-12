import { Database, Json } from "./database.types";

export type Mode = "standard" | "medium" | "high";

export interface TagSuggestion {
  name: string;
  confidence: number;
}

export type Item = Partial<CompleteItem> & {
  id: number;
  item: string;
  done: boolean;
  embedding?: string;
  created_at: string;
  updated_at: string;
};

export type CompleteItem = {
  id: number;
  item: string;
  done: boolean;
  embedding?: string;
  created_at: string;
  updated_at: string;
  memory?: Database["public"]["Tables"]["cosmic_memory"]["Row"];
  cluster?: Database["public"]["Tables"]["cosmic_cluster"]["Row"];
};

export type Note = Partial<CompleteNote> & {
  id: number;
  title: string;
  content: string;
  zone: Zone;
  category: Category;
  created_at: string;
  updated_at: string;
  metadata: Json;
};

export type CompleteNote = {
  id: number;
  title: string;
  content: string;
  zone: Zone;
  category: Category;
  created_at: string;
  updated_at: string;
  metadata: Json;
  tags: (Partial<Database["public"]["Tables"]["cosmic_tags"]["Row"]> & {
    id: number;
    name: string;
  })[];
  items: Partial<
    Database["public"]["Tables"]["cosmic_collection_item"]["Row"]
  >[];
};

export type Tag = Partial<CompleteTag> & {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  dirty: boolean;
};

export type CompleteTag = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  dirty: boolean;
  note_count: number;
  clusters: Database["public"]["Tables"]["cosmic_cluster"]["Row"][];
  notes: Database["public"]["Tables"]["cosmic_memory"]["Row"][];
};

export type Cluster = Partial<CompleteCluster> & {
  id: number;
  category: Category;
  summary: string;
  dirty: boolean;
  created_at: string;
  updated_at: string;
};

export type CompleteCluster = {
  id: number;
  category: Category;
  summary: string;
  dirty: boolean;
  created_at: string;
  updated_at: string;
  note_count: number;
  tag: Partial<Database["public"]["Tables"]["cosmic_tags"]["Row"]> & {
    id: number;
    name: string;
  };
  notes: CompleteNote[];
  cluster_items: Item[];
};

export const ZONES = ["personal", "work"] as const;
export type Zone = (typeof ZONES)[number];

export interface PaginatedResponse<T> {
  content: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const CATEGORIES = [
  "scratchpad",
  "to-do",
  "journal",
  "collection",
  "brainstorm",
  "research",
  "learning",
  "feedback",
  "meeting",
] as const;
export type Category = (typeof CATEGORIES)[number];
