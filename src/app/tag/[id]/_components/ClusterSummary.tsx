import { ITEM_CATEGORIES } from "@/lib/constants";
import { Cluster, Note } from "@/types/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ClusterSummaryItems } from "./ClusterSummaryItems";

interface ClusterSummaryProps {
  cluster: Cluster | undefined;
  notes: Note[];
  tagId: number;
}

export function ClusterSummary({ cluster, notes, tagId }: ClusterSummaryProps) {
  if (!cluster) return null;

  // Check if this category should display items
  const shouldShowItems = ITEM_CATEGORIES.includes(cluster.category);

  return (
    <div className="mt-4">
      {shouldShowItems ? (
        // Show items from notes
        <ClusterSummaryItems notes={notes} tagId={tagId} />
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
