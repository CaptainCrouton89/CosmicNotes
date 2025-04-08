import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// DELETE a specific tag from a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { noteId: string; tag: string } }
) {
  try {
    const { noteId, tag } = params;

    if (!noteId || !tag) {
      throw new UserError("Note ID and tag are required");
    }

    const supabase = await createClient();

    // Delete the specific tag from the note
    const { error } = await supabase
      .from("cosmic_tags")
      .delete()
      .eq("note", parseInt(noteId))
      .eq("tag", decodeURIComponent(tag));

    if (error) {
      console.error("Error deleting tag:", error);
      throw new ApplicationError("Failed to delete tag");
    }

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
