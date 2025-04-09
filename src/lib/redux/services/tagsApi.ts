import { Database } from "@/types/database.types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"];
type Tag = Database["public"]["Tables"]["cosmic_tags"]["Row"];
type TagInput = Database["public"]["Tables"]["cosmic_tags"]["Insert"];

interface TagCount {
  tag: string;
  count: number;
}

export const tagsApi = createApi({
  reducerPath: "tagsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Tag"],
  endpoints: (builder) => ({
    getAllTags: builder.query<Tag[], void>({
      query: () => "tags",
      providesTags: [{ type: "Tag", id: "LIST" }],
    }),

    getTagsWithCounts: builder.query<TagCount[], void>({
      query: () => "tags/counts",
      providesTags: [{ type: "Tag", id: "LIST" }],
    }),

    getNotesForTag: builder.query<Note[], string>({
      query: (tag) => `tags/${encodeURIComponent(tag)}/notes`,
      providesTags: (result, error, tag) => [{ type: "Tag", id: tag }],
    }),

    refineTags: builder.mutation<{ results: Tag[] }, void>({
      query: () => ({
        url: "tags/refine",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),

    createTag: builder.mutation<Tag, TagInput>({
      query: (tag) => ({
        url: "tags",
        method: "POST",
        body: tag,
      }),
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),

    deleteTag: builder.mutation<void, { noteId: number; tag: string }>({
      query: ({ noteId, tag }) => ({
        url: `tags/${noteId}/${encodeURIComponent(tag)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { tag }) => [
        { type: "Tag", id: tag },
        { type: "Tag", id: "LIST" },
      ],
    }),

    getTagsByNote: builder.query<Tag[], number>({
      query: (noteId) => `note/${noteId}/tags`,
      transformResponse: (response: { tags: Tag[] }) => response.tags,
      providesTags: (result, error, noteId) => [
        { type: "Tag", id: `note-${noteId}` },
        { type: "Tag", id: "LIST" },
      ],
    }),

    refreshNote: builder.mutation<void, number>({
      query: (noteId) => ({
        url: `note/${noteId}/refresh`,
        method: "POST",
        body: { id: noteId },
      }),
      invalidatesTags: (result, error, noteId) => [
        { type: "Tag", id: `note-${noteId}` },
        { type: "Tag", id: "LIST" },
      ],
    }),

    saveTags: builder.mutation<
      void,
      { noteId: number; tags: { tag: string; confidence: number }[] }
    >({
      query: ({ noteId, tags }) => ({
        url: `note/${noteId}/save-tags`,
        method: "POST",
        body: { tags },
      }),
      invalidatesTags: (result, error, { noteId }) => [
        { type: "Tag", id: `note-${noteId}` },
        { type: "Tag", id: "LIST" },
      ],
    }),
  }),
});
