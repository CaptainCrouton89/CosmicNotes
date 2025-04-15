"use client";

import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { useState } from "react";

interface NoteActionsProps {
  onSave: () => void;
  onDelete: () => void;
  hasChanges: boolean;
  isSaving: boolean;
  disabled: boolean;
}

export function NoteActions({
  onSave,
  onDelete,
  hasChanges,
  isSaving,
  disabled,
}: NoteActionsProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSave}
        disabled={isSaving || !hasChanges || disabled}
        className="flex items-center gap-1"
      >
        <Save className="h-4 w-4" />
      </Button>
      <Button
        variant={deleteConfirmOpen ? "destructive" : "ghost"}
        size="sm"
        className="transition-all duration-400 ease-in-out"
        disabled={disabled}
        onClick={() => {
          if (!deleteConfirmOpen) setDeleteConfirmOpen(true);
          else onDelete();
        }}
        onMouseLeave={() => {
          if (deleteConfirmOpen) setDeleteConfirmOpen(false);
        }}
      >
        {deleteConfirmOpen ? (
          "Confirm Delete"
        ) : (
          <div className="hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </div>
        )}
      </Button>
    </div>
  );
}
