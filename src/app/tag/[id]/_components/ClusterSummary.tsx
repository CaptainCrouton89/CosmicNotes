import { ITEM_CATEGORIES } from "@/lib/constants";
import { Cluster } from "@/types/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ClusterSummaryItems } from "./ClusterSummaryItems";

interface ClusterSummaryProps {
  cluster: Cluster;
}

export function ClusterSummary({ cluster }: ClusterSummaryProps) {
  if (!cluster) return null;

  // Check if this category should display items
  const shouldShowItems = ITEM_CATEGORIES.includes(cluster.category);

  return (
    <div className="mt-4">
      {shouldShowItems ? (
        // Show items from notes using the clusterId
        <ClusterSummaryItems cluster={cluster} />
      ) : (
        // Show markdown summary
        <div className="markdown">
          <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
            {cluster.summary}
          </Markdown>
        </div>
      )}
    </div>
  );
}
