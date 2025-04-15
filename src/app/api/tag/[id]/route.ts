import { UserError } from "@/lib/errors";
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

    const tag = await tagService.getTag(tagId);
    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 });
  }
};

// Add PUT method to update a tag
export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const tagId = Number((await params).id);

    if (isNaN(tagId)) {
      throw new UserError("Invalid tag ID");
    }

    const updates = await request.json();

    if (!updates || typeof updates !== "object") {
      throw new UserError("Invalid update data");
    }

    // Initialize services with proper dependency setup
    const { tagService } = await initializeServices();

    await tagService.updateTag(tagId, updates);

    // Fetch the updated tag to return
    const updatedTag = await tagService.getTag(tagId);
    return NextResponse.json(updatedTag);
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error updating tag:", error);
      return NextResponse.json(
        { error: "Failed to update tag" },
        { status: 500 }
      );
    }
  }
};
