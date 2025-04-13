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
      .select("*, cosmic_tags(name, id)")
      .eq("id", id)
      .single();

    if (error) throw error;

    console.log("Cluster data:", data);

    // Get all memories associated with this tag id
    const { data: tagMappings, error: notesError } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select("note")
      .eq("tag", data.tag);

    if (notesError) throw notesError;

    console.log("Tag mappings:", tagMappings);

    // If no memories are found
    if (!tagMappings || tagMappings.length === 0) {
      console.log("No tag mappings found for tag ID:", id);
      return {
        ...data,
        tag: data.cosmic_tags,
        note_count: 0,
        notes: [],
      };
    }

    // Get all the memory IDs
    const memoryIds = tagMappings.map((mapping) => mapping.note);
    console.log("Memory IDs:", memoryIds);

    // Fetch the actual memories - REMOVED category filter
    const { data: memories, error: memoriesError } = await this.supabase
      .from("cosmic_memory")
      .select("*")
      .eq("category", data.category)
      .in("id", memoryIds);

    if (memoriesError) throw memoriesError;

    console.log("Memories:", memories);

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

    console.log("Notes with tags and items:", notesWithTagsAndItems);

    return {
      ...data,
      tag: data.cosmic_tags,
      note_count: notesWithTagsAndItems.length,
      notes: notesWithTagsAndItems,
    };
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

    //   const { error: insertError } = await this.supabase
    //     .from("cosmic_items")
    //     .insert(
    //       todos.map((todo) => ({
    //         item: todo,
    //         tag: tagFamilyId,
    //       }))
    //     );

    //   if (insertError) {
    //     console.error(
    //       `Error creating todos for tag family ID ${tagFamilyId}/${category}:`,
    //       insertError
    //     );
    //     return null;
    //   }
    // }
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
}
