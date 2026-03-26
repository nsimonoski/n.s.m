import { browserStorage } from './browser-storage';

describe('browserStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('load', () => {
    it('should return null when key does not exist', () => {
      const store = browserStorage<{ name: string }>('test-key');
      expect(store.load()).toBeNull();
    });

    it('should return parsed data when key exists', () => {
      localStorage.setItem('test-key', JSON.stringify({ name: 'test' }));
      const store = browserStorage<{ name: string }>('test-key');
      expect(store.load()).toEqual({ name: 'test' });
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('test-key', 'not-json');
      const store = browserStorage<{ name: string }>('test-key');
      expect(store.load()).toBeNull();
    });
  });

  describe('save', () => {
    it('should save data to localStorage by default', () => {
      const store = browserStorage<{ name: string; age: number }>('test-key');
      store.save({ name: 'test' });
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'test' });
    });

    it('should merge with existing data', () => {
      localStorage.setItem('test-key', JSON.stringify({ name: 'old' }));
      const store = browserStorage<{ name: string; age: number }>('test-key');
      store.save({ age: 25 });
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'old', age: 25 });
    });

    it('should use sessionStorage when type is session', () => {
      const store = browserStorage<{ val: number }>('session-key', { type: 'session' });
      store.save({ val: 42 });
      expect(JSON.parse(sessionStorage.getItem('session-key')!)).toEqual({ val: 42 });
      expect(localStorage.getItem('session-key')).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove the key from storage', () => {
      localStorage.setItem('test-key', JSON.stringify({ name: 'test' }));
      const store = browserStorage<{ name: string }>('test-key');
      store.remove();
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear both storages', () => {
      localStorage.setItem('a', '1');
      sessionStorage.setItem('b', '2');
      const store = browserStorage('any');
      store.clearAll();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });

    it('should preserve specified keys', () => {
      localStorage.setItem('keep', '"preserved"');
      localStorage.setItem('remove', '"gone"');
      const store = browserStorage('any');
      store.clearAll(['keep']);
      expect(localStorage.getItem('keep')).toBe('"preserved"');
      expect(localStorage.getItem('remove')).toBeNull();
    });
  });
});
