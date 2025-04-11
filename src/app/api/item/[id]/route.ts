import { UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Delete an item by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      throw new UserError("Invalid item ID");
    }

    // Initialize services
    const { itemService } = await initializeServices();

    // First get the item to ensure it exists
    try {
      await itemService.getItem(itemId);
    } catch {
      throw new UserError("Item not found");
    }

    // Delete the item
    await itemService.deleteItem(itemId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
