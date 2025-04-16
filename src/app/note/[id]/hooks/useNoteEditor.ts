import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { useCallback, useEffect, useRef, useState } from "react";

export function useNoteEditor(noteId: number) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const editorRef = useRef<MDXEditorMethods>(null);

  // RTK Query hooks
  const {
    data: note,
    isLoading: loading,
    refetch,
  } = notesApi.useGetNoteQuery(Number(noteId), {
    skip: !noteId,
  });

  // Set content when note data is loaded
  useEffect(() => {
    if (note?.content && !hasChanges) {
      setContent(note.content);
    }
  }, [note, hasChanges]);

  const [updateNote] = notesApi.useUpdateNoteMutation();
  const [refreshNoteMutation] = tagsApi.useRefreshNoteMutation();

  // Handle content changes in the editor
  const handleEditorChange = useCallback((markdown: string) => {
    setContent(markdown);
    setHasChanges(true);
  }, []);

  // Update the note title
  const updateNoteTitle = useCallback(
    async (title: string) => {
      if (!note) return;

      try {
        setSaving(true);

        await updateNote({
          id: Number(noteId),
          note: { title },
        }).unwrap();

        // Refetch the note data
        await refetch();

        setLastSaved(new Date());
      } catch (err) {
        console.error("Error updating note title:", err);
        setError("Failed to save note title");
      } finally {
        setSaving(false);
      }
    },
    [note, noteId, updateNote, refetch]
  );

  // Save the note content
  const saveNote = useCallback(async () => {
    if (!note || saving) return;

    try {
      setSaving(true);
      // Get the latest content from the editor
      const currentContent = editorRef.current?.getMarkdown() || content;

      await updateNote({
        id: Number(noteId),
        note: { content: currentContent },
      }).unwrap();

      // Refetch the note data
      await refetch();

      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [note, noteId, saving, content, updateNote, refetch]);

  // Refresh note and tags
  const refreshNote = useCallback(async () => {
    if (!noteId) return;

    try {
      setRefreshing(true);
      await refreshNoteMutation(Number(noteId)).unwrap();
      await refetch();
    } catch (err) {
      console.error("Error refreshing note:", err);
      setError("Failed to refresh note");
    } finally {
      setRefreshing(false);
    }
  }, [noteId, refreshNoteMutation, refetch]);

  // Focus the editor
  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return {
    note,
    loading,
    content,
    saving,
    lastSaved,
    hasChanges,
    error,
    refreshing,
    editorRef,
    setContent,
    handleEditorChange,
    saveNote,
    refreshNote,
    focusEditor,
    setError,
    updateNoteTitle,
  };
}
