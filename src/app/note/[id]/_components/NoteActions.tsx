import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  isDeleting: boolean;
  disabled: boolean;
}

export function NoteActions({
  onRefresh,
  onSave,
  onDelete,
  hasChanges,
  isRefreshing,
  isSaving,
  isDeleting,
  disabled,
}: NoteActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 xl:gap-4 xl:self-auto self-start">
      <Button
        variant="ghost"
        onClick={onSave}
        disabled={isSaving || !hasChanges || disabled}
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save"}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled}
            className="hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                setDeleteDialogOpen(false);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
