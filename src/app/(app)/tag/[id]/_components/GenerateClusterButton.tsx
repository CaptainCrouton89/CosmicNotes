import { Button } from "@/components/ui/button";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { Category } from "@/types/types";
import { useState } from "react";

interface GenerateClusterButtonProps {
  tagId: number;
  category: Category;
  isRefresh?: boolean;
}

export function GenerateClusterButton({
  tagId,
  category,
  isRefresh = false,
}: GenerateClusterButtonProps) {
  const [generateCluster, { isLoading }] =
    tagsApi.useGenerateClusterForCategoryMutation();
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCluster = async () => {
    try {
      setError(null);
      await generateCluster({ tagId, category }).unwrap();
    } catch (err) {
      console.error("Failed to generate cluster:", err);
      setError(
        `Failed to ${
          isRefresh ? "refresh" : "generate"
        } cluster. Please try again.`
      );
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerateCluster}
        disabled={isLoading}
        className="mt-2"
      >
        {isLoading
          ? isRefresh
            ? "Refreshing..."
            : "Generating..."
          : isRefresh
          ? `Refresh ${category} cluster`
          : `Generate ${category} cluster`}
      </Button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
