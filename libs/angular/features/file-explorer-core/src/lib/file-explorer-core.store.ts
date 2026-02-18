import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { partialStore } from '@org/angular-utils';

export const FileExplorerCoreStore = signalStore(
  { providedIn: 'root' },
  withState({ width: 300, activePanel: 'explorer' }),
  partialStore.withBrowserStorage({ key: 'file-explorer-core', debounce: 300 }),
  withMethods((store) => ({
    setWidth: (width: number) => {
      store.saveToStorage({ width });
    },
    setActivePanel: (activePanel: string) => {
      store.saveToStorage({ activePanel });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadFromStorage();
    },
  }),
);
