import { create } from 'zustand';
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

export const useIdeLayoutStore = create<IdeLayoutState & IdeLayoutActions>((set) => ({
  activePanel: 'explorer',
  sidebarOpen: window.innerWidth < 768,
  width: ResizeUtils.loadPanelWidth(),

  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarOpen: state.activePanel === panel ? !state.sidebarOpen : true,
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  closeSidebar: () => set({ sidebarOpen: false }),

  setWidth: (width) => {
    ResizeUtils.savePanelWidth(width);
    set({ width });
  },
}));
