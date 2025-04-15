import { useToast } from "@/components/ui/use-toast";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { itemsApi } from "@/lib/redux/services/itemsApi";
import { Cluster, Item } from "@/types/types";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export const useClusterItems = (cluster: Cluster) => {
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [updateItemMutation] = itemsApi.useUpdateItemMutation();
  const [createItemMutation] = itemsApi.useCreateItemMutation();
  const [deleteItemMutation] = itemsApi.useDeleteItemMutation();

  // API hooks - RTK Query will automatically refetch when cache is invalidated
  const {
    data: completeCluster,
    isLoading,
    refetch,
  } = clustersApi.useGetClusterQuery(cluster.id, {
    refetchOnMountOrArgChange: true,
  });

  // Extract and sort items directly from cluster data
  const serverItems = useMemo(() => {
    if (!completeCluster) return [];

    // Collect all items from the notes in the cluster
    const allItems: Item[] = [...(completeCluster.cluster_items || [])];

    completeCluster.notes.forEach((note) => {
      if (note.items && note.items.length > 0) {
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

    return sortItems(allItems);
  }, [completeCluster]);

  // Update local items whenever server items change
  useEffect(() => {
    if (serverItems.length > 0) {
      setLocalItems(serverItems);
    }
  }, [serverItems]);

  const toggleItemStatus = useCallback(
    async (id: number, currentStatus: boolean) => {
      setLoading((prev) => ({ ...prev, [id]: true }));

      try {
        await updateItemMutation({
          id,
          done: !currentStatus,
        }).unwrap();
        await refetch();
        toast({
          title: !currentStatus
            ? "Task completed"
            : "Task marked as incomplete",
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: "Failed to update task",
          variant: "destructive",
          duration: 4000,
        });
        console.error("Failed to update item:", error);
      } finally {
        setLoading((prev) => ({ ...prev, [id]: false }));
      }
    },
    [updateItemMutation, toast, refetch]
  );

  // Create new item
  const createItem = useCallback(
    async (itemText: string) => {
      setCreating(true);
      try {
        await createItemMutation({
          item: itemText,
          clusterId: cluster.id,
        }).unwrap();
        await refetch();
      } catch (error) {
        toast({
          title: "Failed to create task",
          variant: "destructive",
          duration: 4000,
        });
        console.error("Failed to create item:", error);
      } finally {
        setCreating(false);
      }
    },
    [createItemMutation, cluster.id, toast, refetch]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: number) => {
      setDeleting((prev) => ({ ...prev, [id]: true }));

      try {
        await deleteItemMutation(id).unwrap();
        await refetch();
      } catch (error) {
        toast({
          title: "Failed to delete task",
          variant: "destructive",
          duration: 4000,
        });
        console.error("Failed to delete item:", error);
      } finally {
        setDeleting((prev) => ({ ...prev, [id]: false }));
      }
    },
    [deleteItemMutation, toast, refetch]
  );

  // Prefer local items if available, otherwise use server items
  const items = localItems.length > 0 ? localItems : serverItems;

  return {
    creating,
    items,
    isLoading,
    loading,
    deleting,
    createItem,
    deleteItem,
    toggleItemStatus,
    refetchItems: () => refetch(),
  };
};
