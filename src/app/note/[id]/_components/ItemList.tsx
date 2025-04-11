"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Item } from "@/types/types";
import { PlusIcon, TrashIcon } from "lucide-react";
import { FormEvent, useState } from "react";

interface ItemListProps {
  items: Item[];
  loading: Record<number, boolean>;
  deleting: Record<number, boolean>;
  creating: boolean;
  onToggleStatus: (id: number, done: boolean) => Promise<void>;
  onCreateItem: (item: string) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
}

export function ItemList({
  items,
  loading,
  deleting,
  creating,
  onToggleStatus,
  onCreateItem,
  onDeleteItem,
}: ItemListProps) {
  const [newItemText, setNewItemText] = useState("");

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    onCreateItem(newItemText);
    setNewItemText("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Items</h3>

      {/* Add new item form */}
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add a new item..."
          disabled={creating}
          className="flex-grow"
        />
        <Button type="submit" disabled={creating || !newItemText.trim()}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>

      {/* Item list */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-muted-foreground py-4">No items yet.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-3 rounded-md border ${
                item.done ? "bg-gray-50" : "bg-white"
              }`}
            >
              <Checkbox
                checked={item.done}
                disabled={loading[item.id]}
                onCheckedChange={() => onToggleStatus(item.id, item.done)}
                className="h-5 w-5"
              />
              <span
                onClick={() =>
                  !loading[item.id] && onToggleStatus(item.id, item.done)
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
                onClick={() => onDeleteItem(item.id)}
                disabled={deleting[item.id]}
                className="h-8 w-8 text-gray-500 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
