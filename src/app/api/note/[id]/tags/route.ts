import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// GET tags for a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      throw new UserError("Note ID is required");
    }

    const supabase = await createClient();

    // Get tags for the note
    const { data: tags, error } = await supabase
      .from("cosmic_tags")
      .select("*")
      .eq("note", parseInt(id))
      .order("confidence", { ascending: false });

    if (error) {
      throw new ApplicationError("Failed to fetch tags");
    }

    return NextResponse.json({ tags });
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error("Error fetching tags:", error);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 }
      );
    }
  }
}
