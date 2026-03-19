import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResizeUtils } from '@org/shared/utils';

interface IdeLayoutState {
  activePanel: string;
  sidebarOpen: boolean;
  width: number;
}

interface IdeLayoutActions {
  setActivePanel: (panel: string) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setWidth: (width: number) => void;
}

export const useIdeLayoutStore = create<IdeLayoutState & IdeLayoutActions>()(
  persist(
    (set) => ({
      activePanel: 'explorer',
      sidebarOpen: window.innerWidth < 768,
      width: ResizeUtils.DEFAULT_PANEL_WIDTH,

      setActivePanel: (panel) =>
        set((state) => ({
          activePanel: panel,
          sidebarOpen: state.activePanel === panel ? !state.sidebarOpen : true,
        })),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      closeSidebar: () => set({ sidebarOpen: false }),

      setWidth: (width) => set({ width }),
    }),
    {
      name: 'ide-layout',
      partialize: (state) => ({ width: state.width }),
    },
  ),
);
