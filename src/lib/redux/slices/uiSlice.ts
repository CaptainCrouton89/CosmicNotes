import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isChatVisible: boolean;
  header: string;
  headerMeta: string;
}

// Initialize based on screen size with fallback to desktop default
const getInitialChatVisibility = () => {
  if (typeof window !== "undefined") {
    return window.innerWidth >= 1300; // Same breakpoint used in component
  }
  return true; // Default to visible on initial SSR render
};

const initialState: UiState = {
  isChatVisible: getInitialChatVisibility(),
  header: "Cosmic Notes",
  headerMeta: "",
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
  },
});

export const {
  setChatVisibility,
  toggleChatVisibility,
  setHeader,
  setHeaderMeta,
} = uiSlice.actions;
export default uiSlice.reducer;
