import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { AppRoutes, ResizeUtils } from '@org/shared/utils';
import { partialStore } from '@org/angular-utils';
import { CodeEditorStore } from './code-editor.store';

export interface IdeLayoutState {
  width: number;
  sidebarOpen: boolean;
  terminalOpen: boolean;
  terminalHeight: number;
  activeTerminalSessionId: string | null;
}

export const IdeLayoutStore = signalStore(
  { providedIn: 'root' },
  withState<IdeLayoutState>({
    width: ResizeUtils.DEFAULT_PANEL_WIDTH,
    sidebarOpen: false,
    terminalOpen: false,
    terminalHeight: 250,
    activeTerminalSessionId: null,
  }),
  partialStore.withBrowserStorage({ key: 'ide-layout' }),
  partialStore.withRouting(),
  withProps(() => ({
    editorStore: inject(CodeEditorStore),
  })),
  withComputed((store) => ({
    activePanel: computed(() => {
      const url = store.currentUrl();
      if (url.startsWith(AppRoutes.ide.git)) return 'git';
      if (url.startsWith(AppRoutes.ide.ai)) return 'ai';
      return 'explorer';
    }),
  })),
  withMethods((store) => ({
    setWidth: (width: number) => {
      store.saveToStorage({ width });
    },
    setActivePanel: (panel: string) => {
      const filePath = store.editorStore.activeFile()?.path;
      store.navigate(AppRoutes.ide.panel(panel, filePath));
    },
    openFile: (path: string) => {
      store.navigate(AppRoutes.ide.explorerWithFile(path));
    },
    toggleSidebar: () => {
      patchState(store, { sidebarOpen: !store.sidebarOpen() });
    },
    closeSidebar: () => {
      patchState(store, { sidebarOpen: false });
    },
    toggleTerminal: () => {
      const next = !store.terminalOpen();
      patchState(store, { terminalOpen: next });
      store.saveToStorage({ terminalOpen: next });
    },
    closeTerminal: () => {
      patchState(store, { terminalOpen: false });
      store.saveToStorage({ terminalOpen: false });
    },
    setTerminalHeight: (height: number) => {
      const clamped = Math.max(100, Math.min(600, height));
      patchState(store, { terminalHeight: clamped });
      store.saveToStorage({ terminalHeight: clamped });
    },
    setActiveTerminalSessionId: (id: string | null) => {
      patchState(store, { activeTerminalSessionId: id });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadFromStorage();
      if (window.innerWidth < 768) {
        patchState(store, { sidebarOpen: true });
      }
    },
  }),
);
