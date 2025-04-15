import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isChatVisible: boolean;
  header: string;
  headerMeta: string;
}

// Use a fixed initial state for SSR to prevent hydration mismatch
const initialState: UiState = {
  isChatVisible: false, // Default to not visible for SSR to avoid hydration issues
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
