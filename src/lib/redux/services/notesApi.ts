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
      query: ({ page = 1, limit = 10 }) => `note?page=${page}&limit=${limit}`,
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
