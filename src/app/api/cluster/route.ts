import { initializeServices } from "@/lib/services";
import { Category } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const tagId = url.searchParams.get("tagId");
    const category = url.searchParams.get("category");

    const { clusterService } = await initializeServices();
    const clusters = await clusterService.getClusters(
      tagId ? parseInt(tagId) : undefined,
      category ? (category as Category) : undefined,
      page,
      limit
    );

    const totalCount = clusters.length;
    const totalPages = Math.ceil(totalCount / limit);

    const paginatedResponse = {
      content: clusters,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    };

    return NextResponse.json(paginatedResponse, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching cluster:", error);
    return NextResponse.json(
      { error: "Failed to fetch cluster" },
      { status: 500 }
    );
  }
}
