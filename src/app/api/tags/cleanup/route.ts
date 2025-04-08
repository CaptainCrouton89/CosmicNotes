import { ApplicationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * POST endpoint to clean up problematic tags like X20 from the database
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Delete all tags containing X20
    const { error: deleteError, count } = await supabase
      .from("cosmic_tags")
      .delete({ count: "exact" })
      .or("tag.eq.X20,tag.ilike.%X20%");

    if (deleteError) {
      console.error("Error cleaning up tags:", deleteError);
      throw new ApplicationError("Failed to clean up tags");
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${count} problematic tags`,
    });
  } catch (error) {
    console.error("Error in tag cleanup:", error);
    return NextResponse.json(
      { error: "Failed to clean up tags" },
      { status: 500 }
    );
  }
}
