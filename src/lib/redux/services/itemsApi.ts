import { Item } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const itemsApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Item", "Cluster"],
  endpoints: (builder) => ({
    updateItem: builder.mutation<Item, { id: number; done: boolean }>({
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

    createItem: builder.mutation<Item, { item: string; tag: number }>({
      query: (body) => ({
        url: "item",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Item", id: "LIST" },
        { type: "Cluster", id: "LIST" },
      ],
    }),

    deleteItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Item", id },
        { type: "Cluster", id: "LIST" },
      ],
    }),
  }),
});
