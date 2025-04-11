import { UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Update an item (toggle completion status)
 */
export async function PUT(req: NextRequest) {
  try {
    const { id, done } = await req.json();

    if (typeof id !== "number" || typeof done !== "boolean") {
      throw new UserError(
        "Invalid request. Expected 'id' (number) and 'done' (boolean)"
      );
    }

    // Initialize services
    const { itemService } = await initializeServices();

    // Get the item to update
    const item = await itemService.getItem(id);

    // Update the item with new done status
    const updatedItem = await itemService.updateItem({
      ...item,
      done,
      updated_at: new Date().toISOString(),
      memory: item.memory.id,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

/**
 * Create a new item
 */
export async function POST(req: NextRequest) {
  try {
    const { item, tag } = await req.json();

    if (typeof item !== "string" || typeof tag !== "number") {
      throw new UserError(
        "Invalid request. Expected 'item' (string) and 'tag' (number)"
      );
    }

    // Get the note to associate with this item
    const supabase = await createClient();
    const { data: note, error: noteError } = await supabase
      .from("cosmic_memory")
      .select("*")
      .eq("id", tag)
      .single();

    if (noteError || !note) {
      throw new UserError("Note not found");
    }

    // Initialize services
    const { itemService } = await initializeServices();

    const timestamp = new Date().toISOString();
    const newItem = await itemService.createItem({
      item,
      memory: note.id,
      done: false,
      created_at: timestamp,
      updated_at: timestamp,
    });

    return NextResponse.json(newItem);
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
