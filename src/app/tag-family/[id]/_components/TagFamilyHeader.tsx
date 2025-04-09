import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database } from "@/types/database.types";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

type Cluster = Database["public"]["Tables"]["cosmic_cluster"]["Row"];

interface TagFamilyHeaderProps {
  tagName: string;
  activeCluster: Cluster | undefined;
  clusters: Cluster[];
  activeCategory: string | null;
  onCategoryChange: (category: string) => void;
}

export function TagFamilyHeader({
  tagName,
  activeCluster,
  clusters,
  activeCategory,
  onCategoryChange,
}: TagFamilyHeaderProps) {
  return (
    <div className="mb-6">
      {/* Compact header with title and metadata */}
      <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
        <h1 className="text-2xl font-bold">{tagName}</h1>
        {activeCluster && (
          <span className="text-muted-foreground">
            ({activeCluster.tag_count} notes)
          </span>
        )}

        {activeCluster && (
          <div className="flex items-center text-xs text-gray-500 ml-auto">
            <span className="flex items-center gap-1 mr-3">
              <Calendar size={14} />
              {format(new Date(activeCluster.created_at), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {format(new Date(activeCluster.updated_at), "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      {activeCluster && (
        <div className="flex items-center mb-4">
          <Tabs
            defaultValue={activeCategory || clusters[0].category}
            value={activeCategory || clusters[0].category}
            onValueChange={onCategoryChange}
            className="inline-flex"
          >
            <TabsList className="h-8">
              {[...clusters]
                .sort((a, b) => a.category.localeCompare(b.category))
                .map((cluster: Cluster) => (
                  <TabsTrigger
                    key={cluster.id}
                    value={cluster.category}
                    className={`text-xs px-3 py-1 ${
                      activeCategory === cluster.category ? "font-semibold" : ""
                    }`}
                  >
                    {cluster.category}
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
}
