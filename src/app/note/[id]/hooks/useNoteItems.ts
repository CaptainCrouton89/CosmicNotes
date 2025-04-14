import { useToast } from "@/components/ui/use-toast";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { itemsApi } from "@/lib/redux/services/itemsApi";
import { Item, Note } from "@/types/types";
import { useEffect, useState } from "react";

// Helper function to sort items
const sortItems = (items: Item[]): Item[] => {
  return [...items].sort((a, b) => {
    // First, sort by completion status (incomplete first)
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    // Then sort by updated_at date (most recent first)
    if (!a.done) {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    // For completed items, keep the same order
    return 0;
  });
};

export function useNoteItems(note: Note | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // API mutations
  const [updateItemMutation] = itemsApi.useUpdateItemMutation();
  const [createItemMutation] = itemsApi.useCreateItemMutation();
  const [deleteItemMutation] = itemsApi.useDeleteItemMutation();

  // Fetch items directly from the API if available
  const {
    data: fetchedItems,
    isLoading: isFetchingItems,
    refetch: refetchItems,
  } = itemsApi.useGetItemsByNoteIdQuery(note?.id || 0, {
    skip: !note?.id,
  });

  // When note category changes to an items category, trigger a refetch
  useEffect(() => {
    if (note && ITEM_CATEGORIES.includes(note.category)) {
      refetchItems();
    }
  }, [note?.category, refetchItems, note]);

  // Update items when note changes or when items are fetched
  useEffect(() => {
    if (fetchedItems) {
      // Prefer items from direct API fetch
      setItems(sortItems(fetchedItems));
    } else if (note?.items) {
      // Fallback to items from note
      setItems(sortItems(note.items as Item[]));
    }
  }, [note, fetchedItems]);

  // Toggle item done status
  const toggleItemStatus = async (id: number, currentStatus: boolean) => {
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
            ? { ...item, done: !currentStatus, updated_at: updated.updated_at }
            : item
        );
        return sortItems(updatedItems);
      });

      toast({
        title: !currentStatus ? "Task completed" : "Task marked as incomplete",
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
  };

  // Create new item
  const createItem = async (itemText: string) => {
    if (!note?.id) return;

    setCreating(true);
    try {
      const newItem = await createItemMutation({
        item: itemText,
        noteId: note.id,
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
  };

  // Delete item
  const deleteItem = async (id: number) => {
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
  };

  // Separate states for tracking items existence and if note is an items category
  const hasItemsData =
    items.length > 0 || (note?.items && note.items.length > 0);
  const isItemCategory = note ? ITEM_CATEGORIES.includes(note.category) : false;
  const hasItems = hasItemsData || isItemCategory;
  const isLoading = isFetchingItems;

  return {
    items,
    loading,
    deleting,
    creating,
    hasItems,
    hasItemsData,
    isItemCategory,
    isLoading,
    toggleItemStatus,
    createItem,
    deleteItem,
    refetchItems,
  };
}
