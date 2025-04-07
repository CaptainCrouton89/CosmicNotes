import { createSlice } from "@reduxjs/toolkit";

// Simplified Note type to avoid deep type instantiation
type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  project_id?: string;
};

interface NoteState {
  selectedNote: Note | null;
  filterTags: string[];
  sortOrder: "asc" | "desc";
  viewMode: "list" | "grid";
}

const initialState: NoteState = {
  selectedNote: null,
  filterTags: [],
  sortOrder: "desc",
  viewMode: "list",
};

export const noteSlice = createSlice({
  name: "note",
  initialState,
  reducers: {
    setSelectedNote(state, action) {
      state.selectedNote = action.payload;
    },
    addFilterTag(state, action) {
      if (!state.filterTags.includes(action.payload)) {
        state.filterTags.push(action.payload);
      }
    },
    removeFilterTag(state, action) {
      state.filterTags = state.filterTags.filter(
        (tag) => tag !== action.payload
      );
    },
    clearFilterTags(state) {
      state.filterTags = [];
    },
    setSortOrder(state, action) {
      state.sortOrder = action.payload;
    },
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
  },
});

export const {
  setSelectedNote,
  addFilterTag,
  removeFilterTag,
  clearFilterTags,
  setSortOrder,
  setViewMode,
} = noteSlice.actions;

export default noteSlice.reducer;
