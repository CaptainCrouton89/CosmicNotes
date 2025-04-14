import { CompleteItem, Item } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the tag types for proper typing
type TagTypes = "Item" | "Cluster";

export const itemsApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Item", "Cluster"] as const,
  endpoints: (builder) => ({
    updateItem: builder.mutation<CompleteItem, { id: number; done: boolean }>({
      query: ({ id, done }) => ({
        url: "item",
        method: "PUT",
        body: { id, done },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Item", id },
        { type: "Cluster", id: "LIST" },
      ],
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
      invalidatesTags: (result, error, arg) => {
        const tags: { type: TagTypes; id: string | number }[] = [
          { type: "Item", id: "LIST" },
        ];

        // If clusterId provided, invalidate that specific cluster
        if (arg.clusterId) {
          tags.push({ type: "Cluster", id: arg.clusterId });
        }

        // Also invalidate the general cluster list to ensure any filtered lists are updated
        tags.push({ type: "Cluster", id: "LIST" });

        return tags;
      },
    }),

    deleteItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: () => [
        { type: "Item", id: "LIST" },
        // Invalidate all clusters as we don't know which cluster the item belonged to
        { type: "Cluster", id: "LIST" },
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
