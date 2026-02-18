import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

export const withFileTree = () =>
  signalStoreFeature(
    withState<{ expandedPaths: Set<string>; selectedPath: string | null }>({
      expandedPaths: new Set<string>(),
      selectedPath: null,
    }),
    withMethods((state) => ({
      toggleExpanded(path: string): void {
        const expanded = new Set(state.expandedPaths());
        if (expanded.has(path)) {
          expanded.delete(path);
        } else {
          expanded.add(path);
        }
        patchState(state, { expandedPaths: expanded });
      },
      setExpanded(path: string, isExpanded: boolean): void {
        const expanded = new Set(state.expandedPaths());
        if (isExpanded) {
          expanded.add(path);
        } else {
          expanded.delete(path);
        }
        patchState(state, { expandedPaths: expanded });
      },
      expandAll(paths: string[]): void {
        patchState(state, { expandedPaths: new Set(paths) });
      },
      selectNode(path: string | null): void {
        patchState(state, { selectedPath: path });
      },
    })),
  );
