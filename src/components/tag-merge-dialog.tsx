"use client";

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
import { CheckIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface MergeSuggestion {
  primaryTag: string;
  similarTags: string[];
  confidence: number;
  reason: string;
}

interface TagMergeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: MergeSuggestion[];
  onApply: (selectedMerges: MergeSuggestion[]) => Promise<void>;
}

export function TagMergeDialog({
  isOpen,
  onOpenChange,
  suggestions,
  onApply,
}: TagMergeDialogProps) {
  const [selectedMerges, setSelectedMerges] = useState<{
    [key: string]: boolean;
  }>({});
  const [isApplying, setIsApplying] = useState(false);

  // Initialize suggestions with high confidence as selected by default
  useEffect(() => {
    if (suggestions.length > 0) {
      const initialState = suggestions.reduce((acc, suggestion, index) => {
        acc[index] = suggestion.confidence > 0.85;
        return acc;
      }, {} as { [key: string]: boolean });
      setSelectedMerges(initialState);
    }
  }, [suggestions]);

  const handleToggleMerge = (index: number) => {
    setSelectedMerges((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleApplySelected = async () => {
    setIsApplying(true);

    try {
      const selectedSuggestions = suggestions.filter(
        (_, index) => selectedMerges[index]
      );

      await onApply(selectedSuggestions);
      onOpenChange(false);
    } catch (error) {
      console.error("Error applying tag merges:", error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refine Tags</DialogTitle>
          <DialogDescription>
            Review and select tag merges to clean up your tag collection. High
            confidence ({">"}85%) suggestions are pre-selected.{" "}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh]">
          {suggestions.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No tag merge suggestions found.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {Object.values(selectedMerges).filter(Boolean).length} of{" "}
                  {suggestions.length} selected
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allSelected = suggestions.reduce(
                        (acc, _, index) => {
                          acc[index] = true;
                          return acc;
                        },
                        {} as { [key: string]: boolean }
                      );
                      setSelectedMerges(allSelected);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const highConfidenceOnly = suggestions.reduce(
                        (acc, suggestion, index) => {
                          acc[index] = suggestion.confidence > 0.85;
                          return acc;
                        },
                        {} as { [key: string]: boolean }
                      );
                      setSelectedMerges(highConfidenceOnly);
                    }}
                  >
                    High Confidence Only
                  </Button>
                </div>
              </div>

              {/* Confidence indicator */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <div>Sorted by confidence (highest first)</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-primary/50 rounded-sm"></div>
                  <span>High confidence</span>
                </div>
              </div>

              <div className="space-y-4 py-2">
                {suggestions.map((suggestion, index) => {
                  // Calculate confidence level for visual indicator (0-4)
                  const confidenceLevel = Math.min(
                    Math.floor(suggestion.confidence * 5),
                    4
                  );

                  return (
                    <div
                      key={index}
                      className={`flex space-x-2 border rounded-lg p-3 relative ${
                        suggestion.confidence > 0.85
                          ? "border-primary/50 bg-primary/5"
                          : confidenceLevel > 2
                          ? "border-primary/30 bg-primary/[0.03]"
                          : ""
                      }`}
                    >
                      {/* Confidence indicator bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${suggestion.confidence.toFixed(
                            2
                          )})`,
                        }}
                      ></div>

                      <Checkbox
                        id={`merge-${index}`}
                        checked={selectedMerges[index] || false}
                        onCheckedChange={() => handleToggleMerge(index)}
                        className="mt-1"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="font-medium flex items-center justify-between">
                          <div>
                            Merge into:{" "}
                            <span className="text-primary">
                              {suggestion.primaryTag}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Confidence:</span>{" "}
                            <span
                              className={
                                suggestion.confidence > 0.85
                                  ? "text-primary font-medium"
                                  : confidenceLevel > 2
                                  ? "text-primary/70"
                                  : ""
                              }
                            >
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-muted-foreground mb-1">
                            Similar tags:{" "}
                            <span className="font-medium">
                              ({suggestion.similarTags.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.similarTags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Reason:</span>{" "}
                          {suggestion.reason}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            <XIcon className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplySelected}
            disabled={
              isApplying ||
              suggestions.length === 0 ||
              Object.values(selectedMerges).every((selected) => !selected)
            }
          >
            {isApplying ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Applying...
              </span>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                Apply Selected
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
