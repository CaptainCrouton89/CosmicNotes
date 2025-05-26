import { CategorySelector } from "@/app/(app)/note/[id]/_components/CategorySelector";
import { ZoneSelector } from "@/app/(app)/note/[id]/_components/ZoneSelector";
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
import { Category, TagSuggestion, Zone } from "@/types/types";
import { Loader2, Plus } from "lucide-react";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";

export interface TagSuggestionWithSelected extends TagSuggestion {
  selected: boolean;
}

interface TagSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedTags: TagSuggestionWithSelected[];
  onToggleTagSelection: (index: number) => void;
  onSave: (
    selectedTags: TagSuggestionWithSelected[],
    selectedZone: Zone | undefined,
    selectedCategory: Category | undefined
  ) => Promise<void>;
  isSaving: boolean;
  isLoading?: boolean;
  title?: string;
  description?: string;
  onAddCustomTag?: (tag: string) => void;
  initialZone?: Zone;
  initialCategory?: Category;
}

export function TagSelectionDialog({
  open,
  onOpenChange,
  suggestedTags,
  onToggleTagSelection,
  onSave,
  isSaving,
  isLoading = false,
  title = "Confirm Note Details",
  description = "Select tags, zone, and category for your note. Items with high confidence are pre-selected.",
  onAddCustomTag,
  initialZone,
  initialCategory,
}: TagSelectionDialogProps) {
  const [customTagInput, setCustomTagInput] = useState("");
  const [currentZone, setCurrentZone] = useState<Zone | undefined>(initialZone);
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(
    initialCategory
  );

  useEffect(() => {
    if (open) {
      setCurrentZone(initialZone);
      setCurrentCategory(initialCategory);
    }
  }, [open, initialZone, initialCategory]);

  const handleOpenChange = useCallback(
    (newOpenState: boolean) => {
      if (!newOpenState && open && !isSaving) {
        onSave(suggestedTags, currentZone, currentCategory);
      }
      onOpenChange(newOpenState);
    },
    [
      open,
      onOpenChange,
      isSaving,
      onSave,
      suggestedTags,
      currentZone,
      currentCategory,
    ]
  );

  const handleAddCustomTag = useCallback(() => {
    if (customTagInput.trim() && onAddCustomTag) {
      onAddCustomTag(customTagInput.trim());
      setCustomTagInput("");
    }
  }, [customTagInput, onAddCustomTag]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleAddCustomTag();
      }
    },
    [handleAddCustomTag]
  );

  const handleDialogKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSaving) {
        e.preventDefault();
        onSave(suggestedTags, currentZone, currentCategory);
      }
    },
    [isSaving, onSave, suggestedTags, currentZone, currentCategory]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

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
              {suggestedTags.length === 0 && !onAddCustomTag ? (
                <p className="text-center py-4 text-muted-foreground">
                  No tag suggestions found. Add a custom tag or skip.
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

        {/* Zone and Category Selectors - Side-by-side with styled labels and a vertical divider */}
        <div className="flex gap-4 pb-4 items-stretch">
          {" "}
          {/* Main flex container, added items-stretch */}
          <div className="flex-1">
            {" "}
            {/* Zone Column */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Zone
            </p>
            <ZoneSelector
              zone={currentZone}
              updating={isSaving}
              onUpdateZone={setCurrentZone}
              allowNull={true}
            />
          </div>
          {/* Vertical Divider */}
          <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch"></div>
          <div className="flex-1">
            {" "}
            {/* Category Column */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Category
            </p>
            <CategorySelector
              category={currentCategory}
              updating={isSaving}
              onUpdateCategory={setCurrentCategory}
              allowNull={true}
            />
          </div>
        </div>

        <DialogFooter className={`flex`}>
          <Button
            onClick={() => {
              if (!isSaving) {
                onSave(suggestedTags, currentZone, currentCategory);
              }
            }}
            disabled={isSaving || isLoading}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
