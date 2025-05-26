import { notesApi } from "@/lib/redux/services/notesApi";
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
  const [tagDeleting, setTagDeleting] = useState<number | null>(null);

  // Use RTK Query hooks
  const { data: note } = notesApi.useGetNoteQuery(noteId);
  const [deleteTag] = tagsApi.useDeleteTagMutation();
  const [updateNote] = notesApi.useUpdateNoteMutation();

  const addTag = useCallback(
    (tag: string) => {
      if (!note) throw new Error("Note is undefined");
      if (!tag) throw new Error("Tag is undefined");
      updateNote({
        id: noteId,
        note: { tags: [...note!.tags.map((t) => t.name), tag] },
      }).unwrap();
    },
    [noteId, updateNote, note]
  );

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

      await updateNote({
        id: noteId,
        note: { tags: tagsToSave.map((tag) => tag.tag) },
      }).unwrap();
      setShowTagDialog(false);
    } catch (err) {
      console.error("Error saving tags:", err);
    }
  }, [noteId, suggestedTags, updateNote]);

  // Handle tag deletion
  const handleTagDelete = useCallback(
    async (tagId: number) => {
      if (!noteId) return;

      try {
        setTagDeleting(tagId);
        await deleteTag({ noteId, tagId }).unwrap();
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
    async (
      suggestions?: { tag: string; confidence: number; selected: boolean }[]
    ) => {
      setSuggestedTags(suggestions!);
      setShowTagDialog(true);
    },
    []
  );

  return {
    tags: note?.tags ?? [],
    suggestedTags,
    showTagDialog,
    tagDeleting,
    setShowTagDialog,
    toggleTagSelection,
    saveSelectedTags,
    handleTagDelete,
    openTagDialog,
    addCustomTag,
    addTag,
  };
}
