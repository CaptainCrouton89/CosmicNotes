import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clusterId = parseInt(params.id, 10);

    if (isNaN(clusterId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid cluster ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = await createClient();

    const { data, error } = await supabaseClient
      .from("cosmic_cluster")
      .select("*")
      .eq("id", clusterId)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch cluster",
          details: error,
        }),
        {
          status: error.code === "PGRST116" ? 404 : 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: "Cluster not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Error fetching cluster:", err);

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
