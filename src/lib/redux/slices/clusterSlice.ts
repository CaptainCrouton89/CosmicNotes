import { ITEM_CATEGORIES } from "@/lib/constants";
import { CATEGORIES, Category, Cluster } from "@/types/types";
import { createSlice } from "@reduxjs/toolkit";
import { tagsApi } from "../services/tagsApi";

type ClusterRecordMap = {
  [key in Cluster["category"]]: {
    clusterExists: boolean;
    hasNotes: boolean;
    isItemCategory: boolean;
  };
};

const defaultClusterMap: ClusterRecordMap = {
  scratchpad: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  "to-do": {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  journal: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  collection: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  brainstorm: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  research: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  learning: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  feedback: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
  meeting: {
    clusterExists: false,
    hasNotes: false,
    isItemCategory: false,
  },
};

// Define a simplified version of Cluster for state management
// to avoid recursive type instantiation
type ClusterState = {
  activeCluster: Omit<Cluster, "tag"> | null;
  activeCategory: Category | null;
  clusterMap: ClusterRecordMap;
  validNoteCategories: Category[];
};

const initialState: ClusterState = {
  activeCluster: null,
  activeCategory: null,
  clusterMap: defaultClusterMap,
  validNoteCategories: [],
};

const clusterSlice = createSlice({
  name: "cluster",
  initialState,
  reducers: {
    setClusterMap: (state, action) => {
      state.clusterMap = action.payload;
    },
    setActiveCluster: (state, action) => {
      state.activeCluster = action.payload;
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      tagsApi.endpoints.getTag.matchFulfilled,
      (state, { payload }) => {
        const map: ClusterRecordMap = {} as ClusterRecordMap;
        CATEGORIES.forEach((category) => {
          map[category] = {
            clusterExists:
              payload?.clusters?.some((c) => c.category === category) || false,
            hasNotes:
              payload?.notes.some((note) => note.category === category) ||
              false,
            isItemCategory: ITEM_CATEGORIES.includes(category),
          };
        });
        state.validNoteCategories = [
          ...new Set(payload.notes.map((note) => note.category)),
        ];
        // Initialize active category only if not already chosen (via URL or user interaction)
        if (!state.activeCategory) {
          state.activeCategory =
            payload.notes.length > 0 ? payload.notes[0].category : null;
        }
        state.clusterMap = map;
      }
    );
  },
});

export const { setClusterMap, setActiveCluster, setActiveCategory } =
  clusterSlice.actions;
export default clusterSlice.reducer;
