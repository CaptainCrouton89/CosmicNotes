import { Database } from "@/types/database.types";
import { Category, Note, Tag } from "@/types/types";
import { openai } from "@ai-sdk/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { z } from "zod";
import { ITEM_CATEGORIES } from "../constants";
import { capitalize } from "../utils";
import { ClusterService } from "./cluster-service";
import { NoteService } from "./note-service";
import { searchClusters, searchNotes } from "./search-service";

function cleanTag(tag: string): string {
  // Remove X20 which may be encoding for spaces
  return tag.replace(/X20/g, " ").trim();
}

type TagConfidence = {
  name: string;
  confidence: number;
};

type CompleteTag = Tag & {
  note_count: number;
  clusters: Database["public"]["Tables"]["cosmic_cluster"]["Row"][];
  notes: Database["public"]["Tables"]["cosmic_memory"]["Row"][];
};

export interface TagMerge {
  primaryTag: string;
  similarTags: string[];
}

export interface TagMergeResult {
  primaryTag: string;
  primaryTagId?: number;
  mergedTagIds?: number[];
  success?: boolean;
  error?: string;
}

export class TagService {
  private supabase: SupabaseClient<Database>;
  private noteService?: NoteService;
  private clusterService?: ClusterService;

  constructor(
    supabase: SupabaseClient<Database>,
    noteService?: NoteService,
    clusterService?: ClusterService
  ) {
    this.supabase = supabase;
    this.noteService = noteService;
    this.clusterService = clusterService;
  }

  /**
   * Set the note service instance after construction to avoid circular dependencies
   */
  setNoteService(noteService: NoteService): void {
    this.noteService = noteService;
  }

  setClusterService(clusterService: ClusterService): void {
    this.clusterService = clusterService;
  }

  async getTag(id: number): Promise<CompleteTag> {
    const { data: tag, error } = await this.supabase
      .from("cosmic_tags")
      .select("*, cosmic_cluster(*), cosmic_memory_tag_map(*, note(*))")
      .eq("id", id)
      .single();

    if (error) throw error;

    const { data: tagMap, error: tagMapError } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select("*, note(*)")
      .eq("tag", tag.id);

    if (tagMapError) throw tagMapError;

    // Return only the fields on the Tag object
    const returnedTag: CompleteTag = {
      id: tag.id,
      name: tag.name,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      dirty: tag.dirty,
      note_count: tagMap.length,
      notes: tagMap.map((t) => t.note),
      clusters: tag.cosmic_cluster,
    };

    return returnedTag;
  }

  /**
   * Extract hashtags from content and return them as tags with confidence 1.0
   * @param content The content to extract hashtags from
   * @returns Array of [tags, cleaned content]
   */
  private extractHashtags = (content: string): [TagConfidence[], string] => {
    const hashtagRegex = /#(\w+)/g;
    const hashtags: TagConfidence[] = [];
    const cleanedContent = content.replace(hashtagRegex, (match, tag) => {
      const cleanedTag = cleanTag(tag);
      if (cleanedTag && cleanedTag !== "X20") {
        // Skip empty tags or X20 tags
        hashtags.push({
          name: capitalize(cleanedTag),
          confidence: 1.0,
        });
      }
      return tag; // Keep the word, just remove the # symbol
    });

    return [hashtags, cleanedContent];
  };

  private updateConfidenceMap(
    tagMap: Map<string, number>,
    tag: string,
    confidence: number
  ) {
    const existingConfidence = tagMap.get(tag) || 0;
    tagMap.set(tag, Math.max(existingConfidence, confidence));
  }

  async getAllTags(): Promise<(Tag & { note_count: number })[]> {
    // Get all tags
    const { data: tags, error: tagsError } = await this.supabase
      .from("cosmic_tags")
      .select("*")
      .order("updated_at", { ascending: false });

    if (tagsError) throw tagsError;

    // Get all tag counts using a simplified approach
    const { data: tagMaps, error: mapsError } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select("tag");

    if (mapsError) throw mapsError;

    // Count occurrences manually
    const countMap = new Map<number, number>();
    tagMaps.forEach((item) => {
      const tagId = item.tag;
      countMap.set(tagId, (countMap.get(tagId) || 0) + 1);
    });

    // Add count to each tag
    return tags.map((tag) => ({
      ...tag,
      note_count: countMap.get(tag.id) || 0,
    }));
  }

  async getTagsForNote(
    content: string,
    confidence: number = 0.5,
    maxTags: number = 5
  ): Promise<TagConfidence[]> {
    try {
      // First extract explicit hashtags
      const [hashTags, cleanedContent] = this.extractHashtags(content);

      // Track unique tags with their highest confidence scores
      const tagMap = new Map<string, number>();

      // Add hashtags with confidence 1.0
      hashTags.forEach((tag) => {
        tagMap.set(capitalize(tag.name), 1.0);
      });

      // Get similar clusters to use as context for tagging
      let similarClusters: Database["public"]["CompositeTypes"]["matched_cluster"][] =
        [];
      let similarNotes: (Note & { tags: Tag[]; score: number })[] = [];

      try {
        similarClusters = await searchClusters(content, 5, 0.7);
      } catch (error) {
        console.warn("Error fetching similar clusters:", error);
      }

      try {
        similarNotes = await searchNotes(content, 5, 0.7);
      } catch (error) {
        console.warn("Error fetching similar notes:", error);
      }

      await Promise.all(
        similarClusters.map(async (cluster) => {
          if (!cluster.tag) return;

          const tag = await this.getTag(cluster.tag);

          const cleanedTag = cleanTag(tag.name);
          if (!cleanedTag || cleanedTag === "X20") return; // Skip problematic tags

          const capitalizedTag = capitalize(cleanedTag);
          this.updateConfidenceMap(tagMap, capitalizedTag, cluster.score!);
        })
      );

      // Make sure noteService is available before using it
      if (this.noteService) {
        await Promise.all(
          similarNotes.map(async (note) => {
            if (!note.id) return;
            const noteWithTags = await this.noteService!.getNoteById(note.id);
            if (!noteWithTags) return;

            const allTags = noteWithTags.tags.map((tag) => tag.name);
            allTags.forEach((tag) => {
              const cleanedTag = cleanTag(tag);
              if (!cleanedTag || cleanedTag === "X20") return; // Skip problematic tags

              const capitalizedTag = capitalize(cleanedTag);
              this.updateConfidenceMap(tagMap, capitalizedTag, note.score!);
            });
          })
        );
      }

      // Generate additional tags using AI if we don't have enough tags yet
      if (tagMap.size < 3 && cleanedContent.trim()) {
        try {
          // Generate tags using Vercel AI SDK
          const result = await generateObject({
            model: openai("gpt-4o-mini"),
            temperature: 0.3,
            system:
              "You are a helpful assistant that extracts relevant tags from content.",
            prompt: `Identify 3-5 tags that best describe the content. Try to include some that are both more and less specific. 
                 
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
            const capitalizedTag = capitalize(tag.tag);
            this.updateConfidenceMap(tagMap, capitalizedTag, tag.confidence);
          });
        } catch (error) {
          console.warn("Error generating AI tags:", error);
          // Continue even if AI tag generation fails
        }
      }

      // Convert the Map back to an array of Tag objects
      const uniqueTags: TagConfidence[] = Array.from(tagMap.entries()).map(
        ([tag, confidence]) => ({
          name: tag,
          confidence,
        })
      );

      uniqueTags.sort((a, b) => b.confidence - a.confidence);

      return uniqueTags
        .filter((tag) => tag.confidence >= confidence)
        .slice(0, maxTags);
    } catch (error) {
      console.error("Error generating tags:", error);
      throw error;
    }
  }

  async updateTag(id: number, updates: Partial<Tag>): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_tags")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  async setTagDirty(id: number): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_tags")
      .update({ dirty: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  async generateClusterForCategory(
    category: Category,
    force: boolean,
    completeTag?: CompleteTag,
    tagId?: number
  ): Promise<Database["public"]["Tables"]["cosmic_cluster"]["Row"]> {
    if (!tagId && !completeTag) {
      throw new Error("Either tagId or completeTag must be provided");
    }

    if (!completeTag) {
      completeTag = await this.getTag(tagId!);
    }

    if (!force) {
      const existingCluster = completeTag.clusters.find(
        (cluster) => cluster.category === category
      );
      if (existingCluster) {
        return existingCluster;
      }
    }

    this.clusterService!.deleteClusterByCategory(completeTag.id, category);
    const notesInCategory = completeTag.notes.filter(
      (note) => note.category === category
    );

    if (ITEM_CATEGORIES.includes(category)) {
      const newCluster = await this.clusterService!.createClusterFromNotes(
        completeTag.id,
        notesInCategory,
        category
      );
      return newCluster;
    } else {
      const newCluster = await this.clusterService!.createEmptyCluster(
        completeTag.id,
        category
      );
      return newCluster;
    }
  }

  async generateAllClusters(
    tagId: number,
    force: boolean = true
  ): Promise<CompleteTag> {
    const completeTag = await this.getTag(tagId);

    const allClusters: Database["public"]["Tables"]["cosmic_cluster"]["Row"][] =
      [];
    await Promise.all(
      completeTag.notes.map(async (note) => {
        const newCluster = await this.generateClusterForCategory(
          note.category,
          force,
          completeTag
        );
        allClusters.push(newCluster);
      })
    );

    completeTag.clusters = allClusters;

    return completeTag;
  }

  /**
   * Merges similar tags into a primary tag
   * @param merges Array of merge operations to perform
   * @returns Array of results for each merge operation
   */
  async mergeTags(merges: TagMerge[]): Promise<TagMergeResult[]> {
    const results: TagMergeResult[] = [];

    // Process each merge operation
    for (const merge of merges) {
      const { primaryTag, similarTags } = merge;

      // Get the primary tag
      const { data: primaryTagData, error: primaryTagError } =
        await this.supabase
          .from("cosmic_tags")
          .select("*")
          .eq("name", primaryTag)
          .single();

      if (primaryTagError && primaryTagError.code !== "PGRST116") {
        // Handle error except "no rows returned" error
        throw primaryTagError;
      }

      // If primary tag doesn't exist, skip this merge
      if (!primaryTagData) {
        results.push({
          primaryTag,
          error: "Primary tag not found",
        });
        continue;
      }

      const primaryTagId = primaryTagData.id;
      const mergedTagIds: number[] = [];

      // Process each similar tag in the merge
      for (const similarTag of similarTags) {
        // Get the similar tag
        const { data: similarTagData, error: similarTagError } =
          await this.supabase
            .from("cosmic_tags")
            .select("*")
            .eq("name", similarTag)
            .single();

        if (similarTagError && similarTagError.code !== "PGRST116") {
          // Handle error except "no rows returned" error
          throw similarTagError;
        }

        // If similar tag doesn't exist, skip this tag
        if (!similarTagData) {
          continue;
        }

        const similarTagId = similarTagData.id;
        mergedTagIds.push(similarTagId);

        // Get all notes with the similar tag
        const { data: tagMaps, error: tagMapsError } = await this.supabase
          .from("cosmic_memory_tag_map")
          .select("*")
          .eq("tag", similarTagId);

        if (tagMapsError) {
          throw tagMapsError;
        }

        if (!this.noteService) {
          throw new Error("Note service is required for tag merging");
        }

        // For each note with the similar tag
        for (const tagMap of tagMaps) {
          const noteId = tagMap.note;

          // Check if the note already has the primary tag
          const { data: existingMapping, error: existingMappingError } =
            await this.supabase
              .from("cosmic_memory_tag_map")
              .select("*")
              .eq("note", noteId)
              .eq("tag", primaryTagId);

          if (existingMappingError) {
            throw existingMappingError;
          }

          // If the note doesn't have the primary tag, add it
          if (!existingMapping || existingMapping.length === 0) {
            await this.noteService.addTagToNote(noteId, primaryTagId);
          }

          // Remove the similar tag from the note
          await this.noteService.removeTagFromNote(noteId, similarTagId);
        }

        // Mark the primary tag as dirty to trigger cluster rebuild
        await this.setTagDirty(primaryTagId);

        // Delete the similar tag if it no longer has any notes
        const { count, error: countError } = await this.supabase
          .from("cosmic_memory_tag_map")
          .select("*", { count: "exact", head: true })
          .eq("tag", similarTagId);

        if (countError) {
          throw countError;
        }

        if (count === 0) {
          // Delete similar tag entirely as it's no longer used
          const { error: deleteError } = await this.supabase
            .from("cosmic_tags")
            .delete()
            .eq("id", similarTagId);

          if (deleteError) {
            throw deleteError;
          }
        }
      }

      results.push({
        primaryTag,
        primaryTagId,
        mergedTagIds,
        success: true,
      });
    }

    return results;
  }
}
