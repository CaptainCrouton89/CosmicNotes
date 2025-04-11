import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    // Initialize services with proper dependency setup
    const { tagService } = await initializeServices();

    const tags = await tagService.getAllTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
};
