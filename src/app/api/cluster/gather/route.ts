import { generateEmbedding } from "@/lib/embeddings";
import { generateNoteSummary } from "@/lib/services/ai-service";
import {
  getAllTagsWithCounts,
  getExistingClusters,
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
    const existingClusterSet = await getExistingClusters(supabase);

    // Process each tag that needs clustering
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

    return NextResponse.json({
      message: "Clustering completed",
      clustersCreated: successfulClusters,
    });
  } catch (error) {
    console.error("Error clustering notes:", error);
    return NextResponse.json(
      { error: "Failed to cluster notes" },
      { status: 500 }
    );
  }
}
