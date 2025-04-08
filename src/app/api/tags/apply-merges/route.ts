import { createClient } from "@/lib/supabase/server";
import { capitalize } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

// Define schema for request validation
const applyMergesSchema = z.object({
  merges: z.array(
    z.object({
      primaryTag: z.string(),
      similarTags: z.array(z.string()),
    })
  ),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { merges } = applyMergesSchema.parse(body);

    if (!merges || merges.length === 0) {
      return NextResponse.json(
        { message: "No merges to apply" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Apply each merge
    const updates = merges.map(async ({ primaryTag, similarTags }) => {
      // Update all occurrences of similar tags to the primary tag
      const { error: updateError } = await supabase
        .from("cosmic_tags")
        .update({ tag: capitalize(primaryTag) })
        .in("tag", similarTags);

      if (updateError) {
        console.error("Error updating tags:", updateError);
        return {
          success: false,
          primaryTag,
          error: updateError,
        };
      }

      return {
        success: true,
        primaryTag,
        similarTags,
      };
    });

    const results = await Promise.all(updates);

    return NextResponse.json({
      message: "Tag merges applied successfully",
      results,
    });
  } catch (error) {
    console.error("Error applying tag merges:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to apply tag merges" },
      { status: 500 }
    );
  }
}
