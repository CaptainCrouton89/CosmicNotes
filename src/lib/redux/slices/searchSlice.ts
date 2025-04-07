import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notesApi } from "../services/notesApi";

// Import from database types if possible instead of creating a new type
interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  cosmic_tags?: {
    tag: string;
    confidence: number;
    created_at: string;
  }[];
  [key: string]: any; // Allow for additional properties
}

interface SearchState {
  query: string;
  results: any[]; // Using any to avoid type issues
  hasSearched: boolean;
}

const initialState: SearchState = {
  query: "",
  results: [],
  hasSearched: false,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    clearSearch: (state) => {
      state.query = "";
      state.results = [];
      state.hasSearched = false;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      notesApi.endpoints.searchNotes.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.notes) {
          state.results = payload.notes;
          state.hasSearched = true;
        }
      }
    );
  },
});

export const { setSearchQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
