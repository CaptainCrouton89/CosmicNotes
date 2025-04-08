"use client";

import { TagMergeDialog } from "@/components/tag-merge-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface MergeSuggestion {
  primaryTag: string;
  similarTags: string[];
  confidence: number;
  reason: string;
}

export function useTagMergeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Function to get tag merge suggestions
  const getMergeSuggestions = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/tags/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get tag merge suggestions");
      }

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        // Sort suggestions by confidence in descending order
        const sortedSuggestions = [...data.suggestions].sort(
          (a, b) => b.confidence - a.confidence
        );
        setMergeSuggestions(sortedSuggestions);
        setIsOpen(true);
      } else {
        toast.info("No tag merge suggestions found.");
      }
    } catch (error) {
      console.error("Error getting tag merge suggestions:", error);
      toast.error("Failed to get tag merge suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to apply selected merges
  const applyMerges = async (selectedMerges: MergeSuggestion[]) => {
    try {
      const response = await fetch("/api/tags/apply-merges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merges: selectedMerges.map(({ primaryTag, similarTags }) => ({
            primaryTag,
            similarTags,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply tag merges");
      }

      const data = await response.json();

      // Calculate total tags merged
      const totalMerged = selectedMerges.reduce(
        (total, merge) => total + merge.similarTags.length,
        0
      );

      // Count high confidence merges
      const highConfidenceMerges = selectedMerges.filter(
        (merge) => merge.confidence > 0.85
      ).length;

      // Create a descriptive success message
      let successMsg = `Successfully merged ${totalMerged} tags into ${selectedMerges.length} primary tags.`;

      if (highConfidenceMerges > 0) {
        successMsg += ` (${highConfidenceMerges} high confidence merges)`;
      }

      toast.success(successMsg);

      // Return the results for any further processing
      return data.results;
    } catch (error) {
      console.error("Error applying tag merges:", error);
      toast.error("Failed to apply tag merges");
      throw error;
    }
  };

  // Dialog component
  const TagMergeDialogComponent = (
    <TagMergeDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      suggestions={mergeSuggestions}
      onApply={applyMerges}
    />
  );

  return {
    isLoading,
    isDialogOpen: isOpen,
    setDialogOpen: setIsOpen,
    getMergeSuggestions,
    TagMergeDialogComponent,
  };
}
