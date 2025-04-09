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
import { RefreshCw, Save, Trash2 } from "lucide-react";
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
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing || disabled}
        className="h-9 px-3"
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
        />
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={isSaving || !hasChanges || disabled}
        className="h-9 px-3"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={disabled}
            className="h-9 px-3"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
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
