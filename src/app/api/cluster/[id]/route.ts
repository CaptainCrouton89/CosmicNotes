import { ClusterService } from "@/lib/services/cluster-service";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clusterId = parseInt(id, 10);

    const supabase = await createClient();
    const clusterService = new ClusterService(supabase);
    const cluster = await clusterService.getClusterById(clusterId);

    return new Response(JSON.stringify(cluster), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Error fetching cluster:", err);

    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
