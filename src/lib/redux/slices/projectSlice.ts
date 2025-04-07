import { Database } from "@/types/database.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectState {
  selectedProject: Project | null;
  activeTab: "overview" | "screens" | "models" | "api" | "tasks";
  filterStatus: "all" | "open" | "in-progress" | "completed";
}

const initialState: ProjectState = {
  selectedProject: null,
  activeTab: "overview",
  filterStatus: "all",
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<ProjectState["activeTab"]>) => {
      state.activeTab = action.payload;
    },
    setFilterStatus: (
      state,
      action: PayloadAction<ProjectState["filterStatus"]>
    ) => {
      state.filterStatus = action.payload;
    },
  },
});

export const { setSelectedProject, setActiveTab, setFilterStatus } =
  projectSlice.actions;

export default projectSlice.reducer;
