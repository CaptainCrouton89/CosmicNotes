import { useToast } from "@/components/ui/use-toast";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { itemsApi } from "@/lib/redux/services/itemsApi";
import { Cluster, Item } from "@/types/types";
import { useCallback, useEffect, useState } from "react";

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
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [updateItemMutation] = itemsApi.useUpdateItemMutation();
  const [createItemMutation] = itemsApi.useCreateItemMutation();
  const [deleteItemMutation] = itemsApi.useDeleteItemMutation();

  // API hooks
  const { data: completeCluster } = clustersApi.useGetClusterQuery(cluster.id);

  const refetchItems = useCallback(() => {
    setIsLoading(true);
    try {
      if (!completeCluster) return;

      // Collect all items from the notes in the cluster
      const allItems: Item[] = [...(completeCluster.cluster_items || [])];

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
  }, [completeCluster, toast]);

  // Extract items from notes in the cluster
  useEffect(() => {
    refetchItems();
  }, [completeCluster]);

  const toggleItemStatus = useCallback(
    async (id: number, currentStatus: boolean) => {
      setLoading((prev) => ({ ...prev, [id]: true }));

      try {
        const updated = await updateItemMutation({
          id,
          done: !currentStatus,
        }).unwrap();

        // Update local state and sort
        setItems((prevItems) => {
          const updatedItems = prevItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  done: !currentStatus,
                  updated_at: updated.updated_at,
                }
              : item
          );
          return sortItems(updatedItems);
        });

        toast({
          title: !currentStatus
            ? "Task completed"
            : "Task marked as incomplete",
          duration: 2000,
        });

        // Refresh items list
        refetchItems();
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
    [updateItemMutation, setLoading, toast, refetchItems]
  );

  // Create new item
  const createItem = useCallback(
    async (itemText: string) => {
      setCreating(true);
      try {
        const newItem = await createItemMutation({
          item: itemText,
          clusterId: cluster.id,
        }).unwrap();

        // Add the new item and sort
        setItems((prevItems) => sortItems([...prevItems, newItem]));

        toast({
          title: "Task added",
          duration: 2000,
        });

        // Refresh items list
        refetchItems();
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
    [createItemMutation, setCreating, toast, refetchItems]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: number) => {
      setDeleting((prev) => ({ ...prev, [id]: true }));

      try {
        await deleteItemMutation(id).unwrap();

        // Remove the deleted item
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));

        toast({
          title: "Task deleted",
          duration: 2000,
        });

        // Refresh items list
        refetchItems();
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
    [deleteItemMutation, setDeleting, toast, refetchItems]
  );

  return {
    creating,
    items,
    isLoading,
    loading,
    deleting,
    createItem,
    deleteItem,
    toggleItemStatus,
  };
};
