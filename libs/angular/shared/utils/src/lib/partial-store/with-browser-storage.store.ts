import { patchState, signalStoreFeature, withMethods } from '@ngrx/signals';

interface BrowserStorageConfig {
  key: string;
  type?: 'local' | 'session';
}

export const withBrowserStorage = (config: BrowserStorageConfig) => {
  const storage = config.type === 'session' ? sessionStorage : localStorage;

  return signalStoreFeature(
    withMethods((store) => ({
      loadFromStorage(): boolean {
        const saved = storage.getItem(config.key);
        if (!saved) {
          return false;
        }

        try {
          patchState(store, JSON.parse(saved));
          return true;
        } catch {
          return false;
        }
      },
      saveToStorage(data: Record<string, unknown>): void {
        patchState(store, data);
        const existing = storage.getItem(config.key);
        const merged = existing ? { ...JSON.parse(existing), ...data } : data;
        storage.setItem(config.key, JSON.stringify(merged));
      },
    })),
  );
};
