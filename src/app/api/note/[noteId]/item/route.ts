import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) => {
  try {
    const noteId = parseInt((await params).noteId, 10);
    if (isNaN(noteId)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const { itemService } = await initializeServices();
    const items = await itemService.getItemsByNoteId(noteId);

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
};
