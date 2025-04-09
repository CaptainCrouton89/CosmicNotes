import { generateEmbedding } from "@/lib/embeddings";
import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// GET a specific note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      throw new UserError("Note ID is required");
    }

    const supabase = await createClient();
    const { data: note, error } = await supabase
      .from("cosmic_memory")
      .select("*, cosmic_tags(tag, confidence, created_at)")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      throw new ApplicationError("Failed to fetch note");
    }

    if (!note) {
      throw new UserError("Note not found");
    }

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

// PUT/UPDATE a specific note by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      throw new UserError("Note ID is required");
    }

    const body = await request.json();
    const supabase = await createClient();
    const updateData: Record<string, string | number | unknown> = {};

    // First, fetch the current note to check what's changing
    const { data: currentNote, error: fetchError } = await supabase
      .from("cosmic_memory")
      .select("content")
      .eq("id", parseInt(id))
      .single();

    if (fetchError) {
      throw new ApplicationError("Failed to fetch note for update");
    }

    if (!currentNote) {
      throw new UserError("Note not found");
    }

    // Handle content update (with embedding regeneration) only if content is provided and different
    if (body.content !== undefined) {
      // Only validate content if it's being updated
      if (body.content === "" && currentNote.content !== "") {
        throw new UserError("Note content cannot be empty");
      }

      // Only regenerate embedding if content has changed
      if (body.content !== currentNote.content) {
        updateData.content = body.content;
        updateData.embedding = await generateEmbedding(body.content);
      }
    }

    // Add other fields that might be updated
    ["title", "category", "zone"].forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Always update the updated_at timestamp when any changes are made
    updateData.updated_at = new Date().toISOString();

    // If no fields to update, return the current note
    if (Object.keys(updateData).length === 0) {
      const { data: note, error } = await supabase
        .from("cosmic_memory")
        .select("*, cosmic_tags(tag, confidence, created_at)")
        .eq("id", parseInt(id))
        .single();

      if (error) {
        throw new ApplicationError("Failed to fetch updated note");
      }

      return NextResponse.json({ note });
    }

    // Update the note with only the changed fields
    const { data: note, error } = await supabase
      .from("cosmic_memory")
      .update(updateData)
      .eq("id", parseInt(id))
      .select("*, cosmic_tags(tag, confidence, created_at)")
      .single();

    if (error) {
      throw new ApplicationError("Failed to update note");
    }

    return NextResponse.json({ note });
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

// DELETE a specific note by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const noteId = (await params).id;

    if (!noteId) {
      throw new UserError("Note ID is required");
    }

    // Initialize Supabase client
    const supabaseClient = await createClient();

    // Delete associated tags first
    const { error: tagDeleteError } = await supabaseClient
      .from("cosmic_tags")
      .delete()
      .eq("note", parseInt(noteId));

    if (tagDeleteError) {
      console.error("Failed to delete associated tags:", tagDeleteError);
      // Continue with deleting the note even if tag deletion fails
    }

    // Delete the note
    const { error } = await supabaseClient
      .from("cosmic_memory")
      .delete()
      .eq("id", parseInt(noteId));

    if (error) {
      throw new ApplicationError("Failed to delete note", {
        supabaseError: error,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Note deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
