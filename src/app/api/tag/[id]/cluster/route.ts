import { initializeServices } from "@/lib/services";
import { NextResponse } from "next/server";

export const POST = async ({ params }: { params: Promise<{ id: number }> }) => {
  const { id } = await params;
  const { tagService } = await initializeServices();
  const tag = await tagService.generateAllClusters(id);

  return NextResponse.json(tag);
};
