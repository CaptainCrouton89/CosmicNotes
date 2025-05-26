import { notesApi } from "@/lib/redux/services/notesApi";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function useNoteActions(noteId: number) {
  const [deleting, setDeleting] = useState(false);
  const [deleteNoteMutation] = notesApi.useDeleteNoteMutation();
  const router = useRouter();

  const deleteNote = useCallback(async () => {
    if (deleting) return; // Prevent multiple deletion attempts

    try {
      setDeleting(true);
      await deleteNoteMutation(Number(noteId)).unwrap();
      // Immediately navigate away from the page after successful deletion
      router.push("/");
    } catch (err) {
      console.error("Error deleting note:", err);
      setDeleting(false);
    }
    // Note: We don't reset deleting to false on success because we're navigating away
  }, [noteId, router, deleteNoteMutation, deleting]);

  return {
    deleting,
    deleteNote,
  };
}
