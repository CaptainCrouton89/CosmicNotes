import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Save, Trash2 } from "lucide-react";
import { useState } from "react";

interface NoteActionsProps {
  onRefresh: () => void;
  onSave: () => void;
  onDelete: () => void;
  hasChanges: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  disabled: boolean;
}

export function NoteActions({
  onRefresh,
  onSave,
  onDelete,
  hasChanges,
  isRefreshing,
  isSaving,
  disabled,
}: NoteActionsProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="flex items-center xl:gap-4 xl:self-auto self-start">
      <Button
        variant="ghost"
        onClick={onSave}
        disabled={isSaving || !hasChanges || disabled}
      >
        <Save className="h-4 w-4" />
        {isSaving && "Saving..."}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onRefresh}
            disabled={isRefreshing || disabled}
            className="cursor-pointer"
          >
            {isRefreshing ? "Regenerating..." : "Regenerate AI Classifications"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
        {deleteConfirmOpen ? "Confirm Delete" : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
