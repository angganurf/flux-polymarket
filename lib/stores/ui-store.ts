import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  selectedCategory: string;
  selectedSort: string;
  toggleSidebar: () => void;
  setCategory: (category: string) => void;
  setSort: (sort: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  selectedCategory: "all",
  selectedSort: "volume_24hr",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCategory: (category) => set({ selectedCategory: category }),
  setSort: (sort) => set({ selectedSort: sort }),
}));
