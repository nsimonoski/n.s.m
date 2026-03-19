interface BrowserStorageOptions {
  type?: 'local' | 'session';
}

export function browserStorage<T>(key: string, options?: BrowserStorageOptions) {
  const storage = options?.type === 'session' ? sessionStorage : localStorage;

  return {
    load(): T | null {
      try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    save(data: Partial<T>): void {
      const existing = this.load();
      storage.setItem(key, JSON.stringify({ ...existing, ...data }));
    },

    remove(): void {
      storage.removeItem(key);
    },

    clearAll(preserveKeys: string[] = []): void {
      const preserved = preserveKeys.map((k) => [k, localStorage.getItem(k)] as const);
      localStorage.clear();
      sessionStorage.clear();
      preserved.forEach(([k, value]) => value && localStorage.setItem(k, value));
    },
  };
}
