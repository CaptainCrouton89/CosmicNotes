import { Database } from "@/types/database.types";
import { Category, CompleteTag, Tag } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { notesApi } from "./notesApi";

type TagInput = Database["public"]["Tables"]["cosmic_tags"]["Insert"];

export const tagsApi = createApi({
  reducerPath: "tagsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Tag"],
  endpoints: (builder) => ({
    getTag: builder.query<CompleteTag, number>({
      query: (tagId) => `tag/${tagId}`,
      providesTags: (result, error, tagId) => [{ type: "Tag", id: tagId }],
    }),
    getAllTags: builder.query<(Tag & { note_count: number })[], void>({
      query: () => "tag",
      providesTags: [{ type: "Tag", id: "LIST" }],
    }),

    refineTags: builder.mutation<{ results: Tag[] }, void>({
      query: () => ({
        url: "tag/refine",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),

    createTag: builder.mutation<CompleteTag, TagInput>({
      query: (tag) => ({
        url: "tags",
        method: "POST",
        body: tag,
      }),
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),

    deleteTag: builder.mutation<void, { noteId: number; tagId: number }>({
      query: ({ noteId, tagId }) => ({
        url: `note/${noteId}/tag/${tagId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { tagId }) => [
        { type: "Tag", id: tagId },
        { type: "Tag", id: "LIST" },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate tags from noteApi
          dispatch(
            notesApi.util.invalidateTags([{ type: "Note", id: arg.noteId }])
          );
        } catch {}
      },
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

    generateClusters: builder.mutation<void, number>({
      query: (tagId) => ({
        url: `tag/${tagId}/cluster`,
        method: "POST",
      }),
      invalidatesTags: (result, error, tagId) => [
        { type: "Tag", id: tagId },
        { type: "Tag", id: "LIST" },
      ],
    }),

    generateClusterForCategory: builder.mutation<
      void,
      { tagId: number; category: Category }
    >({
      query: ({ tagId, category }) => ({
        url: `tag/${tagId}/cluster/${category}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { tagId }) => [
        { type: "Tag", id: tagId },
        { type: "Tag", id: "LIST" },
      ],
    }),
  }),
});
