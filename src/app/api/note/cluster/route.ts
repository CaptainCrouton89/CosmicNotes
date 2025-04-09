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

    // Get the tag string from the tag_family table
    const { data: tagFamily, error: tagFamilyError } = await supabaseClient
      .from("cosmic_tag_family")
      .select("tag")
      .eq("id", cluster.tag_family)
      .single();

    if (tagFamilyError || !tagFamily) {
      return new Response(
        JSON.stringify({
          error: "Tag family not found",
          details: tagFamilyError,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const tagString = tagFamily.tag;

    // Get total count of notes with this cluster's tag and category
    const { error: countError } = await supabaseClient
      .from("cosmic_tags")
      .select("note", { count: "exact", head: true })
      .eq("tag", tagString);

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

    // Get notes for the cluster's tag
    const { data: taggedNotes, error: notesError } = await supabaseClient
      .from("cosmic_tags")
      .select("note")
      .eq("tag", tagString);

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

    // Get the actual note details with correct category
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

    // Filter by category if specified in the cluster
    let notesQuery = supabaseClient
      .from("cosmic_memory")
      .select("*")
      .in("id", noteIds);

    if (cluster.category) {
      notesQuery = notesQuery.eq("category", cluster.category);
    }

    // Add pagination and sorting
    const { data: notes, error: fetchError } = await notesQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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

    // Get count of notes matching both tag and category
    const filteredCount = notes.length;
    const totalPages = Math.ceil(filteredCount / limit);
    const hasMore = page < totalPages;

    return new Response(
      JSON.stringify({
        notes,
        pagination: {
          page,
          limit,
          totalCount: filteredCount,
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
    console.error("Error fetching notes for cluster:", err);
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
