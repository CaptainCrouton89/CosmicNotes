import { UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// DELETE a specific tag from a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string; tagId: string }> }
) {
  try {
    const noteId = (await params).noteId;
    const tagId = (await params).tagId;

    if (!noteId || !tagId) {
      throw new UserError("Note ID and tag ID are required");
    }

    // Initialize services with proper dependency setup
    const { noteService } = await initializeServices();

    await noteService.deleteTagFromNote(parseInt(noteId), parseInt(tagId));

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error deleting tag:", error);
      return NextResponse.json(
        { error: "Failed to delete tag" },
        { status: 500 }
      );
    }
  }
}
