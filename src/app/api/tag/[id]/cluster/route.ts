import { initializeServices } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const { tagService } = await initializeServices();
  const tag = await tagService.generateAllClusters(parseInt(id, 10));

  return NextResponse.json(tag);
};
