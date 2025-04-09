import { Database } from "@/types/database.types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface TodoItem {
  id: number;
  item: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

interface ClusterSummary {
  id: number;
  category: string;
  tag_count: number;
}

type TagFamily = Database["public"]["Tables"]["cosmic_tag_family"]["Row"] & {
  todo_items?: TodoItem[];
  clusters?: ClusterSummary[];
};

interface PaginatedResponse {
  tagFamilies: TagFamily[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const tagFamilyApi = createApi({
  reducerPath: "tagFamilyApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["TagFamily"],
  endpoints: (builder) => ({
    getTagFamilies: builder.query<
      PaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `tag-family?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.tagFamilies.map(({ id }) => ({
                type: "TagFamily" as const,
                id,
              })),
              { type: "TagFamily", id: "LIST" },
            ]
          : [{ type: "TagFamily", id: "LIST" }],
    }),

    getTagFamily: builder.query<TagFamily, number>({
      query: (id) => `tag-family/${id}`,
      providesTags: (result, error, id) => [{ type: "TagFamily", id }],
    }),
  }),
});
