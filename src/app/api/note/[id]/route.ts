import { generateEmbedding } from "@/lib/embeddings";
import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { generateAndSaveTags } from "@/lib/tags";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// GET a specific note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      throw new UserError("Note ID is required");
    }

    console.log("id", id);

    const supabase = await createClient();
    const { data: note, error } = await supabase
      .from("cosmic_memory")
      .select("*")
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
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      throw new UserError("Note ID is required");
    }

    const body = await request.json();

    if (!body.content && body.content !== "") {
      throw new UserError("Note content is required");
    }

    const supabase = await createClient();

    // Generate new embedding for the updated content
    const embedding = await generateEmbedding(body.content);

    // Update the note with new content and embedding
    const { data: note, error } = await supabase
      .from("cosmic_memory")
      .update({
        content: body.content,
        embedding,
      })
      .eq("id", parseInt(id))
      .select()
      .single();

    if (error) {
      throw new ApplicationError("Failed to update note");
    }

    if (!note) {
      throw new UserError("Note not found");
    }

    // Delete old tags
    const { error: deleteError } = await supabase
      .from("cosmic_tags")
      .delete()
      .eq("note", parseInt(id));

    if (deleteError) {
      console.error("Error deleting old tags:", deleteError);
      // Don't fail the whole request if tag deletion fails
    }

    // Generate and save new tags
    try {
      await generateAndSaveTags(body.content, parseInt(id));
    } catch (tagError) {
      console.error("Error generating new tags:", tagError);
      // Don't fail the whole request if tag generation fails
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
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;

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
