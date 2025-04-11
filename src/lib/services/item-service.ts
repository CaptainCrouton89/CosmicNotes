import { Database } from "@/types/database.types";
import { Category, CompleteItem, Item, Note } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "../embeddings";
import { convertContentToItems } from "./ai-service";

type ItemInsert =
  Database["public"]["Tables"]["cosmic_collection_item"]["Insert"];

export class ItemService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async createItem(
    item: ItemInsert & { memory: number }
  ): Promise<CompleteItem> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .insert(item)
      .select("*, cosmic_memory(*)")
      .single();

    if (error) throw new Error(error.message);

    const embedding = await generateEmbedding(data.item);

    return {
      ...data,
      memory:
        data.cosmic_memory as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      embedding,
    };
  }

  async createItems(items: ItemInsert[]): Promise<CompleteItem[]> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .insert(items)
      .select("*, cosmic_memory(*)");

    if (error) throw new Error(error.message);

    return data.map((item) => ({
      ...item,
      memory:
        item.cosmic_memory as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      embedding: item.embedding || undefined,
    }));
  }

  async getItems(collectionId: number): Promise<Item[]> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .select("*, cosmic_memory(*)")
      .eq("collection_id", collectionId);

    if (error) throw new Error(error.message);

    return data.map((item) => ({
      ...item,
      memory:
        item.cosmic_memory as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      embedding: item.embedding || undefined,
    }));
  }

  async updateItem(
    item: ItemInsert & { memory: number }
  ): Promise<CompleteItem> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .update(item)
      .select("*, cosmic_memory(*)")
      .single();

    if (error) throw new Error(error.message);

    return {
      ...data,
      memory:
        data.cosmic_memory as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      embedding: data.embedding || undefined,
    };
  }

  async deleteItem(id: number): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_collection_item")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getItem(id: number): Promise<CompleteItem> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .select("*, cosmic_memory(*)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    return {
      ...data,
      memory:
        data.cosmic_memory as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      embedding: data.embedding || undefined,
    };
  }

  async saveNoteAsItems(
    note: Note & { content: string },
    category: Category
  ): Promise<CompleteItem[]> {
    if (!note) throw new Error("Note not found");

    const items = await convertContentToItems(note.content, category);
    const embeddedItems = await Promise.all(
      items.map(async (item) => ({
        item,
        memory: note.id,
        embedding: await generateEmbedding(item),
      }))
    );
    // delete cosmic_memory prop from each
    const itemsWithoutMemory = embeddedItems.map((item) => ({
      ...item,
      cosmic_memory: undefined,
    }));
    return this.createItems(itemsWithoutMemory);
  }
}
