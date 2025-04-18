import { Database } from "@/types/database.types";
import { Category, Cluster, CompleteCluster, Note } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "../embeddings";
import { linkifySummary, sanitizeText } from "../utils";
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
    try {
      // Use the custom RPC function to get the cluster with all its relations in one query
      const { data, error } = await this.supabase.rpc(
        "get_cluster_with_relations" as any,
        { cluster_id: id }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(`Cluster with id ${id} not found`);
      }

      // Transform the result to ensure it matches the CompleteCluster type
      return data as CompleteCluster;
    } catch (error) {
      console.error("Error in getClusterById:", error);
      throw error;
    }
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

    // Sanitize the summary to remove null bytes and control characters
    const sanitizedSummary = sanitizeText(linkedSummary);

    // Sanitize note content but preserve newlines for embedding
    const safeNoteContents = notes.map((note) => {
      const sanitized = sanitizeText(note.content);
      return sanitized;
    });

    const embedding = await generateEmbedding(safeNoteContents.join("\n\n"));

    const { data: insertResult, error: insertError } = await this.supabase
      .from("cosmic_cluster")
      .insert({
        summary: sanitizedSummary,
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
