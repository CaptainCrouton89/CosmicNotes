import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Endpoint to get all reviews with pagination
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (page < 1 || isNaN(page)) {
      throw new UserError("Invalid page parameter");
    }

    if (limit < 1 || limit > 100 || isNaN(limit)) {
      throw new UserError("Invalid limit parameter, must be between 1 and 100");
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Initialize Supabase client
    const supabase = await createClient();

    // Query reviews with pagination and sorting
    const {
      data: reviews,
      error,
      count,
    } = await supabase
      .from("cosmic_note_review")
      .select("*", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApplicationError("Failed to fetch reviews", {
        supabaseError: error,
      });
    }

    // Calculate total pages
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
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
