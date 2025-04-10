"use client";

import { useToast } from "@/components/ui/use-toast";
import { itemsApi } from "@/lib/redux/services/itemsApi";
import { Item } from "@/types/types";
import { useEffect, useState } from "react";
import { TodoList } from "./TodoList";

interface TodoListContainerProps {
  tagId: number;
  initialTodos: Item[];
}

// Helper function to sort todos:
// 1. Incomplete items first, completed items at the end
// 2. Within each group, most recently updated items first
const sortTodos = (todos: Item[]): Item[] => {
  return [...todos].sort((a, b) => {
    // First, sort by completion status (incomplete first)
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    // Then, within each group, sort by updated_at date (most recent first)
    // Only sort incomplete items by update time, completed items stay as they are
    if (!a.done) {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    // For completed items, don't change their order
    return 0;
  });
};

export function TodoListContainer({
  tagId,
  initialTodos,
}: TodoListContainerProps) {
  const [todoItems, setTodoItems] = useState<Item[]>(
    sortTodos(initialTodos || [])
  );
  const { toast } = useToast();

  // Get mutations from the API
  const [updateItemMutation] = itemsApi.useUpdateItemMutation();
  const [createItemMutation] = itemsApi.useCreateItemMutation();
  const [deleteItemMutation] = itemsApi.useDeleteItemMutation();

  // Update when initialTodos change
  useEffect(() => {
    setTodoItems(sortTodos(initialTodos || []));
  }, [initialTodos]);

  const handleTodoUpdate = async (id: number, done: boolean) => {
    try {
      const updated = await updateItemMutation({ id, done }).unwrap();

      // Update local state and sort the list
      setTodoItems((prevItems) => {
        const updatedItems = prevItems.map((item) =>
          item.id === id
            ? { ...item, done, updated_at: updated.updated_at }
            : item
        );
        return sortTodos(updatedItems);
      });

      toast({
        title: done ? "Task completed" : "Task marked as incomplete",
        duration: 2000,
      });
      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Failed to update task",
        variant: "destructive",
        duration: 4000,
      });
      return Promise.reject(error);
    }
  };

  const handleTodoCreate = async (item: string, tagId: number) => {
    try {
      const newItem = await createItemMutation({ item, tag: tagId }).unwrap();

      // Add the new todo and sort the list
      setTodoItems((prevItems) => sortTodos([...prevItems, newItem]));

      toast({
        title: "Task added",
        duration: 2000,
      });
      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Failed to create task",
        variant: "destructive",
        duration: 4000,
      });
      return Promise.reject(error);
    }
  };

  const handleTodoDelete = async (id: number) => {
    try {
      await deleteItemMutation(id).unwrap();

      // Remove the deleted todo from the list
      setTodoItems((prevItems) => prevItems.filter((item) => item.id !== id));

      toast({
        title: "Task deleted",
        duration: 2000,
      });
      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Failed to delete task",
        variant: "destructive",
        duration: 4000,
      });
      return Promise.reject(error);
    }
  };

  return (
    <TodoList
      todos={todoItems}
      tagId={tagId}
      onTodoUpdate={handleTodoUpdate}
      onTodoCreate={handleTodoCreate}
      onTodoDelete={handleTodoDelete}
    />
  );
}
