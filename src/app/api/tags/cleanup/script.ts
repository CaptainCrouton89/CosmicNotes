/**
 * Utility script to clean up X20 tags
 *
 * To run:
 * 1. Build the app first: pnpm build
 * 2. Execute the script: node -r dotenv/config scripts/cleanup-tags.js
 */

import { createClient } from "@/lib/supabase/server";

async function cleanupTags() {
  try {
    console.log("Starting tag cleanup process...");

    const supabase = await createClient();

    // Get count of X20 tags before cleanup
    const { count: beforeCount, error: countError } = await supabase
      .from("cosmic_tags")
      .select("*", { count: "exact" })
      .or("tag.eq.X20,tag.ilike.%X20%");

    if (countError) {
      throw new Error(`Error counting tags: ${countError.message}`);
    }

    console.log(`Found ${beforeCount} problematic tags containing X20`);

    if (beforeCount === 0) {
      console.log("No X20 tags to clean up. Exiting.");
      return;
    }

    // Delete all tags containing X20
    const { error: deleteError, count: deletedCount } = await supabase
      .from("cosmic_tags")
      .delete({ count: "exact" })
      .or("tag.eq.X20,tag.ilike.%X20%");

    if (deleteError) {
      throw new Error(`Error cleaning up tags: ${deleteError.message}`);
    }

    console.log(`Successfully deleted ${deletedCount} problematic tags`);
    console.log("Tag cleanup completed successfully!");
  } catch (error) {
    console.error("Error during tag cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup function
cleanupTags();
