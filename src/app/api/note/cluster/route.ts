import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const clusterIdParam = url.searchParams.get("clusterId");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    if (!clusterIdParam) {
      return new Response(
        JSON.stringify({
          error: "Missing clusterId parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const clusterId = parseInt(clusterIdParam, 10);

    if (isNaN(clusterId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid clusterId parameter, must be a number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = await createClient();

    // Get the cluster to verify it exists
    const { data: cluster, error: clusterError } = await supabaseClient
      .from("cosmic_cluster")
      .select("*")
      .eq("id", clusterId)
      .single();

    if (clusterError) {
      return new Response(
        JSON.stringify({
          error: "Cluster not found",
          details: clusterError,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get total count of notes with this cluster's tag
    const { count, error: countError } = await supabaseClient
      .from("cosmic_tags")
      .select("*", { count: "exact", head: true })
      .eq("tag", cluster.tag);

    if (countError) {
      return new Response(
        JSON.stringify({
          error: "Failed to get note count",
          details: countError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get notes for the cluster
    const { data: taggedNotes, error: notesError } = await supabaseClient
      .from("cosmic_tags")
      .select("note")
      .eq("tag", cluster.tag)
      .range(offset, offset + limit - 1);

    if (notesError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch tagged notes",
          details: notesError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the actual note details
    const noteIds = taggedNotes.map((tag) => tag.note);

    if (noteIds.length === 0) {
      return new Response(
        JSON.stringify({
          notes: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasMore: false,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: notes, error: fetchError } = await supabaseClient
      .from("cosmic_memory")
      .select("*")
      .in("id", noteIds)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch notes",
          details: fetchError,
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
        notes: notes || [],
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
    console.error(err);

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
