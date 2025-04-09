import { ApplicationError, UserError } from "@/lib/errors";
import { generateWeeklyReview } from "@/lib/services/ai-service";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Get the current date and calculate the date one week ago
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Format dates for database query
    const endDate = now.toISOString();
    const startDate = oneWeekAgo.toISOString();

    // Fetch notes from the past week
    const { data: notes, error: notesError } = await supabase
      .from("cosmic_memory")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    if (notesError) {
      throw new ApplicationError("Failed to fetch notes for review", {
        supabaseError: notesError,
      });
    }

    // If no notes found in the past week, return appropriate message
    if (!notes || notes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No notes found from the past week to generate a review.",
        },
        { status: 404 }
      );
    }

    // Generate the weekly review summary
    const weeklyReview = await generateWeeklyReview(notes);

    // Save the review to the database
    const { data: savedReview, error: saveError } = await supabase
      .from("cosmic_note_review")
      .insert({
        review: weeklyReview,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      throw new ApplicationError("Failed to save the weekly review", {
        supabaseError: saveError,
      });
    }

    return NextResponse.json({
      success: true,
      review: savedReview,
      noteCount: notes.length,
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

// Also implement a GET endpoint to retrieve the most recent weekly review
export async function GET(req: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Fetch the most recent review
    const { data: latestReview, error: reviewError } = await supabase
      .from("cosmic_note_review")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (reviewError) {
      // If no review found, return 404
      if (reviewError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            message: "No weekly reviews found.",
          },
          { status: 404 }
        );
      }

      throw new ApplicationError("Failed to fetch the latest review", {
        supabaseError: reviewError,
      });
    }

    return NextResponse.json({
      success: true,
      review: latestReview,
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
