import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const clusterId = parseInt(params.id);
    const { chatHistory } = await request.json();

    if (!clusterId || isNaN(clusterId)) {
      return NextResponse.json(
        { error: "Invalid cluster ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update the cluster's chat_history field
    const { error } = await supabase
      .from("cosmic_cluster")
      .update({ chat_history: chatHistory })
      .eq("id", clusterId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating cluster chat history:", error);
      return NextResponse.json(
        { error: "Failed to update chat history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in cluster chat history endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}