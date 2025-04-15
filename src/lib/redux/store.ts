import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { clustersApi } from "./services/clustersApi";
import { itemsApi } from "./services/itemsApi";
import { notesApi } from "./services/notesApi";
import { settingsApi } from "./services/settingsApi";
import { tagsApi } from "./services/tagsApi";
import clusterReducer from "./slices/clusterSlice";
import noteReducer from "./slices/noteSlice";
import searchReducer from "./slices/searchSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    note: noteReducer,
    search: searchReducer,
    ui: uiReducer,
    cluster: clusterReducer,
    [notesApi.reducerPath]: notesApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
    [clustersApi.reducerPath]: clustersApi.reducer,
    [itemsApi.reducerPath]: itemsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      notesApi.middleware,
      tagsApi.middleware,
      clustersApi.middleware,
      itemsApi.middleware,
      settingsApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
