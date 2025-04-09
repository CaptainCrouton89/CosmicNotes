import { notesApi } from "@/lib/redux/services/notesApi";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function useNoteActions(noteId: number) {
  const [deleting, setDeleting] = useState(false);
  const [deleteNoteMutation] = notesApi.useDeleteNoteMutation();
  const router = useRouter();

  const deleteNote = useCallback(async () => {
    try {
      setDeleting(true);
      await deleteNoteMutation(Number(noteId)).unwrap();
      router.push("/");
    } catch (err) {
      console.error("Error deleting note:", err);
      setDeleting(false);
    }
  }, [noteId, router, deleteNoteMutation]);

  return {
    deleting,
    deleteNote,
  };
}
