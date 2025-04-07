import { createSlice } from "@reduxjs/toolkit";
import { clustersApi } from "../services/clustersApi";

// Define types for cluster
interface Cluster {
  id: number;
  tag: string;
  tag_count: number;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface ClusterState {
  clusters: Cluster[];
  hasLoaded: boolean;
}

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
