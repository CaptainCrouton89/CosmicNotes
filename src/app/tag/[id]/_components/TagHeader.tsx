import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, Category, Cluster } from "@/types/types";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface TagHeaderProps {
  noteCount: number;
  tagName: string;
  activeCluster: Omit<Cluster, "tag"> | null;
  clusters: Omit<Cluster, "tag">[];
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  noteCategories?: Category[];
}

export function TagHeader({
  noteCount,
  tagName,
  activeCluster,
  clusters,
  activeCategory,
  onCategoryChange,
  noteCategories = [],
}: TagHeaderProps) {
  // Get unique categories from clusters
  const clusterCategories = [...new Set(clusters.map((c) => c.category))];

  // Combine cluster categories with note categories to get categories with content
  const categoriesWithContent = new Set<Category>([
    ...clusterCategories,
    ...noteCategories,
  ]);

  // Function to check if a category has content (notes)
  const hasContent = (category: Category) =>
    categoriesWithContent.has(category);

  return (
    <div className="mb-6">
      {/* Compact header with title and metadata */}
      <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
        <h1 className="text-2xl font-bold">{tagName}</h1>
        <span className="text-muted-foreground">({noteCount} notes)</span>

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
          defaultValue={activeCategory}
          value={activeCategory}
          onValueChange={(value) => onCategoryChange(value as Category)}
          className="inline-flex"
        >
          <TabsList className="h-8">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                disabled={!hasContent(category)}
                className={`text-xs px-3 py-1 ${
                  activeCategory === category ? "font-semibold" : ""
                } ${
                  !hasContent(category)
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                data-has-content={hasContent(category).toString()}
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
