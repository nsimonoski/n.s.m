import { signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { withBrowserStorage } from './with-browser-storage.store';

describe('withBrowserStorage', () => {
  const STORAGE_KEY = 'test-store';

  const TestStore = signalStore(
    { providedIn: 'root' },
    withState({ count: 0, label: 'default' }),
    withBrowserStorage({ key: STORAGE_KEY }),
  );

  function setup() {
    localStorage.clear();
    sessionStorage.clear();
    return TestBed.inject(TestStore);
  }

  describe('loadFromStorage', () => {
    it('should return false when no saved data exists', () => {
      const store = setup();
      expect(store.loadFromStorage()).toBe(false);
    });

    it('should load saved data and patch state', () => {
      const store = setup();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 42 }));
      const loaded = store.loadFromStorage();
      expect(loaded).toBe(true);
      expect(store.count()).toBe(42);
    });

    it('should not overwrite fields that were not saved', () => {
      const store = setup();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 10 }));
      store.loadFromStorage();
      expect(store.count()).toBe(10);
      expect(store.label()).toBe('default');
    });
  });

  describe('saveToStorage', () => {
    it('should save data to localStorage and patch state', () => {
      const store = setup();
      store.saveToStorage({ count: 99 });
      expect(store.count()).toBe(99);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ count: 99 });
    });

    it('should merge with existing saved data', () => {
      const store = setup();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 1 }));
      store.saveToStorage({ label: 'updated' });
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved).toEqual({ count: 1, label: 'updated' });
    });
  });

  describe('removeFromStorage', () => {
    it('should remove the key from localStorage', () => {
      const store = setup();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 1 }));
      store.removeFromStorage();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('clearAllStorage', () => {
    it('should clear all storage', () => {
      const store = setup();
      localStorage.setItem('a', '1');
      localStorage.setItem('b', '2');
      sessionStorage.setItem('c', '3');
      store.clearAllStorage();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });

    it('should preserve specified keys', () => {
      const store = setup();
      localStorage.setItem('keep-me', '"value"');
      localStorage.setItem('remove-me', '"gone"');
      store.clearAllStorage(['keep-me']);
      expect(localStorage.getItem('keep-me')).toBe('"value"');
      expect(localStorage.getItem('remove-me')).toBeNull();
    });
  });

  describe('session storage', () => {
    const SessionStore = signalStore(
      { providedIn: 'root' },
      withState({ value: '' }),
      withBrowserStorage({ key: 'session-test', type: 'session' }),
    );

    it('should use sessionStorage when type is session', () => {
      sessionStorage.clear();
      const store = TestBed.inject(SessionStore);
      store.saveToStorage({ value: 'session-data' });
      expect(sessionStorage.getItem('session-test')).toBeTruthy();
      expect(localStorage.getItem('session-test')).toBeNull();
    });
  });
});
