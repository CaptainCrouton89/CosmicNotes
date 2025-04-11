import { UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST endpoint to generate tag suggestions for a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ content: string }> }
) {
  try {
    const content = (await params).content;

    if (!content) {
      throw new UserError("Content is required");
    }

    // Initialize services with proper dependency setup
    const { tagService } = await initializeServices();

    // Generate tag suggestions without saving them
    const suggestedTags = await tagService.getTagsForNote(content, 0.5);

    // Additional filter to ensure no X20 tags slip through
    const filteredTags = suggestedTags.filter(
      (tag) => tag.name !== "X20" && !tag.name.includes("X20")
    );

    return NextResponse.json({
      tags: filteredTags,
    });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error generating tag suggestions:", error);
      return NextResponse.json(
        { error: "Failed to generate tag suggestions" },
        { status: 500 }
      );
    }
  }
}
