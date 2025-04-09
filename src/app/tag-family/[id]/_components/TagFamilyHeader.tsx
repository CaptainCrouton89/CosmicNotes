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
  // Get unique categories from clusters
  const clusterCategories = [...new Set(clusters.map((c) => c.category))];

  // Check if "To-Do" exists in categories
  const hasToDoCategory = clusterCategories.includes("To-Do");

  // Create a full list of tabs to display, always including "To-Do"
  const displayCategories = [...clusterCategories];

  // If there's no "To-Do" category, add it to the tabs
  if (!hasToDoCategory) {
    displayCategories.unshift("To-Do");
  }

  // Sort categories with "To-Do" first
  displayCategories.sort((a, b) => {
    if (a === "To-Do") return -1;
    if (b === "To-Do") return 1;
    return a.localeCompare(b);
  });

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
      <div className="flex items-center mb-4">
        <Tabs
          defaultValue={activeCategory || displayCategories[0]}
          value={activeCategory || displayCategories[0]}
          onValueChange={onCategoryChange}
          className="inline-flex"
        >
          <TabsList className="h-8">
            {displayCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className={`text-xs px-3 py-1 ${
                  activeCategory === category ? "font-semibold" : ""
                }`}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
