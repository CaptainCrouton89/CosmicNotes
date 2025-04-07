import { Database } from "@/types/database.types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInput = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectOverview = Database["public"]["Tables"]["project_overviews"]["Row"];
type Screen = Database["public"]["Tables"]["screens"]["Row"];
type DataModel = Database["public"]["Tables"]["data_models"]["Row"];
type ApiEndpoint = Database["public"]["Tables"]["api_endpoints"]["Row"];

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Project", "Overview", "Screen", "DataModel", "ApiEndpoint"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => "projects",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Project" as const, id })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),

    getProject: builder.query<Project, string>({
      query: (id) => `projects/${id}`,
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),

    getProjectOverview: builder.query<ProjectOverview, string>({
      query: (projectId) => `projects/${projectId}/overview`,
      providesTags: (result, error, projectId) => [
        { type: "Overview", id: projectId },
      ],
    }),

    getProjectScreens: builder.query<Screen[], string>({
      query: (projectId) => `projects/${projectId}/screens`,
      providesTags: (result, error, projectId) => [
        { type: "Screen", id: projectId },
      ],
    }),

    getProjectDataModels: builder.query<DataModel[], string>({
      query: (projectId) => `projects/${projectId}/data-models`,
      providesTags: (result, error, projectId) => [
        { type: "DataModel", id: projectId },
      ],
    }),

    getProjectApiEndpoints: builder.query<ApiEndpoint[], string>({
      query: (projectId) => `projects/${projectId}/api-endpoints`,
      providesTags: (result, error, projectId) => [
        { type: "ApiEndpoint", id: projectId },
      ],
    }),

    createProject: builder.mutation<Project, ProjectInput>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    updateProject: builder.mutation<
      Project,
      { id: string; project: Partial<ProjectInput> }
    >({
      query: ({ id, project }) => ({
        url: `projects/${id}`,
        method: "PUT",
        body: project,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),

    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),
  }),
});
