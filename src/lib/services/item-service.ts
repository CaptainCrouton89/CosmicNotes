import { Database } from "@/types/database.types";
import { Category, CompleteItem, Item, Note } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "../embeddings";
import { convertContentToItems } from "./ai-service";
import { mapDbItemToItem } from "./database/mapper";
import { createQueryBuilder } from "./database/query-builder";
import { TagService } from "./tag-service";

type ItemInsert =
  Database["public"]["Tables"]["cosmic_collection_item"]["Insert"];

export class ItemService {
  private supabase: SupabaseClient<Database>;

  private tagService: TagService;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.tagService = new TagService(supabase);
  }

  async setTagService(tagService: TagService): Promise<void> {
    this.tagService = tagService;
  }

  private async updateClusterAndTagForItem(
    memory?: number,
    tagId?: number
  ): Promise<void> {
    if (!memory && !tagId) return;
    if (tagId) {
      await this.tagService.setTagDirty(tagId);
      return;
    }
    if (memory) {
      const { data: relatedTags, error: relatedTagsError } = await this.supabase
        .from("cosmic_memory_tag_map")
        .select("*")
        .eq("note", memory);

      if (relatedTagsError) throw new Error(relatedTagsError.message);

      const tagIds = relatedTags?.map((tag) => tag.tag) ?? [];

      await Promise.all(
        tagIds.map((tagId) => this.tagService.setTagDirty(tagId))
      );
    }
  }

  async createItem(
    item: ItemInsert & { memory: number }
  ): Promise<CompleteItem> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .insert(item)
      .select(
        "*, memory:cosmic_memory(*), cluster:cosmic_cluster(*, tag:cosmic_tags(*))"
      )
      .single();

    if (error) throw new Error(error.message);

    const embedding = await generateEmbedding(data.item);

    const newItem = {
      ...data,
      memory:
        data.memory as unknown as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      cluster:
        data.cluster as unknown as Database["public"]["Tables"]["cosmic_cluster"]["Row"],
      embedding,
    };

    await this.updateClusterAndTagForItem(
      data.memory?.id,
      data.cluster?.tag.id
    );

    return newItem;
  }

  async createItems(items: ItemInsert[]): Promise<CompleteItem[]> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .insert(items)
      .select(
        "*, memory:cosmic_memory(*), cluster:cosmic_cluster(*, tag:cosmic_tags(*))"
      );

    if (error) throw new Error(error.message);

    if (data.length === 0) return [];

    await this.updateClusterAndTagForItem(
      data[0].memory?.id,
      data[0].cluster?.tag.id
    );

    return data.map((item) => {
      return {
        ...item,
        memory:
          item.memory as unknown as Database["public"]["Tables"]["cosmic_memory"]["Row"],
        embedding: item.embedding || undefined,
        cluster:
          item.cluster as unknown as Database["public"]["Tables"]["cosmic_cluster"]["Row"],
      };
    });
  }

  async getItems(noteId: number): Promise<Item[]> {
    try {
      // Use QueryBuilder to get items with related data in a single query
      const queryBuilder = createQueryBuilder(
        this.supabase,
        "cosmic_collection_item"
      );
      const { data, error } = await queryBuilder.getByForeignKey(
        "memory",
        noteId,
        "*",
        {
          memory: "cosmic_memory(*)",
          cluster: "cosmic_cluster(*)",
        }
      );

      if (error) throw new Error(error.message);

      // Cast the data to the expected type
      const items =
        data as unknown as Database["public"]["Tables"]["cosmic_collection_item"]["Row"][];

      // Map the database items to application Item objects
      return items.map((item) => mapDbItemToItem(item));
    } catch (error) {
      console.error("Error in getItems:", error);
      throw error;
    }
  }

  async updateItem(
    item: ItemInsert & { memory?: number; cluster?: number }
  ): Promise<CompleteItem> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .update(item)
      .eq("id", item.id!)
      .select(
        "*, memory:cosmic_memory(*), cluster:cosmic_cluster(*, tag:cosmic_tags(*))"
      )
      .single();

    if (error) throw new Error(error.message);

    console.log("data", { ...data, embedding: "" });

    const newItem = {
      ...data,
      memory:
        data.memory as unknown as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      cluster:
        data.cluster as unknown as Database["public"]["Tables"]["cosmic_cluster"]["Row"],
      embedding: data.embedding || undefined,
    };

    await this.updateClusterAndTagForItem(
      data.memory?.id,
      data.cluster?.tag.id
    );

    return newItem;
  }

  async deleteItem(id: number): Promise<void> {
    // Get the item's cluster ID before deleting
    const { data: item, error: fetchError } = await this.supabase
      .from("cosmic_collection_item")
      .select(
        "cluster, memory:cosmic_memory(*), cluster:cosmic_cluster(*, tag:cosmic_tags(*))"
      )
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const { error } = await this.supabase
      .from("cosmic_collection_item")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    // Update the tag's timestamp if the item had a cluster
    await this.updateClusterAndTagForItem(
      item.memory?.id,
      item.cluster?.tag.id
    );
  }

  async getItem(id: number): Promise<CompleteItem> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .select("*, memory:cosmic_memory(*), cluster:cosmic_cluster(*)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    return {
      ...data,
      memory:
        data.memory as unknown as Database["public"]["Tables"]["cosmic_memory"]["Row"],
      embedding: data.embedding || undefined,
      cluster:
        data.cluster as unknown as Database["public"]["Tables"]["cosmic_cluster"]["Row"],
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

    return this.createItems(embeddedItems);
  }

  async getItemsByNoteId(noteId: number): Promise<Item[]> {
    const { data, error } = await this.supabase
      .from("cosmic_collection_item")
      .select("*")
      .eq("memory", noteId);

    if (error) throw new Error(error.message);

    return data.map((item) => ({
      ...item,
      memory: undefined,
      embedding: item.embedding || undefined,
      cluster: undefined,
    }));
  }
}
