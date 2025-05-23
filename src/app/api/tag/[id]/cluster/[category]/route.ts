import { initializeServices } from "@/lib/services";
import { Category } from "@/types/types";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: number; category: Category }> }
) => {
  const { id, category } = await params;
  const { tagService } = await initializeServices();
  const cluster = await tagService.generateClusterForCategory(
    category,
    true,
    undefined,
    id
  );

  return NextResponse.json(cluster);
};
