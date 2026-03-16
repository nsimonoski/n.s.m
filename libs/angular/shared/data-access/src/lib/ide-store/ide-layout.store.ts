import { computed, inject } from '@angular/core';
import {
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
}

export const IdeLayoutStore = signalStore(
  { providedIn: 'root' },
  withState<IdeLayoutState>({
    width: ResizeUtils.DEFAULT_PANEL_WIDTH,
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
  })),
  withHooks({
    onInit(store) {
      store.loadFromStorage();
    },
  }),
);
