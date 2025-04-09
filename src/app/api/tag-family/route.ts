import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Get total count
    const { count, error: countError } = await supabase
      .from("cosmic_tag_family")
      .select("*", { count: "exact" })
      .limit(1);

    if (countError) {
      return new Response(
        JSON.stringify({
          error: "Failed to get tag families count",
          details: countError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get paginated data with todo items
    const { data: tagFamilies, error } = await supabase
      .from("cosmic_tag_family")
      .select(
        `
        *,
        todo_items:cosmic_todo_item(id, item, done, created_at, updated_at),
        clusters:cosmic_cluster(id, category, tag_count)
      `
      )
      .order("tag", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch tag families",
          details: error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return new Response(
      JSON.stringify({
        tagFamilies,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("Error fetching tag families:", err);

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
