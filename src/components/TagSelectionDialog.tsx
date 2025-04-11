import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TagSuggestion } from "@/types/types";
import { Loader2, Plus } from "lucide-react";
import { KeyboardEvent, useCallback, useState } from "react";

export interface TagSuggestionWithSelected extends TagSuggestion {
  selected: boolean;
}

interface TagSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedTags: TagSuggestionWithSelected[];
  onToggleTagSelection: (index: number) => void;
  onSaveTags: () => Promise<void>;
  onSkipTags?: () => void;
  isSaving: boolean;
  isLoading?: boolean;
  title?: string;
  description?: string;
  onAddCustomTag?: (tag: string) => void;
}

export function TagSelectionDialog({
  open,
  onOpenChange,
  suggestedTags,
  onToggleTagSelection,
  onSaveTags,
  onSkipTags,
  isSaving,
  isLoading = false,
  title = "Select Tags",
  description = "Select tags for your note. Tags with high confidence are pre-selected.",
  onAddCustomTag,
}: TagSelectionDialogProps) {
  const [customTagInput, setCustomTagInput] = useState("");

  // Handle dialog close events
  const handleOpenChange = useCallback(
    (newOpenState: boolean) => {
      // If dialog is being closed and we have a skip handler
      if (!newOpenState && open && onSkipTags) {
        onSkipTags();
      }
      onOpenChange(newOpenState);
    },
    [open, onSkipTags, onOpenChange]
  );

  // Handle adding a custom tag
  const handleAddCustomTag = useCallback(() => {
    if (customTagInput.trim() && onAddCustomTag) {
      onAddCustomTag(customTagInput.trim());
      setCustomTagInput("");
    }
  }, [customTagInput, onAddCustomTag]);

  // Handle pressing Enter in the custom tag input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleAddCustomTag();
      }
    },
    [handleAddCustomTag]
  );

  // Handle Command+Enter to save tags
  const handleDialogKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSaving) {
        e.preventDefault();
        onSaveTags();
      }
    },
    [isSaving, onSaveTags]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Custom tag input field */}
        {onAddCustomTag && (
          <div className="flex items-center gap-2 pt-4">
            <Input
              placeholder="Add custom tag..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddCustomTag}
              disabled={!customTagInput.trim()}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        )}

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Getting tag suggestions...
              </span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {suggestedTags.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No tag suggestions found.
                </p>
              ) : (
                suggestedTags.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${index}`}
                      checked={tag.selected}
                      onCheckedChange={() => onToggleTagSelection(index)}
                    />
                    <div className="flex items-center justify-between w-full">
                      <label
                        htmlFor={`tag-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tag.name}
                      </label>
                      <Badge variant="outline" className="ml-auto">
                        {Math.round(tag.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <DialogFooter
          className={`flex ${
            onSkipTags ? "justify-between sm:justify-between" : ""
          }`}
        >
          {onSkipTags && (
            <Button variant="ghost" onClick={onSkipTags} disabled={isLoading}>
              Skip Tags
            </Button>
          )}
          <Button onClick={onSaveTags} disabled={isSaving || isLoading}>
            {isSaving ? "Saving Tags..." : "Save Tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
