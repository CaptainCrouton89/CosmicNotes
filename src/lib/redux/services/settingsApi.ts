import { Database } from "@/types/database.types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type UserSettings = Database["public"]["Tables"]["cosmic_user_settings"]["Row"];
type UserSettingsInput = Partial<
  Database["public"]["Tables"]["cosmic_user_settings"]["Insert"]
>;

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    getSettings: builder.query<UserSettings, void>({
      query: () => "settings",
      transformResponse: (response: {
        success: boolean;
        settings: UserSettings;
      }) => response.settings,
      providesTags: ["Settings"],
    }),

    updateSettings: builder.mutation<UserSettings, UserSettingsInput>({
      query: (settings) => ({
        url: "settings",
        method: "PUT",
        body: settings,
      }),
      transformResponse: (response: {
        success: boolean;
        settings: UserSettings;
      }) => response.settings,
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
