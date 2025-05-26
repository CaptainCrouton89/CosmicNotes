import { Button } from "@/components/ui/button";
import { tagsApi } from "@/lib/redux/services/tagsApi";

interface ErrorStateProps {
  message?: string;
}

interface EmptyStateProps {
  tagName?: string;
  tagId: number;
}

export function LoadingState() {
  return (
    <div className="container mx-auto py-8">
      <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mb-8"></div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message = "Error loading tag family data",
}: ErrorStateProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ tagName, tagId }: EmptyStateProps) {
  const [generateClusters, { isLoading }] =
    tagsApi.useGenerateClustersMutation();

  const handleGenerateClusters = async () => {
    try {
      await generateClusters(tagId).unwrap();
    } catch (error) {
      console.error("Failed to generate clusters:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-4">
          {tagName ? `No Clusters for "${tagName}"` : "No Clusters Found"}
        </h1>
        <p className="text-gray-600 mb-6">
          {tagName
            ? `There are no clusters currently associated with the "${tagName}" tag family. Create a cluster to get started.`
            : "No clusters were found for this tag family. Create a cluster to get started."}
        </p>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button
            variant={"outline"}
            onClick={handleGenerateClusters}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Clusters"}
          </Button>
        </div>
      </div>
    </div>
  );
}
