import { Cluster, CompleteCluster, PaginatedResponse } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const clustersApi = createApi({
  reducerPath: "clustersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Cluster", "Tag"],
  endpoints: (builder) => ({
    getClusters: builder.query<
      PaginatedResponse<Cluster>,
      {
        tagId?: number;
        category?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ tagId, category, page = 1, limit = 10 }) => {
        let url = `cluster?page=${page}&limit=${limit}`;

        if (tagId !== undefined) {
          url += `&tagId=${tagId}`;
        }

        if (category) {
          url += `&category=${encodeURIComponent(category)}`;
        }

        return url;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({
                type: "Cluster" as const,
                id,
              })),
              { type: "Cluster", id: "FILTERED_LIST" },
            ]
          : [{ type: "Cluster", id: "FILTERED_LIST" }],
    }),

    getCluster: builder.query<CompleteCluster, number>({
      query: (id) => `cluster/${id}`,
      providesTags: (result, error, id) => [{ type: "Cluster", id }],
    }),
  }),
});
