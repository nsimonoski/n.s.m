import { patchState, signalStoreFeature, withMethods } from '@ngrx/signals';

interface BrowserStorageConfig {
  key: string;
  type?: 'local' | 'session';
}

export function clearBrowserStorage(): void {
  localStorage.clear();
  sessionStorage.clear();
}

export const withBrowserStorage = (config: BrowserStorageConfig) => {
  const storage = config.type === 'session' ? sessionStorage : localStorage;

  const persistToStorage = (data: Record<string, unknown>) => {
    const existing = storage.getItem(config.key);
    const merged = existing ? { ...JSON.parse(existing), ...data } : data;
    storage.setItem(config.key, JSON.stringify(merged));
  };

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
        persistToStorage(data);
      },
    })),
  );
};
