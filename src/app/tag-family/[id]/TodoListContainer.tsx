"use client";

import { useToast } from "@/components/ui/use-toast";
import { todoApi } from "@/lib/redux/services/todoApi";
import { useEffect, useState } from "react";
import { TodoList } from "./TodoList";

interface TodoItem {
  id: number;
  item: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

interface TodoListContainerProps {
  tagFamilyId: number;
  initialTodos: TodoItem[];
}

export function TodoListContainer({
  tagFamilyId,
  initialTodos,
}: TodoListContainerProps) {
  const [todoItems, setTodoItems] = useState<TodoItem[]>(initialTodos || []);
  const { toast } = useToast();

  // Get mutations from the API
  const [updateTodoMutation] = todoApi.useUpdateTodoMutation();
  const [createTodoMutation] = todoApi.useCreateTodoMutation();

  // Update when initialTodos change
  useEffect(() => {
    setTodoItems(initialTodos || []);
  }, [initialTodos]);

  const handleTodoUpdate = async (id: number, done: boolean) => {
    try {
      await updateTodoMutation({ id, done }).unwrap();
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
      const newTodo = await createTodoMutation({ item, tag: tagId }).unwrap();
      setTodoItems((prev) => [...prev, newTodo]);
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

  return (
    <TodoList
      todos={todoItems}
      tagFamilyId={tagFamilyId}
      onTodoUpdate={handleTodoUpdate}
      onTodoCreate={handleTodoCreate}
    />
  );
}
