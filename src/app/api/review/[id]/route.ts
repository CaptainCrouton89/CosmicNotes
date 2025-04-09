import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Get a specific review by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      throw new UserError("Invalid review ID");
    }

    const supabase = await createClient();

    const { data: review, error } = await supabase
      .from("cosmic_note_review")
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Review with ID ${id} not found`,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw new ApplicationError("Failed to fetch review", {
        supabaseError: error,
      });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return NextResponse.json(
        {
          error: err.message,
          data: err.data,
        },
        { status: 400 }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return NextResponse.json(
      {
        error: "There was an error processing your request",
      },
      { status: 500 }
    );
  }
}

// Delete a review by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      throw new UserError("Invalid review ID");
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("cosmic_note_review")
      .delete()
      .eq("id", parseInt(id));

    if (error) {
      throw new ApplicationError("Failed to delete review", {
        supabaseError: error,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Review with ID ${id} has been deleted`,
    });
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return NextResponse.json(
        {
          error: err.message,
          data: err.data,
        },
        { status: 400 }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return NextResponse.json(
      {
        error: "There was an error processing your request",
      },
      { status: 500 }
    );
  }
}
