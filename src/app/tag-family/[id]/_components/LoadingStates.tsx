interface ErrorStateProps {
  message?: string;
}

interface EmptyStateProps {
  tagName?: string;
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

export function EmptyState({ tagName }: EmptyStateProps) {
  return (
    <div className="container mx-auto py-8 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-4">
          {tagName ? `No Clusters for "${tagName}"` : "No Clusters Found"}
        </h1>
        <p className="text-gray-600 mb-6">
          {tagName
            ? `There are no clusters currently associated with the "${tagName}" tag family. Clusters are created when there are multiple notes with the same tag in the same category.`
            : "No clusters were found for this tag family."}
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => window.history.back()}
            className="mr-2 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Go Back
          </button>
          <a
            href="/search"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse All Clusters
          </a>
        </div>
      </div>
    </div>
  );
}
