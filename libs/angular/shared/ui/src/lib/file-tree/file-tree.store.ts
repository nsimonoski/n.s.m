import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';

export interface InlineCreate {
  parentPath: string;
  type: 'file' | 'directory';
}

interface FileTreeState {
  expandedPaths: Set<string>;
  selectedPath: string | null;
  inlineCreate: InlineCreate | null;
}

const initialState: FileTreeState = {
  expandedPaths: new Set(),
  selectedPath: null,
  inlineCreate: null,
};

export const FileTreeStore = signalStore(
  withState(initialState),

  withMethods((store) => ({

    toggleExpanded: (path: string) => {
      const expanded = new Set(store.expandedPaths());
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        expanded.add(path);
      }
      patchState(store, { expandedPaths: expanded });
    },

    setExpanded: (path: string, isExpanded: boolean) => {
      const expanded = new Set(store.expandedPaths());
      if (isExpanded) {
        expanded.add(path);
      } else {
        expanded.delete(path);
      }
      patchState(store, { expandedPaths: expanded });
    },

    selectNode: (path: string | null) => {
      patchState(store, { selectedPath: path });
    },

    startInlineCreate: (parentPath: string, type: 'file' | 'directory') => {
      const expanded = new Set(store.expandedPaths());
      expanded.add(parentPath);
      patchState(store, { inlineCreate: { parentPath, type }, expandedPaths: expanded });
    },

    cancelInlineCreate: () => {
      patchState(store, { inlineCreate: null });
    },

    expandAll: (paths: string[]) => {
      patchState(store, { expandedPaths: new Set(paths) });
    },

    reset: () => patchState(store, initialState),
  })),

  withComputed((store) => ({
    isExpanded: computed(() => (path: string) => store.expandedPaths().has(path)),
    isSelected: computed(() => (path: string) => store.selectedPath() === path),
    inlineCreateFor: computed(() => (path: string) => {
      const ic = store.inlineCreate();
      return ic && ic.parentPath === path ? ic : null;
    }),
  }))
);
