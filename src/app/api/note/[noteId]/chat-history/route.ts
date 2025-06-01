import { initializeServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ noteId: string }> }
) {
  try {
    const params = await context.params;
    const noteId = parseInt(params.noteId);
    const { chatHistory } = await request.json();

    if (!noteId || isNaN(noteId)) {
      return NextResponse.json(
        { error: "Invalid note ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update the note's chat_history field
    const { error } = await supabase
      .from("cosmic_memory")
      .update({ chat_history: chatHistory })
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating chat history:", error);
      return NextResponse.json(
        { error: "Failed to update chat history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in chat history endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}