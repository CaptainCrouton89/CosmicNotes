import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { clustersApi } from "./services/clustersApi";
import { notesApi } from "./services/notesApi";
import { projectsApi } from "./services/projectsApi";
import { tagsApi } from "./services/tagsApi";
import noteReducer from "./slices/noteSlice";
import projectReducer from "./slices/projectSlice";
import searchReducer from "./slices/searchSlice";

export const store = configureStore({
  reducer: {
    note: noteReducer,
    project: projectReducer,
    search: searchReducer,
    [notesApi.reducerPath]: notesApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [clustersApi.reducerPath]: clustersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      notesApi.middleware,
      tagsApi.middleware,
      projectsApi.middleware,
      clustersApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
