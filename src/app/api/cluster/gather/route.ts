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
    const tagCounts = await getAllTagsWithCounts(supabase);

    // Process each tag with count > 1
    const results = await Promise.all(
      Object.entries(tagCounts)
        .filter(([, count]) => count > 1)
        .map(async ([tag, count]) => {
          return await processTagClustering(supabase, tag, count);
        })
    );

    // Filter out null results
    const successfulResults = results.filter((r) => r !== null);

    // Clean up clusters that no longer have sufficient notes
    const deletedCount = await cleanupObsoleteClusters(supabase);

    // Summarize the results
    const clustersCreated = successfulResults.reduce(
      (total, result) => total + (result?.clustersCreated || 0),
      0
    );
    const clustersUpdated = successfulResults.reduce(
      (total, result) => total + (result?.clustersUpdated || 0),
      0
    );
    const categoriesProcessed = successfulResults.reduce(
      (total, result) => total + (result?.categoriesProcessed || 0),
      0
    );

    return NextResponse.json({
      message: "Clustering completed",
      tagsProcessed: successfulResults.length,
      categoriesProcessed,
      clustersCreated,
      clustersUpdated,
      clustersDeleted: deletedCount,
      tagFamiliesCreatedOrUpdated: successfulResults.length,
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
