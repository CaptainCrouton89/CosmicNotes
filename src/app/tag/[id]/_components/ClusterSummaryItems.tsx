import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { itemsApi } from "@/lib/redux/services/itemsApi";
import { Cluster, Item } from "@/types/types";
import { Loader2, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // API hooks
  const { data: completeCluster } = clustersApi.useGetClusterQuery(cluster.id);
  const [updateItemMutation] = itemsApi.useUpdateItemMutation();
  const [deleteItemMutation] = itemsApi.useDeleteItemMutation();

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

  const handleToggleStatus = async (id: number, done: boolean) => {
    setLoading((prev) => ({ ...prev, [id]: true }));

    try {
      const updated = await updateItemMutation({ id, done: !done }).unwrap();

      // Update local state and resort
      setItems((prevItems) => {
        const updatedItems = prevItems.map((item) =>
          item.id === id
            ? { ...item, done: !done, updated_at: updated.updated_at }
            : item
        );
        return sortItems(updatedItems);
      });

      toast({
        title: !done ? "Task completed" : "Task marked as incomplete",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to update item:", error);
      toast({
        title: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteItem = async (id: number) => {
    setDeleting((prev) => ({ ...prev, [id]: true }));

    try {
      await deleteItemMutation(id).unwrap();

      // Remove the deleted item
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));

      toast({
        title: "Task deleted",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({
        title: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

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

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 p-3 rounded-md border ${
              item.done ? "bg-gray-50" : "bg-white"
            }`}
          >
            <Checkbox
              checked={item.done}
              disabled={loading[item.id]}
              onCheckedChange={() => handleToggleStatus(item.id, item.done)}
              className="h-5 w-5"
            />
            <span
              onClick={() =>
                !loading[item.id] && handleToggleStatus(item.id, item.done)
              }
              className={`flex-grow ${
                item.done ? "line-through text-gray-500" : ""
              } cursor-pointer hover:bg-gray-50 px-2 py-1 rounded`}
            >
              {item.item}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteItem(item.id)}
              disabled={deleting[item.id]}
              className="h-8 w-8 text-gray-500 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
