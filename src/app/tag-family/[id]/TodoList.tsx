"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

interface TodoItem {
  id: number;
  item: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

interface TodoListProps {
  todos: TodoItem[];
  tagFamilyId: number;
  onTodoUpdate?: (id: number, done: boolean) => Promise<void>;
  onTodoCreate?: (item: string, tagFamilyId: number) => Promise<void>;
}

export const TodoList = ({
  todos,
  tagFamilyId,
  onTodoUpdate,
  onTodoCreate,
}: TodoListProps) => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>(todos);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [newTodoText, setNewTodoText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    if (!onTodoUpdate) return;

    setLoading((prev) => ({ ...prev, [id]: true }));

    try {
      await onTodoUpdate(id, !currentStatus);
      setTodoItems(
        todoItems.map((todo) =>
          todo.id === id ? { ...todo, done: !currentStatus } : todo
        )
      );
    } catch (error) {
      console.error("Failed to update todo:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim() || !onTodoCreate) return;

    setIsCreating(true);
    try {
      await onTodoCreate(newTodoText, tagFamilyId);
      setNewTodoText("");
      // The new item will be included in the next data refresh
    } catch (error) {
      console.error("Failed to create todo:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Todo Items</h3>

      {/* Add new todo form */}
      <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
        <Input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new to-do item..."
          disabled={isCreating}
          className="flex-grow"
        />
        <Button type="submit" disabled={isCreating || !newTodoText.trim()}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>

      {/* Todo list */}
      <div className="space-y-2">
        {todoItems.length === 0 ? (
          <div className="text-muted-foreground py-4">No todo items yet.</div>
        ) : (
          todoItems.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-3 rounded-md border ${
                todo.done ? "bg-gray-50" : "bg-white"
              }`}
            >
              <Checkbox
                checked={todo.done}
                disabled={loading[todo.id]}
                onCheckedChange={() => handleToggle(todo.id, todo.done)}
                className="h-5 w-5"
              />
              <span
                className={`flex-grow ${
                  todo.done ? "line-through text-gray-500" : ""
                }`}
              >
                {todo.item}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
