import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notesApi } from "../services/notesApi";

interface SearchState {
  query: string;
  selectedCategory: string | null;
  results: Record<string, unknown>[]; // Using Record for better typing than any
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
          state.results = payload.notes;
          state.hasSearched = true;
        }
      }
    );
  },
});

export const { setSearchQuery, setSelectedCategory, clearSearch } =
  searchSlice.actions;
export default searchSlice.reducer;
