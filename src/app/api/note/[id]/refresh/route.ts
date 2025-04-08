import { generateNoteTitle } from "@/lib/services/ai-service";
import { getTagsForNote, saveTagsToDatabase } from "@/lib/services/tag-service";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const { id } = await request.json();
  const supabase = await createClient();

  const { data: note, error: noteError } = await supabase
    .from("cosmic_memory")
    .select("content")
    .eq("id", parseInt(id))
    .single();

  if (noteError) {
    console.error("Error fetching note:", noteError);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const newTitle = await generateNoteTitle(note.content);

  const { error: updateError } = await supabase
    .from("cosmic_memory")
    .update({ title: newTitle })
    .eq("id", parseInt(id));

  if (updateError) {
    console.error("Error updating note:", updateError);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }

  // Delete old tags
  const { error: deleteError } = await supabase
    .from("cosmic_tags")
    .delete()
    .eq("note", parseInt(id));

  if (deleteError) {
    console.error("Error deleting old tags:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete old tags" },
      { status: 500 }
    );
  }

  // Generate and save new tags
  try {
    const tags = await getTagsForNote(note.content);
    const supabase = await createClient();

    // Save tags to the database
    await saveTagsToDatabase(supabase, tags, parseInt(id));
  } catch (tagError) {
    console.error("Error generating new tags:", tagError);
    // Don't fail the whole request if tag generation fails
  }

  return NextResponse.json({ success: true }, { status: 200 });
};
