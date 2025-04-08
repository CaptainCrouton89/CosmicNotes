import { ApplicationError, UserError } from "@/lib/errors";
import { getTagsForNote } from "@/lib/services/tag-service";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST endpoint to generate tag suggestions for a note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      throw new UserError("Note ID is required");
    }

    const supabase = await createClient();

    // Get the note content
    const { data: note, error: noteError } = await supabase
      .from("cosmic_memory")
      .select("content")
      .eq("id", parseInt(id))
      .single();

    if (noteError) {
      console.error("Error fetching note:", noteError);
      throw new ApplicationError("Failed to fetch note");
    }

    if (!note) {
      throw new UserError("Note not found");
    }

    // Generate tag suggestions without saving them
    const suggestedTags = await getTagsForNote(note.content);

    return NextResponse.json({
      tags: suggestedTags,
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
