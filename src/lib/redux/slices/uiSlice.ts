import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isChatVisible: boolean;
  header: string;
  headerMeta: string;
  isSearchDialogOpen: boolean;
}

// Use a fixed initial state for SSR to prevent hydration mismatch
const initialState: UiState = {
  isChatVisible: false,
  header: "Cosmic Notes",
  headerMeta: "",
  isSearchDialogOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setHeader: (state, action: PayloadAction<string>) => {
      state.header = action.payload;
    },
    setChatVisibility: (state, action: PayloadAction<boolean>) => {
      state.isChatVisible = action.payload;
    },
    toggleChatVisibility: (state) => {
      state.isChatVisible = !state.isChatVisible;
    },
    setHeaderMeta: (state, action: PayloadAction<string>) => {
      state.headerMeta = action.payload;
    },
    setSearchDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchDialogOpen = action.payload;
    },
    toggleSearchDialog: (state) => {
      state.isSearchDialogOpen = !state.isSearchDialogOpen;
    },
  },
});

export const {
  setChatVisibility,
  toggleChatVisibility,
  setHeader,
  setHeaderMeta,
  setSearchDialogOpen,
  toggleSearchDialog,
} = uiSlice.actions;
export default uiSlice.reducer;
