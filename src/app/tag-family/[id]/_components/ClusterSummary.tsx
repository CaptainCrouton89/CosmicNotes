import { Database } from "@/types/database.types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Cluster = Database["public"]["Tables"]["cosmic_cluster"]["Row"];

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
