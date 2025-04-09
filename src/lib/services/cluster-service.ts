import { generateEmbedding } from "@/lib/embeddings";
import { generateNoteSummary, generateTodos } from "@/lib/services/ai-service";
import { getNotesForTag } from "@/lib/services/tag-service";
import { linkifySummary } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { createClient } from "../supabase/server";

type MemoryRow = Database["public"]["Tables"]["cosmic_memory"]["Row"];

/**
 * Get notes for a specific tag, grouped by category
 */
export async function getNotesForTagByCategory(
  tag: string
): Promise<Map<string, MemoryRow[]>> {
  const supabase = await createClient();
  // Get all notes for this tag
  const notes = await getNotesForTag(supabase, tag);

  // Group notes by category
  const notesByCategory = new Map<string, MemoryRow[]>();

  notes.forEach((note) => {
    const category = note.category;
    if (!notesByCategory.has(category)) {
      notesByCategory.set(category, []);
    }
    notesByCategory.get(category)?.push(note);
  });

  return notesByCategory;
}

/**
 * Create or update a tag family record
 */
export async function createOrUpdateTagFamily(
  tag: string,
  count: number
): Promise<{ id: number | null; countChanged: boolean }> {
  try {
    const supabase = await createClient();
    console.log("tag", tag);
    const { data: existingTagFamily, error: tagFamilyError } = await supabase
      .from("cosmic_tag_family")
      .select("id, tag_count")
      .eq("tag", tag)
      .maybeSingle();

    console.log("existingTagFamily", existingTagFamily);

    if (tagFamilyError) {
      console.error(`Error fetching tag family for ${tag}:`, tagFamilyError);
      return { id: null, countChanged: false };
    }

    if (!existingTagFamily) {
      // Create new tag family
      const { data: newTagFamily, error: insertError } = await supabase
        .from("cosmic_tag_family")
        .insert({
          tag,
          tag_count: count,
        })
        .select("id")
        .single();

      if (insertError || !newTagFamily) {
        console.error(`Error creating tag family for ${tag}:`, insertError);
        return { id: null, countChanged: false };
      }

      return { id: newTagFamily.id, countChanged: true };
    } else {
      // Update existing tag family if count changed
      if (existingTagFamily.tag_count !== count) {
        const { error: updateError } = await supabase
          .from("cosmic_tag_family")
          .update({ tag_count: count })
          .eq("id", existingTagFamily.id);

        if (updateError) {
          console.error(`Error updating tag family for ${tag}:`, updateError);
          return { id: null, countChanged: false };
        }
        return { id: existingTagFamily.id, countChanged: true };
      }

      return { id: existingTagFamily.id, countChanged: false };
    }
  } catch (error) {
    console.error(`Error in createOrUpdateTagFamily for ${tag}:`, error);
    return { id: null, countChanged: false };
  }
}

/**
 * Create or update a cluster for a tag and category
 */
export async function createOrUpdateCluster(
  tagFamilyId: number,
  category: string,
  notes: MemoryRow[]
): Promise<{ action: string; count: number } | null> {
  const supabase = await createClient();
  try {
    // Check if cluster already exists
    const { data: existingCluster, error: clusterError } = await supabase
      .from("cosmic_cluster")
      .select("id, tag_count, summary")
      .eq("tag_family", tagFamilyId)
      .eq("category", category)
      .maybeSingle();

    if (clusterError) {
      console.error(
        `Error fetching cluster for tag family ID ${tagFamilyId}/${category}:`,
        clusterError
      );
      return null;
    }

    let summary = "";
    // Generate data for cluster

    // Skip To-Do category because it doesn't use a summary output format
    if (category !== "To-Do") {
      summary = await generateNoteSummary(notes);
    }
    const linkedSummary = linkifySummary(summary);

    const embedding = await generateEmbedding(
      notes.map((note) => note.content).join("\n")
    );

    if (category === "To-Do") {
      const todos = await generateTodos(notes, tagFamilyId);

      const { error: insertError } = await supabase
        .from("cosmic_todo_item")
        .insert(
          todos.map((todo) => ({
            item: todo,
            tag: tagFamilyId,
          }))
        );

      if (insertError) {
        console.error(
          `Error creating todos for tag family ID ${tagFamilyId}/${category}:`,
          insertError
        );
        return null;
      }
    }

    if (!existingCluster) {
      // Create new cluster
      const { error: insertError } = await supabase
        .from("cosmic_cluster")
        .insert({
          tag_family: tagFamilyId,
          category,
          tag_count: notes.length,
          summary: linkedSummary,
          embedding,
        });

      if (insertError) {
        console.error(
          `Error creating cluster for tag family ID ${tagFamilyId}/${category}:`,
          insertError
        );
        return null;
      }

      return {
        action: "created",
        count: notes.length,
      };
    } else {
      // Update existing cluster
      const { error: updateError } = await supabase
        .from("cosmic_cluster")
        .update({
          tag_count: notes.length,
          summary: linkedSummary,
          embedding,
        })
        .eq("id", existingCluster.id);

      if (updateError) {
        console.error(
          `Error updating cluster for tag family ID ${tagFamilyId}/${category}:`,
          updateError
        );
        return null;
      }

      return {
        action: "updated",
        count: notes.length,
      };
    }
  } catch (error) {
    console.error(
      `Error in createOrUpdateCluster for tag family ID ${tagFamilyId}/${category}:`,
      error
    );
    return null;
  }
}

/**
 * Process tag clustering for a specific tag
 */
export async function processTagClustering(tag: string, count: number) {
  try {
    // 1. Create or update the tag family
    const { id: tagFamilyId, countChanged } = await createOrUpdateTagFamily(
      tag,
      count
    );

    if (!tagFamilyId) {
      return null;
    }

    // Skip processing if count hasn't changed
    if (!countChanged) {
      return {
        tag,
        totalCount: count,
        categoriesProcessed: 0,
        clustersCreated: 0,
        clustersUpdated: 0,
        categoryResults: [],
        skipped: true,
      };
    }

    // 2. Get notes for this tag grouped by category
    const notesByCategory = await getNotesForTagByCategory(tag);

    console.log(
      Array.from(notesByCategory.entries()).map(([category, notes]) => ({
        category,
        count: notes.length,
        notes: notes.map((note) => ({
          title: note.title,
        })),
      }))
    );

    // 3. Process each category that has notes with this tag
    const categoryResults = await Promise.all(
      Array.from(notesByCategory.entries()).map(async ([category, notes]) => {
        const result = await createOrUpdateCluster(
          tagFamilyId,
          category,
          notes
        );

        if (!result) {
          return null;
        }

        return {
          tag,
          category,
          count: result.count,
          action: result.action,
        };
      })
    );

    // Filter out null results and count actions
    const validCategoryResults = categoryResults.filter(
      (
        result
      ): result is {
        tag: string;
        category: string;
        count: number;
        action: string;
      } => result !== null
    );

    const created = validCategoryResults.filter(
      (r) => r.action === "created"
    ).length;
    const updated = validCategoryResults.filter(
      (r) => r.action === "updated"
    ).length;

    return {
      tag,
      totalCount: count,
      categoriesProcessed: validCategoryResults.length,
      clustersCreated: created,
      clustersUpdated: updated,
      categoryResults: validCategoryResults,
      skipped: false,
    };
  } catch (error) {
    console.error(`Error processing tag ${tag}:`, error);
    return null;
  }
}

/**
 * Clean up obsolete clusters
 */
export async function cleanupObsoleteClusters(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: obsoleteClusters, error: obsoleteError } = await supabase
      .from("cosmic_cluster")
      .select("id, tag_family, category");

    if (obsoleteError || !obsoleteClusters) {
      console.error("Error fetching clusters:", obsoleteError);
      return 0;
    }

    // For each cluster, check if it has at least 2 notes with that tag and category
    const obsoleteChecks = await Promise.all(
      obsoleteClusters.map(async (cluster) => {
        try {
          // Get the tag string from tag_family table
          const { data: tagFamily, error: tagFamilyError } = await supabase
            .from("cosmic_tag_family")
            .select("tag")
            .eq("id", cluster.tag_family)
            .single();

          if (tagFamilyError || !tagFamily) {
            console.error(
              `Error fetching tag family for cluster ${cluster.id}:`,
              tagFamilyError
            );
            return null;
          }

          const tagString = tagFamily.tag;

          // Get notes with this tag
          const { data: tagNotes, error: tagError } = await supabase
            .from("cosmic_tags")
            .select("note")
            .eq("tag", tagString);

          if (tagError || !tagNotes) {
            console.error(
              `Error checking obsolete cluster ${cluster.id}:`,
              tagError
            );
            return null;
          }

          // If there are less than 1 note with this tag, mark for deletion
          if (tagNotes.length < 1) {
            return { id: cluster.id, delete: true };
          }

          // Get the actual notes to check categories
          const noteIds = tagNotes.map((n) => n.note);
          const { data: notes, error: notesError } = await supabase
            .from("cosmic_memory")
            .select("id, category")
            .in("id", noteIds)
            .eq("category", cluster.category);

          if (notesError) {
            console.error(
              `Error checking notes for obsolete cluster ${cluster.id}:`,
              notesError
            );
            return null;
          }

          // If there are no notes in this category, mark for deletion
          if (!notes || notes.length < 1) {
            return { id: cluster.id, delete: true };
          }

          return null;
        } catch (error) {
          console.error(
            `Error checking obsolete cluster ${cluster.id}:`,
            error
          );
          return null;
        }
      })
    );

    // Delete obsolete clusters
    const clustersToDelete = obsoleteChecks
      .filter(
        (result): result is { id: number; delete: boolean } =>
          result !== null && result.delete === true
      )
      .map((result) => result.id);

    if (clustersToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("cosmic_cluster")
        .delete()
        .in("id", clustersToDelete);

      if (deleteError) {
        console.error("Error deleting obsolete clusters:", deleteError);
        return 0;
      }
    }

    return clustersToDelete.length;
  } catch (error) {
    console.error("Error cleaning up obsolete clusters:", error);
    return 0;
  }
}
