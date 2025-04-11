import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST endpoint to refresh a note's metadata
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const id = parseInt((await params).noteId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    // Initialize services with proper dependency setup
    const { noteService } = await initializeServices();

    // Refresh the note, which will also update tags using the tagService
    const updatedNote = await noteService.refreshNote(id);

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error refreshing note:", error);
    return NextResponse.json(
      { error: "Failed to refresh note" },
      { status: 500 }
    );
  }
}
