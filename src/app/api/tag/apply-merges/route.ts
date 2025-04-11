import { initializeServices } from "@/lib/services";
import { TagMerge } from "@/lib/services/tag-service";
import { NextResponse } from "next/server";
import { z } from "zod";

// Define the schema for the request body
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
    // Parse and validate the request body
    const body = await request.json();
    const { merges } = applyMergesSchema.parse(body);

    // Initialize services
    const { tagService } = await initializeServices();

    // Process merges using the tag service
    const results = await tagService.mergeTags(merges as TagMerge[]);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error applying tag merges:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to apply tag merges" },
      { status: 500 }
    );
  }
}
