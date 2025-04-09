import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isChatVisible: boolean;
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
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setChatVisibility: (state, action: PayloadAction<boolean>) => {
      state.isChatVisible = action.payload;
    },
    toggleChatVisibility: (state) => {
      state.isChatVisible = !state.isChatVisible;
    },
  },
});

export const { setChatVisibility, toggleChatVisibility } = uiSlice.actions;
export default uiSlice.reducer;
