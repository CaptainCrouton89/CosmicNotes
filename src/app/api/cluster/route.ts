import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const tagFamilyParam = url.searchParams.get("tagFamily");
    const category = url.searchParams.get("category");
    const excludeIdsParam = url.searchParams.get("excludeIds");

    // Parse tag family ID if provided
    const tagFamilyId = tagFamilyParam ? parseInt(tagFamilyParam, 10) : null;

    const excludeIds = excludeIdsParam
      ? excludeIdsParam
          .split(",")
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id))
      : [];

    const offset = (page - 1) * limit;

    const supabaseClient = await createClient();

    // Build the query
    let query = supabaseClient.from("cosmic_cluster").select(
      `
        *,
        tag_families:cosmic_tag_family(
          id, 
          tag,
          todo_items:cosmic_todo_item(id, item, done, created_at, updated_at)
        )
      `,
      { count: "exact" }
    );

    // Apply filters if provided
    if (tagFamilyId !== null && !isNaN(tagFamilyId)) {
      query = query.eq("tag_family", tagFamilyId);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    // Get total count with filters
    const { count, error: countError } = await query.limit(1);

    if (countError) {
      return new Response(
        JSON.stringify({
          error: "Failed to get cluster count",
          details: countError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get paginated data with the same filters
    let dataQuery = supabaseClient.from("cosmic_cluster").select(`
        *,
        tag_families:cosmic_tag_family(
          id, 
          tag,
          todo_items:cosmic_todo_item(id, item, done, created_at, updated_at)
        )
      `);

    // Apply the same filters
    if (tagFamilyId !== null && !isNaN(tagFamilyId)) {
      dataQuery = dataQuery.eq("tag_family", tagFamilyId);
    }

    if (category) {
      dataQuery = dataQuery.eq("category", category);
    }

    if (excludeIds.length > 0) {
      dataQuery = dataQuery.not("id", "in", `(${excludeIds.join(",")})`);
    }

    // Add sorting and pagination
    const { data: clusters, error } = await dataQuery
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch clusters",
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

    // Format response to include tag_family_name and todo_items
    const formattedClusters = clusters?.map((cluster) => ({
      ...cluster,
      tag_family_name: cluster.tag_families?.tag || String(cluster.tag_family),
      todo_items: cluster.tag_families?.todo_items || [],
    }));

    return new Response(
      JSON.stringify({
        clusters: formattedClusters,
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
    console.error("Error fetching clusters:", err);

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
