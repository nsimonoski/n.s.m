import { isDevMode } from '@angular/core';
import { signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { partialStore } from '@org/angular-utils';
import { withSnackbar } from '../snackbar/with-snackbar.store';

interface State {
  sections: Record<string, boolean>;
}

export const CollapsibleSectionStore = signalStore(
  { providedIn: 'root' },
  withState<State>({ sections: {} }),
  partialStore.withBrowserStorage({ key: 'collapsible-sections' }),
  withSnackbar(),
  withProps(() => ({
    registeredIds: new Set<string>(),
    defaults: {} as Record<string, boolean>,
  })),
  withMethods((state) => ({
    register(id: string, expanded = false): void {
      if (isDevMode() && state.registeredIds.has(id)) {
        state.showError(`CollapsibleSection: duplicate id "${id}"`);
      }
      state.registeredIds.add(id);
      if (expanded) {
        state.defaults[id] = false;
      }
    },

    unregister(id: string): void {
      state.registeredIds.delete(id);
      delete state.defaults[id];
    },

    isCollapsed(id: string): boolean {
      return state.sections()[id] ?? state.defaults[id] ?? true;
    },

    toggle(id: string): void {
      const current = this.isCollapsed(id);
      state.saveToStorage({ sections: { ...state.sections(), [id]: !current } });
    },
  })),
);
