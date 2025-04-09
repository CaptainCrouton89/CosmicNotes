import { Database } from "@/types/database.types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CosmicTag = {
  tag: string;
  confidence: number;
  created_at: string;
};

type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"] & {
  cosmic_tags: CosmicTag[];
};

// Create a more lightweight type for the notes list view
type NoteListItem = Omit<Note, "content">;

type NoteInput = Database["public"]["Tables"]["cosmic_memory"]["Insert"];

interface PaginatedResponse {
  notes: NoteListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Note"],
  endpoints: (builder) => ({
    getNotes: builder.query<
      PaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => `note?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.notes.map(({ id }) => ({ type: "Note" as const, id })),
              { type: "Note", id: "LIST" },
            ]
          : [{ type: "Note", id: "LIST" }],
    }),

    getNote: builder.query<Note, number>({
      query: (id) => `note/${id}`,
      transformResponse: (response: { note: Note }) => response.note,
      providesTags: (_, __, id) => [{ type: "Note", id }],
    }),

    searchNotes: builder.query<
      { notes: Note[] },
      { query: string; matchCount?: number; matchThreshold?: number }
    >({
      query: ({ query, matchCount = 10, matchThreshold = 0.5 }) =>
        `note/search?query=${encodeURIComponent(
          query
        )}&matchCount=${matchCount}&matchThreshold=${matchThreshold}`,
      providesTags: (result) =>
        result
          ? [
              ...result.notes.map(({ id }) => ({ type: "Note" as const, id })),
              { type: "Note", id: "LIST" },
            ]
          : [{ type: "Note", id: "LIST" }],
    }),

    createNote: builder.mutation<Note, NoteInput>({
      query: (note) => ({
        url: "note",
        method: "POST",
        body: note,
      }),
      transformResponse: (response: { success: boolean; note: Note }) =>
        response.note,
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),

    updateNote: builder.mutation<
      Note,
      { id: number; note: Partial<NoteInput> }
    >({
      query: ({ id, note }) => ({
        url: `note/${id}`,
        method: "PUT",
        body: note,
      }),
      transformResponse: (response: { note: Note }) => response.note,
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
