import { Cluster } from "@/types/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ClusterSummaryProps {
  cluster: Cluster | undefined;
}

export function ClusterSummary({ cluster }: ClusterSummaryProps) {
  if (!cluster) return null;

  return (
    <div className="markdown mt-4">
      <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
        {cluster.summary}
      </Markdown>
    </div>
  );
}
