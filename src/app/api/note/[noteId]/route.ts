import { UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// GET a specific note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: number }> }
) {
  try {
    const noteId = (await params).noteId;
    if (!noteId) {
      throw new UserError("Note ID is required");
    }

    // Initialize services with proper dependency setup
    const { noteService } = await initializeServices();

    const note = await noteService.getNoteById(noteId);

    return NextResponse.json({ note });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error fetching note:", error);
      return NextResponse.json(
        { error: "Failed to fetch note" },
        { status: 500 }
      );
    }
  }
}

// PUT to update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: number }> }
) {
  try {
    const noteId = (await params).noteId;
    if (!noteId) {
      throw new UserError("Note ID is required");
    }

    const updates = await request.json();

    // Initialize services with proper dependency setup
    const { noteService } = await initializeServices();

    await noteService.updateNote(noteId, updates);

    // Get the updated note to return
    const updatedNote = await noteService.getNoteById(noteId);

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error updating note:", error);
      return NextResponse.json(
        { error: "Failed to update note" },
        { status: 500 }
      );
    }
  }
}

// DELETE a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: number }> }
) {
  try {
    const noteId = (await params).noteId;
    if (!noteId) {
      throw new UserError("Note ID is required");
    }

    // Initialize services with proper dependency setup
    const { noteService } = await initializeServices();

    await noteService.deleteNote(noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error deleting note:", error);
      return NextResponse.json(
        { error: "Failed to delete note" },
        { status: 500 }
      );
    }
  }
}
