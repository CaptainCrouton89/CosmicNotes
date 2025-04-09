import {
  cleanupObsoleteClusters,
  processTagClustering,
} from "@/lib/services/cluster-service";
import { getAllTagsWithCounts } from "@/lib/services/tag-service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all tags with their counts
    const tagCounts = await getAllTagsWithCounts();

    // Process each tag with count > 1
    const results = await Promise.all(
      Object.entries(tagCounts)
        .filter(([, count]) => count > 1)
        .map(async ([tag, count]) => {
          return await processTagClustering(tag, count);
        })
    );

    // Filter out null results
    const successfulResults = results.filter((r) => r !== null);

    // Clean up clusters that no longer have sufficient notes
    const deletedCount = await cleanupObsoleteClusters(supabase);

    // Count skipped clusters
    const skippedCount = successfulResults.filter((r) => r.skipped).length;

    // Only count created/updated for non-skipped results
    const nonSkippedResults = successfulResults.filter((r) => !r.skipped);

    // Summarize the results
    const clustersCreated = nonSkippedResults.reduce(
      (total, result) => total + (result?.clustersCreated || 0),
      0
    );
    const clustersUpdated = nonSkippedResults.reduce(
      (total, result) => total + (result?.clustersUpdated || 0),
      0
    );
    const categoriesProcessed = nonSkippedResults.reduce(
      (total, result) => total + (result?.categoriesProcessed || 0),
      0
    );

    return NextResponse.json({
      message: "Clustering completed",
      tagsProcessed: successfulResults.length,
      tagsSkipped: skippedCount,
      categoriesProcessed,
      clustersCreated,
      clustersUpdated,
      clustersDeleted: deletedCount,
      tagFamiliesCreatedOrUpdated: nonSkippedResults.length,
      details: successfulResults,
    });
  } catch (error) {
    console.error("Error clustering notes:", error);
    return NextResponse.json(
      { error: "Failed to cluster notes" },
      { status: 500 }
    );
  }
}
