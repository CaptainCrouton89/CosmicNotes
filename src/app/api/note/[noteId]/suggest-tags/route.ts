import { UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST endpoint to generate tag suggestions for a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const noteId = (await params).noteId;

    if (!noteId) {
      throw new UserError("Note ID is required");
    }

    // Initialize services with proper dependency setup
    const { tagService, noteService } = await initializeServices();

    // Get the note content
    const note = await noteService.getNoteById(parseInt(noteId));

    if (!note) {
      throw new UserError("Note not found");
    }

    // Generate tag suggestions without saving them
    const suggestedTags = await tagService.getTagsForNote(
      note.content as string,
      0.5
    );

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
