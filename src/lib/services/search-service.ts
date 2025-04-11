import { generateEmbedding } from "@/lib/embeddings";
import { ApplicationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { Database, Json } from "@/types/database.types";
import { Note, Tag } from "@/types/types";
/**
 * Search for notes that match the given query using vector similarity
 * @param query The search query
 * @param matchCount Maximum number of matches to return
 * @param matchThreshold Similarity threshold for matches
 * @param category Optional category to filter results
 * @returns Array of notes with their tags
 */
export async function searchNotes(
  query: string,
  matchCount: number = 10,
  matchThreshold: number = 0.5,
  category: string | null = null
): Promise<(Note & { tags: Tag[]; score: number })[]> {
  // Get embedding for the query
  const embeddingString = await generateEmbedding(query);
  const embedding = JSON.parse(embeddingString);

  const supabaseClient = await createClient();

  // Search for similar notes using vector similarity
  const { data: notes, error } = await supabaseClient.rpc("match_notes", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new ApplicationError("Failed to search notes", {
      supabaseError: error,
    });
  }

  // Filter by category if provided
  let filteredNotes = notes;
  if (category) {
    filteredNotes = notes.filter((note) => note.category === category);
  }

  // Get tags for each note
  const notesWithTagsPromises = filteredNotes.map(async (note) => {
    const { data: tagMappings } = await supabaseClient
      .from("cosmic_memory_tag_map")
      .select("tag(*)")
      .eq("memory_id", note.id as number);

    // Convert RPC result to a valid Note object
    const noteResult: Note & { tags: Tag[]; score: number } = {
      id: note.id!,
      title: note.title!,
      content: note.content!,
      zone: note.zone!,
      category: note.category!,
      created_at: note.created_at!,
      updated_at: note.updated_at!,
      metadata: {} as Json,
      tags: tagMappings?.map((mapping) => mapping.tag) || [],
      score: note.score!,
    };

    return noteResult;
  });

  return await Promise.all(notesWithTagsPromises);
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
