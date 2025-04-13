import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notesApi } from "../services/notesApi";

interface SearchResult {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface SearchState {
  query: string;
  selectedCategory: string | null;
  results: SearchResult[];
  hasSearched: boolean;
}

const initialState: SearchState = {
  query: "",
  selectedCategory: null,
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
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    clearSearch: (state) => {
      state.query = "";
      state.selectedCategory = null;
      state.results = [];
      state.hasSearched = false;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      notesApi.endpoints.searchNotes.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.notes) {
          state.results = payload.notes.map((note) => ({
            id: note.id,
            title: note.title,
            content: note.content ?? "",
            created_at: note.created_at,
            updated_at: note.updated_at,
          }));
          state.hasSearched = true;
        }
      }
    );
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  clearSearch,
  setHasSearched,
} = searchSlice.actions;
export default searchSlice.reducer;
