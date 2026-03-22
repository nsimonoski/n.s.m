import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { FileResponseDto } from '@org/shared/contracts';
import { FileExplorerService, IdeStore } from '@org/angular-data-access';

interface FileSearchState {
  searchResults: FileResponseDto[];
  searchLoading: boolean;
}

export const FileSearchStore = signalStore(
  withState<FileSearchState>({
    searchResults: [],
    searchLoading: false,
  }),
  withProps(() => ({
    fileService: inject(FileExplorerService),
    authStore: inject(IdeStore.AuthStore),
  })),
  withComputed((store) => ({
    rootPath: computed(() => store.authStore.workspace()?.rootPath ?? ''),
  })),
  withMethods((store) => ({
    searchFiles: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { searchLoading: true })),
        switchMap((query: string) => store.fileService.searchFiles(query, store.rootPath())),
        tap(({ success, data }) => {
          patchState(store, {
            searchResults: success ? data : [],
            searchLoading: false,
          });
        }),
      ),
    ),
    clearSearchResults: () => {
      patchState(store, { searchResults: [], searchLoading: false });
    },
  })),
);
