import { ApplicationError, UserError } from "@/lib/errors";
import { saveTagsToDatabase } from "@/lib/services/tag-service";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// POST endpoint to save selected tags for a note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      throw new UserError("Note ID is required");
    }

    const body = await request.json();

    if (!body.tags || !Array.isArray(body.tags)) {
      throw new UserError("Tags are required and must be an array");
    }

    const supabase = await createClient();

    // Get the note to verify it exists
    const { data: note, error: noteError } = await supabase
      .from("cosmic_memory")
      .select("id")
      .eq("id", parseInt(id))
      .single();

    if (noteError) {
      console.error("Error fetching note:", noteError);
      throw new ApplicationError("Failed to fetch note");
    }

    if (!note) {
      throw new UserError("Note not found");
    }

    // Save the selected tags
    await saveTagsToDatabase(supabase, body.tags, parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Tags saved successfully",
    });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error saving tags:", error);
      return NextResponse.json(
        { error: "Failed to save tags" },
        { status: 500 }
      );
    }
  }
}
