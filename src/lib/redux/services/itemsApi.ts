import { CompleteItem, Item } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clustersApi } from "./clustersApi";
import { tagsApi } from "./tagsApi";
// TODO: Import RootState from your store definition for better type safety
// import { RootState } from '../store'; // Example path

// Define the tag types for proper typing

// Define a more specific type for the patch result
interface OptimisticPatch {
  undo: () => void;
}

export const itemsApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Item"] as const,
  endpoints: (builder) => ({
    updateItem: builder.mutation<
      CompleteItem,
      { id: number; done: boolean; clusterId?: number; noteId?: number }
    >({
      query: ({ id, done }) => ({
        url: "item",
        method: "PUT",
        body: { id, done },
      }),
      onQueryStarted: async (
        { id: updatedItemId, done, clusterId, noteId },
        { dispatch, queryFulfilled, getState }
      ) => {
        const itemSpecificPatches: OptimisticPatch[] = [];
        const clusterSpecificPatches: OptimisticPatch[] = [];

        if (clusterId) {
          const clusterPatch = dispatch(
            clustersApi.util.updateQueryData(
              "getCluster",
              clusterId,
              (draftCluster) => {
                if (draftCluster.cluster_items) {
                  const itemInCluster = draftCluster.cluster_items.find(
                    (item) => item.id === updatedItemId
                  );
                  if (itemInCluster) {
                    itemInCluster.done = done;
                  }
                }
                draftCluster.notes?.forEach((note) => {
                  if (note.items) {
                    const itemInNote = note.items.find(
                      (item) => item.id === updatedItemId
                    );
                    if (itemInNote) {
                      (itemInNote as any).done = done;
                    }
                  }
                });
              }
            )
          );
          clusterSpecificPatches.push(clusterPatch as OptimisticPatch);
        }

        if (noteId) {
          const noteItemPatch = dispatch(
            itemsApi.util.updateQueryData(
              "getItemsByNoteId",
              noteId,
              (draft) => {
                const item = draft.find((i) => i.id === updatedItemId);
                if (item) item.done = done;
              }
            )
          );
          itemSpecificPatches.push(noteItemPatch as OptimisticPatch);
        } else if (!clusterId) {
          const state = getState() as any;
          const queryCache = state[itemsApi.reducerPath]?.queries;
          if (queryCache) {
            for (const cacheKey in queryCache) {
              if (cacheKey.startsWith("getItemsByNoteId(")) {
                const entry = queryCache[cacheKey];
                if (
                  entry &&
                  entry.status === "fulfilled" &&
                  Array.isArray(entry.data)
                ) {
                  const itemsInCache = entry.data as Item[];
                  const itemToUpdate = itemsInCache.find(
                    (item) => item.id === updatedItemId
                  );
                  if (itemToUpdate) {
                    const noteIdFromCacheKeyMatch = cacheKey.match(
                      /getItemsByNoteId\((\d+)\)/
                    );
                    if (noteIdFromCacheKeyMatch && noteIdFromCacheKeyMatch[1]) {
                      const noteIdFromCache = parseInt(
                        noteIdFromCacheKeyMatch[1],
                        10
                      );
                      const patchResult = dispatch(
                        itemsApi.util.updateQueryData(
                          "getItemsByNoteId",
                          noteIdFromCache,
                          (draft) => {
                            const item = draft.find(
                              (i) => i.id === updatedItemId
                            );
                            if (item) item.done = done;
                          }
                        )
                      );
                      itemSpecificPatches.push(patchResult as OptimisticPatch);
                    }
                  }
                }
              }
            }
          }
        }

        try {
          await queryFulfilled;
        } catch {
          itemSpecificPatches.forEach((p) => p.undo());
          clusterSpecificPatches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Item", id }],
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
      onQueryStarted: async () => {
        await tagsApi.util.invalidateTags([{ type: "Tag", id: "LIST" }]);
      },
      invalidatesTags: () => [{ type: "Item", id: "LIST" }],
    }),

    deleteItem: builder.mutation<
      void,
      { itemId: number; clusterId?: number; noteId?: number }
    >({
      query: ({ itemId }) => ({
        url: `item/${itemId}`,
        method: "DELETE",
      }),
      onQueryStarted: async (
        { itemId: itemIdToDelete, clusterId, noteId },
        { dispatch, queryFulfilled, getState }
      ) => {
        const itemSpecificPatches: OptimisticPatch[] = [];
        const clusterSpecificPatches: OptimisticPatch[] = [];

        if (clusterId) {
          const clusterPatch = dispatch(
            clustersApi.util.updateQueryData(
              "getCluster",
              clusterId,
              (draftCluster) => {
                if (draftCluster.cluster_items) {
                  draftCluster.cluster_items =
                    draftCluster.cluster_items.filter(
                      (item) => item.id !== itemIdToDelete
                    );
                }
                draftCluster.notes?.forEach((note) => {
                  if (note.items) {
                    note.items = note.items.filter(
                      (item) => item.id !== itemIdToDelete
                    );
                  }
                });
              }
            )
          );
          clusterSpecificPatches.push(clusterPatch as OptimisticPatch);
        }

        if (noteId) {
          const noteItemPatch = dispatch(
            itemsApi.util.updateQueryData(
              "getItemsByNoteId",
              noteId,
              (draft) => {
                return draft.filter(
                  (item) => item.id !== (itemIdToDelete as number)
                );
              }
            )
          );
          itemSpecificPatches.push(noteItemPatch as OptimisticPatch);
        } else if (!clusterId) {
          const state = getState() as any;
          const queryCache = state[itemsApi.reducerPath]?.queries;
          if (queryCache) {
            for (const cacheKey in queryCache) {
              if (cacheKey.startsWith("getItemsByNoteId(")) {
                const entry = queryCache[cacheKey];
                if (
                  entry &&
                  entry.status === "fulfilled" &&
                  Array.isArray(entry.data)
                ) {
                  const itemsInCache = entry.data as Item[];
                  if (itemsInCache.some((item) => item.id === itemIdToDelete)) {
                    const noteIdFromCacheKeyMatch = cacheKey.match(
                      /getItemsByNoteId\((\d+)\)/
                    );
                    if (noteIdFromCacheKeyMatch && noteIdFromCacheKeyMatch[1]) {
                      const noteIdFromCache = parseInt(
                        noteIdFromCacheKeyMatch[1],
                        10
                      );
                      const patchResult = dispatch(
                        itemsApi.util.updateQueryData(
                          "getItemsByNoteId",
                          noteIdFromCache,
                          (draft) => {
                            return draft.filter(
                              (item) => item.id !== itemIdToDelete
                            );
                          }
                        )
                      );
                      itemSpecificPatches.push(patchResult as OptimisticPatch);
                    }
                  }
                }
              }
            }
          }
        }

        try {
          await queryFulfilled;
        } catch {
          itemSpecificPatches.forEach((p) => p.undo());
          clusterSpecificPatches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, { itemId }) => [
        { type: "Item", id: itemId },
        { type: "Item", id: "LIST" },
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
