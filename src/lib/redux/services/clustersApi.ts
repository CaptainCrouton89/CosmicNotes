import { Database } from "@/types/database.types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Cluster = Database["public"]["Tables"]["cosmic_cluster"]["Row"];

interface PaginatedResponse {
  clusters: Cluster[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const clustersApi = createApi({
  reducerPath: "clustersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Cluster"],
  endpoints: (builder) => ({
    getClusters: builder.query<
      PaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `cluster?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.clusters.map(({ id }) => ({
                type: "Cluster" as const,
                id,
              })),
              { type: "Cluster", id: "LIST" },
            ]
          : [{ type: "Cluster", id: "LIST" }],
    }),

    getCluster: builder.query<Cluster, number>({
      query: (id) => `cluster/${id}`,
      providesTags: (result, error, id) => [{ type: "Cluster", id }],
    }),

    getClusterNotes: builder.query<
      { notes: Database["public"]["Tables"]["cosmic_memory"]["Row"][] },
      { clusterId: number; page?: number; limit?: number }
    >({
      query: ({ clusterId, page = 1, limit = 20 }) =>
        `note/cluster?clusterId=${clusterId}&page=${page}&limit=${limit}`,
    }),

    gatherClusters: builder.mutation<
      { message: string; clustersCreated: Cluster[] },
      void
    >({
      query: () => ({
        url: "cluster/gather",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Cluster", id: "LIST" }],
    }),
  }),
});
