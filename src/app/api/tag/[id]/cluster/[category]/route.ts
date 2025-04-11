import { initializeServices } from "@/lib/services";
import { Category } from "@/types/types";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: number; category: Category }> }
) => {
  const { id, category } = await params;
  console.log("Generating cluster for category", category, "with id", id);
  const { tagService } = await initializeServices();
  const cluster = await tagService.generateClusterForCategory(
    category,
    true,
    undefined,
    id
  );

  console.log(
    "Cluster generated for category",
    category,
    "with id",
    id,
    "cluster",
    cluster
  );
  return NextResponse.json(cluster);
};
