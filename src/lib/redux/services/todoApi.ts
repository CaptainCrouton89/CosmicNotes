import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface TodoItem {
  id: number;
  item: string;
  done: boolean;
  created_at: string;
  updated_at: string;
  tag: number;
}

export const todoApi = createApi({
  reducerPath: "todoApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Todo", "Cluster"],
  endpoints: (builder) => ({
    updateTodo: builder.mutation<TodoItem, { id: number; done: boolean }>({
      query: ({ id, done }) => ({
        url: "todo",
        method: "PUT",
        body: { id, done },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Todo", id },
        { type: "Cluster", id: "LIST" },
      ],
    }),

    createTodo: builder.mutation<TodoItem, { item: string; tag: number }>({
      query: (body) => ({
        url: "todo",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Todo", id: "LIST" },
        { type: "Cluster", id: "LIST" },
      ],
    }),

    deleteTodo: builder.mutation<void, number>({
      query: (id) => ({
        url: `todo/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Todo", id },
        { type: "Cluster", id: "LIST" },
      ],
    }),
  }),
});
