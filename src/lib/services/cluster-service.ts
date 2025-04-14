import { Database } from "@/types/database.types";
import { Category, Cluster, CompleteCluster, Note } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "../embeddings";
import { linkifySummary } from "../utils";
import { generateNoteSummary } from "./ai-service";

export class ClusterService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async getClusters(
    tagId?: number,
    category?: Category,
    page?: number,
    limit?: number
  ): Promise<Cluster[]> {
    let query = this.supabase
      .from("cosmic_cluster")
      .select("*, cosmic_tags(name, id)");

    if (tagId) {
      query = query.eq("tag", tagId);
    }

    if (category) {
      query = query.eq("category", category);
    }

    // Handle pagination
    const pageSize = limit || 10;
    const pageIndex = page || 1;
    const start = (pageIndex - 1) * pageSize;

    query = query
      .range(start, start + pageSize - 1)
      .order("updated_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data.map((cluster) => ({
      ...cluster,
      tag: cluster.cosmic_tags,
    }));
  }

  async getClusterById(id: number): Promise<CompleteCluster> {
    const { data, error } = await this.supabase
      .from("cosmic_cluster")
      .select("*, cosmic_tags(name, id), cosmic_collection_item(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Get all memories associated with this tag id
    const { data: tagMappings, error: notesError } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select("note")
      .eq("tag", data.tag);

    if (notesError) throw notesError;

    // If no memories are found
    if (!tagMappings || tagMappings.length === 0) {
      return {
        ...data,
        tag: data.cosmic_tags,
        note_count: 0,
        notes: [],
        cluster_items: data.cosmic_collection_item.map((item) => ({
          ...item,
          cluster: undefined,
          embedding: item.embedding || "[]",
          memory: undefined,
        })),
      };
    }

    // Get all the memory IDs
    const memoryIds = tagMappings.map((mapping) => mapping.note);

    // Fetch the actual memories - REMOVED category filter
    const { data: memories, error: memoriesError } = await this.supabase
      .from("cosmic_memory")
      .select("*")
      .eq("category", data.category)
      .in("id", memoryIds);

    if (memoriesError) throw memoriesError;

    // Fetch all tags and items for these memories in batch
    const notesWithTagsAndItems = await Promise.all(
      memories.map(async (memory) => {
        // Get tags for this memory
        const { data: tags, error: tagsError } = await this.supabase
          .from("cosmic_memory_tag_map")
          .select("*, cosmic_tags(*)")
          .eq("note", memory.id);

        if (tagsError) throw tagsError;

        // Get collection items for this memory
        const { data: items, error: itemsError } = await this.supabase
          .from("cosmic_collection_item")
          .select("*")
          .eq("memory", memory.id);

        if (itemsError) throw itemsError;

        return {
          ...memory,
          tags: tags.map((tag) => tag.cosmic_tags),
          items: items || [],
        };
      })
    );

    return {
      ...data,
      tag: data.cosmic_tags,
      note_count: notesWithTagsAndItems.length,
      notes: notesWithTagsAndItems,
      cluster_items: data.cosmic_collection_item.map((item) => ({
        ...item,
        cluster: undefined,
        embedding: item.embedding || "[]",
        memory: undefined,
      })),
    };
  }

  async createEmptyCluster(
    tagId: number,
    category: Category
  ): Promise<Database["public"]["Tables"]["cosmic_cluster"]["Row"]> {
    // Create a zero vector with 1536 dimensions (standard for OpenAI's text-embedding-ada-002)
    const emptyEmbedding = JSON.stringify(new Array(1536).fill(0));

    const { data: insertResult, error: insertError } = await this.supabase
      .from("cosmic_cluster")
      .insert({
        summary: "",
        category,
        embedding: emptyEmbedding,
        tag: tagId,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    return insertResult;
  }

  async createClusterFromNotes(
    tagId: number,
    notes: Database["public"]["Tables"]["cosmic_memory"]["Row"][],
    category: Category
  ): Promise<Database["public"]["Tables"]["cosmic_cluster"]["Row"]> {
    let summary: string = "";
    if (category !== "to-do") {
      summary = await generateNoteSummary(notes as Note[], category);
    }
    const linkedSummary = linkifySummary(summary);

    const embedding = await generateEmbedding(
      notes.map((note) => note.content).join("\n")
    );

    const { data: insertResult, error: insertError } = await this.supabase
      .from("cosmic_cluster")
      .insert({
        summary: linkedSummary,
        category,
        embedding,
        tag: tagId,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error(
        `Error creating cluster for tag family ID ${tagId}/${category}:`,
        insertError
      );
      throw insertError;
    }

    if (!insertResult) {
      throw new Error("Cluster not created");
    }

    return insertResult;
  }

  async deleteClusterByCategory(
    tagId: number,
    category: Category
  ): Promise<void> {
    await this.supabase
      .from("cosmic_cluster")
      .delete()
      .eq("tag", tagId)
      .eq("category", category);
  }

  /**
   * Marks a cluster as dirty to indicate it needs to be regenerated
   * @param tagId The ID of the tag associated with the cluster
   * @param category Optional category filter
   */
  async setClusterDirty(tagId: number, category?: Category): Promise<void> {
    let query = this.supabase
      .from("cosmic_cluster")
      .update({ dirty: true, updated_at: new Date().toISOString() })
      .eq("tag", tagId);

    if (category) {
      query = query.eq("category", category);
    }

    const { error } = await query;

    if (error) throw error;
  }
}
