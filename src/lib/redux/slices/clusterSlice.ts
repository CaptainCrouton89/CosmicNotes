import { createSlice } from "@reduxjs/toolkit";
import { clustersApi } from "../services/clustersApi";

// Define a simplified version of Cluster for state management
// to avoid recursive type instantiation
type ClusterState = {
  clusters: {
    id: number;
    category: string;
    summary: string;
    tag_count: number;
    created_at: string;
    updated_at: string;
    // Omit deeply nested references
  }[];
  hasLoaded: boolean;
};

const initialState: ClusterState = {
  clusters: [],
  hasLoaded: false,
};

const clusterSlice = createSlice({
  name: "cluster",
  initialState,
  reducers: {
    clearClusters: (state) => {
      state.clusters = [];
      state.hasLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      clustersApi.endpoints.getClusters.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.clusters) {
          state.clusters = payload.clusters;
          state.hasLoaded = true;
        }
      }
    );
  },
});

export const { clearClusters } = clusterSlice.actions;
export default clusterSlice.reducer;
