import { patchState, signalStoreFeature, withMethods } from '@ngrx/signals';
import { browserStorage } from '@org/shared/utils';

interface BrowserStorageConfig {
  key: string;
  type?: 'local' | 'session';
}

export const withBrowserStorage = (config: BrowserStorageConfig) => {
  const storage = browserStorage<Record<string, unknown>>(config.key, { type: config.type });

  return signalStoreFeature(
    withMethods((store) => ({
      loadFromStorage(): boolean {
        const saved = storage.load();
        if (!saved) {
          return false;
        }

        try {
          patchState(store, saved);
          return true;
        } catch {
          return false;
        }
      },
      saveToStorage(data: Record<string, unknown>): void {
        patchState(store, data);
        storage.save(data);
      },
      clearAllStorage(preserveKeys: string[] = []): void {
        storage.clearAll(preserveKeys);
      },
    })),
  );
};
