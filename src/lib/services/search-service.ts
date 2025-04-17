import { generateEmbedding } from "@/lib/embeddings";
import { ApplicationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";
import { Note, Tag } from "@/types/types";

/**
 * Search for notes that match the given query using vector similarity
 * @param query The search query
 * @param matchCount Maximum number of matches to return
 * @param matchThreshold Similarity threshold for matches
 * @param category Optional category to filter results
 * @param zone Optional zone to filter results
 * @param tags Optional tags to filter results by name
 * @param tagIds Optional tags to filter results by id
 * @returns Array of notes with their tags and similarity score
 */
export async function searchNotes(
  query: string,
  matchCount: number = 10,
  matchThreshold: number = 0.5,
  category: string | null = null,
  zone: string | null = null,
  tags: string[] | null = null,
  tagIds: number[] | null = null
): Promise<(Note & { tags: Tag[]; score: number })[]> {
  try {
    // Get embedding for the query
    const embeddingString = await generateEmbedding(query);
    const embedding = JSON.parse(embeddingString);

    const supabaseClient = await createClient();

    // If we have tag names but not tag IDs, fetch the IDs first
    let tagIdsToUse = tagIds;
    if (tags && tags.length > 0 && (!tagIds || tagIds.length === 0)) {
      const { data: tagData } = await supabaseClient
        .from("cosmic_tags")
        .select("id")
        .in("name", tags);

      if (tagData && tagData.length > 0) {
        tagIdsToUse = tagData.map((t) => t.id);
      }
    }

    // Use the new optimized RPC function that returns notes with tags in one query
    const { data, error } = await supabaseClient.rpc(
      "search_notes_with_tags" as any,
      {
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_category: category,
        filter_zone: zone,
        filter_tag_ids: tagIdsToUse,
      }
    );

    if (error) {
      throw new ApplicationError("Failed to search notes", {
        supabaseError: error,
      });
    }

    // Since we know the shape of the data, we cast it to the expected type
    const notes = data as any[];

    // Transform the results to the expected format
    return notes.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      zone: note.zone,
      category: note.category,
      created_at: note.created_at,
      updated_at: note.updated_at,
      metadata: note.metadata || {},
      tags: note.tags || [],
      score: note.score,
    }));
  } catch (error) {
    console.error("Error in searchNotes:", error);
    throw error;
  }
}

/**
 * Search for clusters that match the given query using vector similarity
 * @param query The search query
 * @param matchCount Maximum number of matches to return
 * @param matchThreshold Similarity threshold for matches
 * @returns Array of matching clusters
 */
export async function searchClusters(
  query: string,
  matchCount: number = 10,
  matchThreshold: number = 0.5
): Promise<Database["public"]["CompositeTypes"]["matched_cluster"][]> {
  // Get embedding for the query
  const embeddingString = await generateEmbedding(query);
  const embedding = JSON.parse(embeddingString);

  const supabaseClient = await createClient();

  // Search for similar clusters using vector similarity
  const { data: clusters, error } = await supabaseClient.rpc("match_clusters", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new ApplicationError("Failed to search clusters", {
      supabaseError: error,
    });
  }

  return clusters;
}
