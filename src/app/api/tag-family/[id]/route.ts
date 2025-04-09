import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tagFamily = (await params).id;

    if (!tagFamily) {
      return new Response(
        JSON.stringify({
          error: "Tag family ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = await createClient();

    // Get clusters that match this tag family
    const { data: clusters, error } = await supabaseClient
      .from("cosmic_cluster")
      .select("*")
      .eq("tag_family", tagFamily)
      .order("category");

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch clusters for tag family",
          details: error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!clusters || clusters.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No clusters found for this tag family",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        tagFamily,
        clusters,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("Error fetching tag family data:", err);

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
