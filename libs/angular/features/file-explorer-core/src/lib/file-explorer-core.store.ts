import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { FileResponseDto, GitBranchDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import { FileExplorerService, GitService, GitWsService } from '@org/angular-data-access';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

interface FileExplorerCoreState {
  width: number;
  activePanel: string;
  branch: string;
  branches: GitBranchDto[];
  searchResults: FileResponseDto[];
  searchLoading: boolean;
  stagedCount: number;
  changesCount: number;
}

export const FileExplorerCoreStore = signalStore(
  { providedIn: 'root' },
  withState<FileExplorerCoreState>({
    width: 300,
    activePanel: 'explorer',
    branch: '',
    branches: [],
    searchResults: [],
    searchLoading: false,
    stagedCount: 0,
    changesCount: 0,
  }),
  partialStore.withBrowserStorage({ key: 'file-explorer-core', debounce: 300 }),
  withProps(() => ({
    gitService: inject(GitService),
    fileService: inject(FileExplorerService),
    wsService: inject(GitWsService),
  })),
  withMethods((store) => ({
    setWidth: (width: number) => {
      store.saveToStorage({ width });
    },
    setActivePanel: (activePanel: string) => {
      store.saveToStorage({ activePanel });
    },
    listBranches: rxMethod<void>(
      pipe(
        switchMap(() => store.gitService.listBranches(ROOT_PATH)),
        tap((branches) => {
          const current = branches.find((b) => b.current);
          patchState(store, { branches, ...(current ? { branch: current.name } : {}) });
        }),
      ),
    ),
    searchFiles: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { searchLoading: true })),
        switchMap((query: string) => store.fileService.searchFiles(query, ROOT_PATH)),
        tap((searchResults) => {
          patchState(store, { searchResults, searchLoading: false });
        }),
      ),
    ),
    clearSearchResults: () => {
      patchState(store, { searchResults: [], searchLoading: false });
    },
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => store.wsService.gitChanges$),
        tap(({ branch, stagedCount, changesCount }) => {
          patchState(store, { branch, stagedCount, changesCount });
        }),
      ),
    ),
    checkout: rxMethod<string>(
      pipe(
        switchMap((branch: string) =>
          store.gitService
            .checkout(ROOT_PATH, branch)
            .pipe(switchMap(() => store.gitService.listBranches(ROOT_PATH))),
        ),
        tap((branches) => {
          const current = branches.find((b) => b.current);
          patchState(store, { branches, ...(current ? { branch: current.name } : {}) });
        }),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.loadFromStorage();
      store.listBranches();
      store.listenToGitChanges();
    },
  }),
);
