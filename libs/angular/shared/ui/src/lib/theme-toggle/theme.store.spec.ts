import { TestBed } from '@angular/core/testing';
import { ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  function setup() {
    localStorage.clear();
    return TestBed.inject(ThemeStore);
  }

  it('should initialize with dark theme', () => {
    const store = setup();
    expect(store.theme()).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    const store = setup();
    store.toggleTheme();
    expect(store.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should toggle from light back to dark', () => {
    const store = setup();
    store.toggleTheme();
    store.toggleTheme();
    expect(store.theme()).toBe('dark');
  });

  it('should persist theme to localStorage', () => {
    const store = setup();
    store.toggleTheme();
    const saved = JSON.parse(localStorage.getItem('ide-theme')!);
    expect(saved.theme).toBe('light');
  });

  it('should restore theme from localStorage', () => {
    localStorage.clear();
    localStorage.setItem('ide-theme', JSON.stringify({ theme: 'light' }));
    const store = TestBed.inject(ThemeStore);
    expect(store.theme()).toBe('light');
  });
});
