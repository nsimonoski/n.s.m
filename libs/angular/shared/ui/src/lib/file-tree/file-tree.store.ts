import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';

interface FileTreeState {
  expandedPaths: Set<string>;
  selectedPath: string | null;
}

const initialState: FileTreeState = {
  expandedPaths: new Set(),
  selectedPath: null,
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
    
    reset: () => patchState(store, initialState),
  })),
  
  withComputed((store) => ({
    isExpanded: computed(() => (path: string) => store.expandedPaths().has(path)),
    isSelected: computed(() => (path: string) => store.selectedPath() === path),
  }))
);