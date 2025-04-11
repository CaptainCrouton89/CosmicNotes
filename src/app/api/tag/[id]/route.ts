import { initializeServices } from "@/lib/services";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const tagId = Number((await params).id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    // Initialize services with proper dependency setup
    const { tagService } = await initializeServices();

    console.log("tagId", tagId);
    const tag = await tagService.getTag(tagId);
    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 });
  }
};
