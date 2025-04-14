// This file is no longer used.
// Use SimilarItemsList.tsx instead.

import { ItemList } from "@/app/note/[id]/_components/ItemList";
import { useClusterItems } from "@/app/tag/hooks/useClusterItems";
import { Cluster } from "@/types/types";
import { Loader2 } from "lucide-react";
interface ClusterSummaryItemsProps {
  cluster: Cluster;
}

export function ClusterSummaryItems({ cluster }: ClusterSummaryItemsProps) {
  const {
    items,
    isLoading,
    loading,
    deleting,
    createItem,
    deleteItem,
    toggleItemStatus,
  } = useClusterItems(cluster);

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
      <ItemList
        items={items}
        loading={loading}
        deleting={deleting}
        creating={false}
        onToggleStatus={toggleItemStatus}
        onCreateItem={createItem}
        onDeleteItem={deleteItem}
      />
    </div>
  );
}
