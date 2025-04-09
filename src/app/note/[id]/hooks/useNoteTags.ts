import { tagsApi } from "@/lib/redux/services/tagsApi";
import { useCallback, useState } from "react";

interface TagSuggestion {
  tag: string;
  confidence: number;
  selected: boolean;
}

export function useNoteTags(noteId: number) {
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [tagDeleting, setTagDeleting] = useState<string | null>(null);

  // Use RTK Query hooks
  const { data: tags = [] } = tagsApi.useGetTagsByNoteQuery(noteId, {
    skip: !noteId,
  });
  const [deleteTag] = tagsApi.useDeleteTagMutation();
  const [saveTags] = tagsApi.useSaveTagsMutation();

  // Toggle a tag selection in the suggestions dialog
  const toggleTagSelection = useCallback((index: number) => {
    setSuggestedTags((prev) =>
      prev.map((tag, i) =>
        i === index ? { ...tag, selected: !tag.selected } : tag
      )
    );
  }, []);

  // Add a custom tag to the suggestions
  const addCustomTag = useCallback(
    (tagName: string) => {
      // Check if tag already exists
      const normalizedTag = tagName.trim();
      if (!normalizedTag) return;

      // Check if tag already exists in suggestions
      const tagExists = suggestedTags.some(
        (tag) => tag.tag.toLowerCase() === normalizedTag.toLowerCase()
      );

      if (!tagExists) {
        setSuggestedTags((prev) => [
          ...prev,
          {
            tag: normalizedTag,
            confidence: 1.0, // Custom tags have 100% confidence
            selected: true, // Auto-select custom tags
          },
        ]);
      } else {
        // If tag exists, ensure it's selected
        setSuggestedTags((prev) =>
          prev.map((tag) =>
            tag.tag.toLowerCase() === normalizedTag.toLowerCase()
              ? { ...tag, selected: true }
              : tag
          )
        );
      }
    },
    [suggestedTags]
  );

  // Save selected tags
  const saveSelectedTags = useCallback(async () => {
    if (!noteId) return;

    try {
      // Filter selected tags and ensure no X20 tags are saved
      const tagsToSave = suggestedTags
        .filter(
          (tag) => tag.selected && tag.tag !== "X20" && !tag.tag.includes("X20")
        )
        .map((tag) => ({
          tag: tag.tag,
          confidence: tag.confidence,
        }));

      await saveTags({ noteId, tags: tagsToSave }).unwrap();
      setShowTagDialog(false);
    } catch (err) {
      console.error("Error saving tags:", err);
    }
  }, [noteId, suggestedTags, saveTags]);

  // Handle tag deletion
  const handleTagDelete = useCallback(
    async (tag: string) => {
      if (!noteId) return;

      try {
        setTagDeleting(tag);
        await deleteTag({ noteId, tag }).unwrap();
      } catch (err) {
        console.error("Error deleting tag:", err);
      } finally {
        setTagDeleting(null);
      }
    },
    [noteId, deleteTag]
  );

  // Open tag dialog with suggested tags
  const openTagDialog = useCallback(
    (suggestions: { tag: string; confidence: number }[]) => {
      // Filter out X20 tags and prepare suggestions
      const filteredSuggestions = suggestions
        .filter((tag) => tag.tag !== "X20" && !tag.tag.includes("X20"))
        .map((tag) => ({
          ...tag,
          selected: tag.confidence > 0.7, // Pre-select high confidence tags
        }));

      setSuggestedTags(filteredSuggestions);
      setShowTagDialog(true);
    },
    []
  );

  return {
    tags,
    suggestedTags,
    showTagDialog,
    tagDeleting,
    setShowTagDialog,
    toggleTagSelection,
    saveSelectedTags,
    handleTagDelete,
    openTagDialog,
    addCustomTag,
  };
}
