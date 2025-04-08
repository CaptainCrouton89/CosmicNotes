import { ApplicationError, UserError } from "@/lib/errors";
import { searchNotes } from "@/lib/services/search-service";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const matchCount = parseInt(url.searchParams.get("matchCount") || "10", 10);
    const matchThreshold = parseFloat(
      url.searchParams.get("matchThreshold") || "0.5"
    );

    if (!query) {
      throw new UserError("Missing query parameter");
    }

    // Use the search service to get matching notes
    const notesWithTags = await searchNotes(query, matchCount, matchThreshold);

    return new Response(
      JSON.stringify({
        notes: notesWithTags,
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
