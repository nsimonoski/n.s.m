import { pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';

import { DirectoryResponseDto } from '@org/shared/contracts';
import { FileExplorerService } from '../services/file-explorer.service';

interface FileExplorerComponentState {
  directory: DirectoryResponseDto | null;
  loading: boolean;
}

export const FileExplorerStore = signalStore(
  withState<FileExplorerComponentState>({
    directory: null,
    loading: false,
  }),
  withProps(() => ({ service: inject(FileExplorerService) })),
  withMethods((state) => {
    return {
      getDirectory: rxMethod<string>(
        pipe(
          // tap(() => patchState(state, { loading: true })),
          switchMap((path: string) => state.service.readDirectory(path)),
          tap((directory) => {
            if (!directory) {
              patchState(state, { loading: false });
              return;
            }

            patchState(state, { directory, loading: false });
          }),
        ),
      ),
    };
  }),
  withHooks({
    onInit(state) {
      state.getDirectory('/Users/nsm/Desktop/repos/n.s.m/apps/angular-ide');
    },
  }),
);
