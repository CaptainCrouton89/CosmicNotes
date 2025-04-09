import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  try {
    // Parse ID
    const { id } = await params;

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid tag family ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();

    const { data: tagFamily, error } = await supabase
      .from("cosmic_tag_family")
      .select(
        `
        *,
        todo_items:cosmic_todo_item(id, item, done, created_at, updated_at),
        clusters:cosmic_cluster(id, category, tag_count)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch tag family",
          details: error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!tagFamily) {
      return new Response(JSON.stringify({ error: "Tag family not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(tagFamily), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Error fetching tag family:", err);

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
