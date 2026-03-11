import { inject, isDevMode } from '@angular/core';
import { signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { partialStore } from '@org/angular-utils';
import { SnackbarService } from '../snackbar/snackbar.service';

interface State {
  sections: Record<string, boolean>;
}

export const CollapsibleSectionStore = signalStore(
  { providedIn: 'root' },
  withState<State>({ sections: {} }),
  partialStore.withBrowserStorage({ key: 'collapsible-sections' }),
  withProps(() => ({
    snackbar: inject(SnackbarService),
    registeredIds: new Set<string>(),
  })),
  withMethods((state) => ({
    register(id: string): void {
      if (isDevMode() && state.registeredIds.has(id)) {
        state.snackbar.error(`CollapsibleSection: duplicate id "${id}"`);
      }
      state.registeredIds.add(id);
    },

    unregister(id: string): void {
      state.registeredIds.delete(id);
    },

    isCollapsed(id: string): boolean {
      return state.sections()[id] ?? true;
    },

    toggle(id: string): void {
      const current = state.sections()[id] ?? true;
      state.saveToStorage({ sections: { ...state.sections(), [id]: !current } });
    },
  })),
);
