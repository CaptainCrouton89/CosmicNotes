import React from "react";

interface ClusterCardProps {
  cluster: {
    id: number;
    tag_family: string;
    category: string;
    tag_count: number;
    summary: string;
    created_at: string;
    type: string;
  };
  onClick: (cluster: any) => void;
  formatDate: (dateString: string) => string;
  highlightedTagFamily: React.ReactNode;
  highlightedSummary: React.ReactNode;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onClick,
  formatDate,
  highlightedTagFamily,
  highlightedSummary,
}) => {
  return (
    <div
      className="p-5 border rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onClick(cluster)}
    >
      <div className="flex justify-between mb-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-200 text-blue-800">
          CLUSTER
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 text-gray-800">
          {cluster.category}
        </span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">
        {highlightedTagFamily}
        <span className="text-sm font-normal text-gray-600 ml-2">
          ({cluster.tag_count} notes)
        </span>
      </h3>
      <div className="text-md mb-3">
        <div className="text-gray-700">{highlightedSummary}</div>
      </div>
      <div className="text-sm text-gray-500">
        Created {formatDate(cluster.created_at)}
      </div>
    </div>
  );
};
