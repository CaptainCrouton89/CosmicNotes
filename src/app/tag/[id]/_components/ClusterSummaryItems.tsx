// This file is no longer used.
// Use SimilarItemsList.tsx instead.

import { useToast } from "@/components/ui/use-toast";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { Cluster, Item } from "@/types/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ClusterSummary } from "./ClusterSummary";
interface ClusterSummaryItemsProps {
  cluster: Cluster;
}

// Helper function to sort items
const sortItems = (items: Item[]): Item[] => {
  return [...items].sort((a, b) => {
    // Incomplete items first
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    // Then sort by updated_at date (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
};

export function ClusterSummaryItems({ cluster }: ClusterSummaryItemsProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // API hooks
  const { data: completeCluster } = clustersApi.useGetClusterQuery(cluster.id);

  // Extract items from notes in the cluster
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        if (!completeCluster) return;

        // Collect all items from the notes in the cluster
        const allItems: Item[] = [];

        completeCluster.notes.forEach((note) => {
          if (note.items && note.items.length > 0) {
            // Convert each item to Item type and add to allItems
            note.items.forEach((item) => {
              if (item.id) {
                allItems.push({
                  id: item.id,
                  item: item.item || "",
                  done: item.done || false,
                  created_at: item.created_at || new Date().toISOString(),
                  updated_at: item.updated_at || new Date().toISOString(),
                });
              }
            });
          }
        });

        setItems(sortItems(allItems));
      } catch (error) {
        console.error("Error extracting items:", error);
        toast({
          title: "Failed to load items",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [completeCluster, toast]);

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading items...</span>
      </div>
    );
  }

  // Only render if there are items
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-medium">Related Items</h3>

      <ClusterSummary cluster={cluster} />
    </div>
  );
}
