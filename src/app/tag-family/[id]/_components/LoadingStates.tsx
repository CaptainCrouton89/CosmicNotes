interface ErrorStateProps {
  message?: string;
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

export function EmptyState() {
  return (
    <div className="container mx-auto py-8">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Tag family not found or no clusters available</p>
      </div>
    </div>
  );
}
