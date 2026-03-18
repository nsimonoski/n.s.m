import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { partialStore } from '@org/angular-utils';
import { MonacoUtils } from '@org/shared/utils';

type Theme = 'dark' | 'light';

export const ThemeStore = signalStore(
  { providedIn: 'root' },

  withState<{ theme: Theme }>({ theme: 'dark' }),

  partialStore.withBrowserStorage({ key: 'ide-theme' }),

  withMethods((state) => ({
    toggleTheme(): void {
      const next: Theme = state.theme() === 'dark' ? 'light' : 'dark';
      state.saveToStorage({ theme: next });
      applyTheme(next);
    },
    initTheme(): void {
      state.loadFromStorage();
      applyTheme(state.theme());
    },
  })),

  withHooks({
    onInit(state) {
      state.initTheme();
    },
  }),
);

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);

  if (MonacoUtils.editorUtils.isLoaded) {
    MonacoUtils.editorUtils.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }
}
