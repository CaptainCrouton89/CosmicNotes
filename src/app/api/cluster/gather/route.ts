import { generateEmbedding } from "@/lib/embeddings";
import { generateNoteSummary } from "@/lib/services/ai-service";
import {
  getAllTagsWithCounts,
  getNotesForTag,
} from "@/lib/services/tag-service";
import { createClient } from "@/lib/supabase/server";
import { linkifySummary } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all tags with their counts
    const tagCounts = await getAllTagsWithCounts(supabase);

    // Get existing clusters for lookup
    const { data: existingClusters, error: clustersError } = await supabase
      .from("cosmic_cluster")
      .select("id, tag, tag_count");

    if (clustersError) {
      throw new Error(
        "Failed to fetch existing clusters: " + clustersError.message
      );
    }

    // 1. Update tag counts for all existing clusters
    const updatePromises = existingClusters.map(async (cluster) => {
      const currentCount = tagCounts[cluster.tag] || 0;

      // If tag count is less than 2, mark for deletion
      if (currentCount < 2) {
        return { id: cluster.id, delete: true };
      }

      // Update the tag count if it has changed
      if (currentCount !== cluster.tag_count) {
        const { error: updateError } = await supabase
          .from("cosmic_cluster")
          .update({ tag_count: currentCount })
          .eq("id", cluster.id);

        if (updateError) {
          console.error(
            `Error updating cluster for tag ${cluster.tag}:`,
            updateError
          );
          return null;
        }

        return {
          id: cluster.id,
          tag: cluster.tag,
          updated: true,
          oldCount: cluster.tag_count,
          newCount: currentCount,
        };
      }

      return null;
    });

    const updateResults = await Promise.all(updatePromises);

    // 2. Delete clusters with tag count < 2
    const clustersToDelete = updateResults
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
        console.error("Error deleting clusters:", deleteError);
      }
    }

    // 3. Process each tag that needs clustering (create new clusters as before)
    const existingClusterSet = new Set(
      existingClusters
        .filter((c) => !clustersToDelete.includes(c.id))
        .map((c) => `${c.tag}-${tagCounts[c.tag] || c.tag_count}`)
    );

    const clusterPromises = Object.entries(tagCounts)
      .filter(
        ([tag, count]) =>
          count > 1 && !existingClusterSet.has(`${tag}-${count}`)
      )
      .map(async ([tag, count]) => {
        try {
          // Get all notes for this tag
          const notes = await getNotesForTag(supabase, tag);

          // Generate AI summary
          const summary = await generateNoteSummary(notes);

          const embedding = await generateEmbedding(
            notes.map((note) => note.content).join("\n")
          );

          // convert [#id] to links
          const linkedSummary = linkifySummary(summary);

          // Upsert the cluster
          const { error: upsertError } = await supabase
            .from("cosmic_cluster")
            .upsert(
              {
                tag,
                tag_count: count,
                summary: linkedSummary,
                embedding,
              },
              { onConflict: "tag" }
            );

          if (upsertError) {
            console.error(
              `Error upserting cluster for tag ${tag}:`,
              upsertError
            );
            return null;
          }

          return {
            tag,
            count,
            summary,
          };
        } catch (error) {
          console.error(`Error processing tag ${tag}:`, error);
          return null;
        }
      });

    const results = await Promise.all(clusterPromises);
    const successfulClusters = results.filter((r) => r !== null);

    // Gather statistics for response
    const updatedClusters = updateResults.filter(
      (
        r
      ): r is {
        id: number;
        tag: string;
        updated: boolean;
        oldCount: number;
        newCount: number;
      } => r !== null && r.updated === true
    );

    return NextResponse.json({
      message: "Clustering completed",
      clustersCreated: successfulClusters,
      clustersUpdated: updatedClusters.length,
      clustersDeleted: clustersToDelete.length,
    });
  } catch (error) {
    console.error("Error clustering notes:", error);
    return NextResponse.json(
      { error: "Failed to cluster notes" },
      { status: 500 }
    );
  }
}
