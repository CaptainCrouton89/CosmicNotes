import { ApplicationError } from "@/lib/errors";
import { Database } from "@/types/database.types";
import { openai } from "@ai-sdk/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import * as z from "zod";
import { capitalize } from "../utils";
import { searchClusters } from "./search-service";
export interface Tag {
  tag: string;
  confidence: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

/**
 * Cleans a tag string to remove encoding issues and problematic characters
 * @param tag The tag to clean
 * @returns Cleaned tag
 */
function cleanTag(tag: string): string {
  // Remove X20 which may be encoding for spaces
  return tag.replace(/X20/g, " ").trim();
}

/**
 * Extract hashtags from content and return them as tags with confidence 1.0
 * @param content The content to extract hashtags from
 * @returns Array of [tags, cleaned content]
 */
function extractHashtags(content: string): [Tag[], string] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: Tag[] = [];
  const cleanedContent = content.replace(hashtagRegex, (match, tag) => {
    const cleanedTag = cleanTag(tag);
    if (cleanedTag && cleanedTag !== "X20") {
      // Skip empty tags or X20 tags
      hashtags.push({
        tag: capitalize(cleanedTag),
        confidence: 1.0,
      });
    }
    return tag; // Keep the word, just remove the # symbol
  });

  return [hashtags, cleanedContent];
}

/**
 * Generates tags for the given content using AI
 * @param content The content to generate tags for
 * @returns Array of generated tags with confidence scores
 */
export async function getTagsForNote(
  content: string,
  confidence: number = 0.8
): Promise<Tag[]> {
  try {
    // First extract explicit hashtags
    const [hashTags, cleanedContent] = extractHashtags(content);

    // Track unique tags with their highest confidence scores
    const tagMap = new Map<string, number>();

    // Add hashtags with confidence 1.0
    hashTags.forEach((tag) => {
      tagMap.set(capitalize(tag.tag), 1.0);
    });

    console.log("hashTags", hashTags);

    // Get similar clusters to use as context for tagging
    let similarClusters: Database["public"]["CompositeTypes"]["matched_cluster"][] =
      [];
    try {
      similarClusters = await searchClusters(content, 5, 0.7);
    } catch (error) {
      console.warn("Error fetching similar clusters:", error);
      // Continue even if we can't get similar clusters
    }

    // Add cluster tags with confidence 0.8 if they don't exist or have lower confidence
    similarClusters.forEach((cluster) => {
      if (!cluster.tag) return;

      const cleanedTag = cleanTag(cluster.tag);
      if (!cleanedTag || cleanedTag === "X20") return; // Skip problematic tags

      const capitalizedTag = capitalize(cleanedTag);
      const existingConfidence = tagMap.get(capitalizedTag) || 0;
      if (existingConfidence < 0.8) {
        tagMap.set(capitalizedTag, cluster.score!);
      }
    });

    console.log(
      "similarClusters",
      similarClusters.map((c) => ({
        tag: c.tag,
        score: c.score,
      }))
    );

    // Generate additional tags using AI if we don't have enough tags yet
    if (tagMap.size < 1 && cleanedContent.trim()) {
      try {
        // Generate tags using Vercel AI SDK
        const result = await generateObject({
          model: openai("gpt-4o"),
          temperature: 0,
          system:
            "You are a helpful assistant that extracts relevant tags from content.",
          prompt: `Identify 1-2 tags that best describe the content. 
                 
                 Content: ${cleanedContent}`,
          schema: z.object({
            tags: z.array(
              z.object({
                tag: z.string().describe("The tag in PascalCase"),
                confidence: z
                  .number()
                  .min(0)
                  .max(1)
                  .describe("Confidence score between 0 and 1"),
              })
            ),
          }),
        });

        // Process AI tags, keeping highest confidence scores
        result.object.tags.forEach((tag) => {
          const cleanedTag = cleanTag(tag.tag);
          if (!cleanedTag || cleanedTag === "X20") return; // Skip problematic tags

          const capitalizedTag = capitalize(cleanedTag);
          const existingConfidence = tagMap.get(capitalizedTag) || 0;
          const newConfidence = Math.max(existingConfidence, tag.confidence);
          tagMap.set(capitalizedTag, newConfidence);
        });
      } catch (error) {
        console.warn("Error generating AI tags:", error);
        // Continue even if AI tag generation fails
      }
    }

    // Convert the Map back to an array of Tag objects
    const uniqueTags: Tag[] = Array.from(tagMap.entries())
      .filter(([tag]) => tag !== "X20" && !tag.includes("X20")) // Filter out X20 tags
      .map(([tag, confidence]) => ({
        tag,
        confidence,
      }));

    return uniqueTags.filter((tag) => tag.confidence >= confidence);
  } catch (error) {
    console.error("Error generating tags:", error);
    throw new ApplicationError("Failed to generate tags", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Save generated tags to the database
 * @param supabase Supabase client
 * @param tags Array of tags with confidence scores
 * @param noteId ID of the note these tags belong to
 */
export async function saveTagsToDatabase(
  supabase: SupabaseClient<Database>,
  tags: Tag[],
  noteId: number
) {
  try {
    // Delete existing tags for this note
    const { error: deleteError } = await supabase
      .from("cosmic_tags")
      .delete()
      .eq("note", noteId);

    if (deleteError) {
      throw new Error(`Failed to delete existing tags: ${deleteError.message}`);
    }

    // Insert new tags
    if (tags.length > 0) {
      const { error: insertError } = await supabase.from("cosmic_tags").insert(
        tags.map((tag) => ({
          note: noteId,
          tag: tag.tag,
          confidence: tag.confidence,
        }))
      );

      if (insertError) {
        throw new Error(`Failed to insert tags: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error("Error saving tags:", error);
    throw new ApplicationError("Failed to save tags", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getAllTagsWithCounts(supabase: SupabaseClient<Database>) {
  const { data: allTags, error: tagsError } = await supabase
    .from("cosmic_tags")
    .select("tag");

  if (tagsError) {
    throw new Error("Failed to fetch tags: " + tagsError.message);
  }

  // Count occurrences of each tag
  return allTags.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr.tag] = (acc[curr.tag] || 0) + 1;
    return acc;
  }, {});
}

export async function getExistingClusters(supabase: SupabaseClient<Database>) {
  const { data: existingClusters, error: clustersError } = await supabase
    .from("cosmic_cluster")
    .select("tag_family, category");

  if (clustersError) {
    throw new Error(
      "Failed to fetch existing clusters: " + clustersError.message
    );
  }

  return new Set(existingClusters.map((c) => `${c.tag_family}-${c.category}`));
}

export async function getNotesForTag(
  supabase: SupabaseClient<Database>,
  tag: string
) {
  // First get the note IDs for this tag
  const { data: tagNotes, error: tagNotesError } = await supabase
    .from("cosmic_tags")
    .select("note")
    .eq("tag", tag);

  if (tagNotesError || !tagNotes) {
    throw new Error(
      `Failed to fetch note IDs for tag ${tag}: ${tagNotesError?.message}`
    );
  }

  const noteIds = tagNotes.map((r) => r.note);

  // Then fetch the actual notes with all required fields
  const { data: notes, error: notesError } = await supabase
    .from("cosmic_memory")
    .select("*")
    .in("id", noteIds);

  if (notesError || !notes) {
    throw new Error(
      `Failed to fetch notes for tag ${tag}: ${notesError?.message}`
    );
  }

  return notes;
}
