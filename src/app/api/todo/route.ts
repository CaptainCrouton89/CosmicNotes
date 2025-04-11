import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const { id, done } = await req.json();

    if (typeof id !== "number" || typeof done !== "boolean") {
      return NextResponse.json(
        {
          error: "Invalid request. Expected 'id' (number) and 'done' (boolean)",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cosmic_collection_item")
      .update({ done, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating todo item:", error);
      return NextResponse.json(
        { error: "Failed to update todo item" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in todo update:", error);
    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { item, tag } = await req.json();

    if (typeof item !== "string" || typeof tag !== "number") {
      return NextResponse.json(
        {
          error: "Invalid request. Expected 'item' (string) and 'tag' (number)",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("cosmic_collection_item")
      .insert({
        item,
        tag,
        done: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating todo item:", error);
      return NextResponse.json(
        { error: "Failed to create todo item" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in todo creation:", error);
    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
