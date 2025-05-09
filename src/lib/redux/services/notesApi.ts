import { Database } from "@/types/database.types";
import { CompleteNote, Note, PaginatedResponse } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type NoteInput = Database["public"]["Tables"]["cosmic_memory"]["Insert"];

export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Note"],
  endpoints: (builder) => ({
    getNotes: builder.query<
      PaginatedResponse<Note>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => {
        return `note?page=${page}&limit=${limit}`;
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Create a stable cache key that ignores the 'page' argument
        // but respects other arguments like 'limit' or any future filter params.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { page, ...stableArgs } = queryArgs;
        // Sort keys for a consistent query key
        const sortedArgs = Object.entries(stableArgs)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}=${value}`)
          .join("&");
        return `${endpointName}(${sortedArgs})`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.page || arg.page === 1 || !currentCache?.content) {
          return newItems;
        }

        const existingIds = new Set(
          currentCache.content.map((note) => note.id)
        );
        const uniqueNewNotes = newItems.content.filter(
          (note) => !existingIds.has(note.id)
        );

        currentCache.content.push(...uniqueNewNotes);
        currentCache.pagination = newItems.pagination;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({
                type: "Note" as const,
                id,
              })),
              { type: "Note", id: "LIST" },
            ]
          : [{ type: "Note", id: "LIST" }],
    }),

    getNote: builder.query<CompleteNote, number>({
      query: (id) => `note/${id}`,
      transformResponse: (response: { note: CompleteNote }) => response.note,
      providesTags: (_, __, id) => [{ type: "Note", id }],
    }),

    searchNotes: builder.query<
      { notes: Note[] },
      {
        query: string;
        category?: string | null;
        matchCount?: number;
        matchThreshold?: number;
      }
    >({
      query: ({ query, category, matchCount = 10, matchThreshold = 0.5 }) => {
        let url = `note/search?query=${encodeURIComponent(
          query
        )}&matchCount=${matchCount}&matchThreshold=${matchThreshold}`;
        if (category) {
          url += `&category=${encodeURIComponent(category)}`;
        }
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.notes.map(({ id }) => ({ type: "Note" as const, id })),
              { type: "Note", id: "LIST" },
            ]
          : [{ type: "Note", id: "LIST" }],
      keepUnusedDataFor: 1800,
    }),

    createNote: builder.mutation<
      Note,
      Omit<NoteInput, "embedding"> & { tags?: string[]; tagIds?: number[] }
    >({
      query: (note) => ({
        url: "note",
        method: "POST",
        body: note,
      }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          // If the update includes tags, also invalidate the Tag cache
          if (result.data.tags) {
            // Import tagsApi dynamically to avoid circular dependency
            const tagsApiModule = await import("./tagsApi");
            dispatch(
              tagsApiModule.tagsApi.util.invalidateTags([
                { type: "Tag", id: "LIST" },
              ])
            );
          }
        } catch (e) {
          console.error("Failed to create note:", e);
        }
      },
    }),

    updateNote: builder.mutation<
      CompleteNote,
      {
        id: number;
        note: Partial<NoteInput> & { tags?: string[]; tagIds?: number[] };
      }
    >({
      query: ({ id, note }) => ({
        url: `note/${id}`,
        method: "PUT",
        body: note,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Note", id },
        { type: "Note", id: "LIST" },
      ],
      async onQueryStarted({ note }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // If the update includes tags, also invalidate the Tag cache
          if (note.tags || note.tagIds) {
            // Import tagsApi dynamically to avoid circular dependency
            const tagsApiModule = await import("./tagsApi");
            dispatch(
              tagsApiModule.tagsApi.util.invalidateTags([
                { type: "Tag", id: "LIST" },
              ])
            );
          }
        } catch (e) {
          console.error("Failed to update note:", e);
        }
      },
    }),

    deleteNote: builder.mutation<void, number>({
      query: (id) => ({
        url: `note/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "Note", id },
        { type: "Note", id: "LIST" },
      ],
    }),
  }),
});
