import { notesApi } from "@/lib/redux/services/notesApi";
import { Category, Zone } from "@/types/types";
import { useCallback, useState } from "react";

export function useNoteMetadata(noteId: number, noteContent: string = "") {
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [updateNote] = notesApi.useUpdateNoteMutation();
  const { refetch } = notesApi.useGetNoteQuery(noteId, { skip: !noteId });

  // Update category
  const updateCategory = useCallback(
    async (category: Category) => {
      try {
        setUpdatingField("category");
        await updateNote({
          id: Number(noteId),
          note: {
            category,
            content: noteContent, // Include the existing content
          },
        }).unwrap();
        await refetch();
      } catch (err) {
        console.error("Error updating category:", err);
      } finally {
        setUpdatingField(null);
      }
    },
    [noteId, noteContent, updateNote, refetch]
  );

  // Update zone
  const updateZone = useCallback(
    async (zone: Zone) => {
      try {
        setUpdatingField("zone");
        await updateNote({
          id: Number(noteId),
          note: {
            zone,
            content: noteContent, // Include the existing content
          },
        }).unwrap();
        await refetch();
      } catch (err) {
        console.error("Error updating zone:", err);
      } finally {
        setUpdatingField(null);
      }
    },
    [noteId, noteContent, updateNote, refetch]
  );

  return {
    updatingField,
    updateCategory,
    updateZone,
  };
}
