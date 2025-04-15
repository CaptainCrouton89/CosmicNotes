import { CompleteItem, Item } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tagsApi } from "./tagsApi";

// Define the tag types for proper typing

export const itemsApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Item"] as const,
  endpoints: (builder) => ({
    updateItem: builder.mutation<CompleteItem, { id: number; done: boolean }>({
      query: ({ id, done }) => ({
        url: "item",
        method: "PUT",
        body: { id, done },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Item", id }],
    }),

    createItem: builder.mutation<
      Item,
      { item: string; noteId?: number; clusterId?: number }
    >({
      query: (body) => ({
        url: "item",
        method: "POST",
        body,
      }),
      onQueryStarted: async () => {
        await tagsApi.util.invalidateTags([{ type: "Tag", id: "LIST" }]);
      },
      invalidatesTags: () => [{ type: "Item", id: "LIST" }],
    }),

    deleteItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "Item", id },
        { type: "Item", id: "LIST" },
      ],
    }),
    getItemsByNoteId: builder.query<Item[], number>({
      query: (noteId) => `note/${noteId}/item`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Item" as const, id })),
              { type: "Item", id: "LIST" },
            ]
          : [{ type: "Item", id: "LIST" }],
    }),
  }),
});
