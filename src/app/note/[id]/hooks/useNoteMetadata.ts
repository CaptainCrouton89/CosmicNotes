import { notesApi } from "@/lib/redux/services/notesApi";
import { useCallback, useState } from "react";
import { Zone } from "../../_types";

export function useNoteMetadata(noteId: number, noteContent: string = "") {
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [updateNote] = notesApi.useUpdateNoteMutation();
  const { refetch } = notesApi.useGetNoteQuery(noteId, { skip: !noteId });

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${month} ${day}, ${year} at ${hours}:${minutes}`;
  }, []);

  // Update category
  const updateCategory = useCallback(
    async (category: string) => {
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
    formatDate,
    updateCategory,
    updateZone,
  };
}
