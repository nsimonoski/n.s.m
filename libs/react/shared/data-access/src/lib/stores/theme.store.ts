import { create } from 'zustand';
import { browserStorage, MonacoUtils } from '@org/shared/utils';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  toggleTheme: () => void;
  initTheme: () => void;
}

const storage = browserStorage<{ theme: Theme }>('ide-theme');

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  theme: 'dark',

  toggleTheme() {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    storage.save({ theme: next });
    applyTheme(next);
  },

  initTheme() {
    const saved = storage.load();
    const theme = saved?.theme ?? 'dark';
    set({ theme });
    applyTheme(theme);
  },
}));

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);

  if (MonacoUtils.editorUtils.isLoaded) {
    MonacoUtils.editorUtils.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }
}
