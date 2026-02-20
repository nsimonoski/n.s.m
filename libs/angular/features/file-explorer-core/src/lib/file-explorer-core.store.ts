import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { FileResponseDto, GitBranchDto } from '@org/shared/contracts';
import { handleError, partialStore } from '@org/angular-utils';
import { FileExplorerService, GitService, GitWsService } from '@org/angular-data-access';
import { SnackbarService } from '@org/angular/ui';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

interface FileExplorerCoreState {
  width: number;
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
    branch: '',
    branches: [],
    searchResults: [],
    searchLoading: false,
    stagedCount: 0,
    changesCount: 0,
  }),
  partialStore.withBrowserStorage({ key: 'file-explorer-core', debounce: 300 }),
  partialStore.withRouting(),
  withProps(() => ({
    gitService: inject(GitService),
    fileService: inject(FileExplorerService),
    wsService: inject(GitWsService),
    snackbar: inject(SnackbarService),
  })),
  withComputed((store) => ({
    activePanel: computed(() => (store.currentUrl().startsWith('/git') ? 'git' : 'explorer')),
  })),
  withMethods((store) => ({
    setWidth: (width: number) => {
      store.saveToStorage({ width });
    },
    setActivePanel: (panel: string) => {
      store.navigate('/' + panel);
    },
    openFile: (path: string) => {
      store.navigate('/explorer?filePath=' + encodeURIComponent(path));
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
    loadGitStatus: rxMethod<void>(
      pipe(
        switchMap(() => store.gitService.getStatusTree(ROOT_PATH)),
        tap(({ branch, stagedCount, changesCount }) => {
          patchState(store, { branch, stagedCount, changesCount });
        }),
      ),
    ),
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
        handleError((msg) => store.snackbar.error(msg)),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.loadFromStorage();
      store.wsService.watchPath(ROOT_PATH);
      store.listBranches();
      store.loadGitStatus();
      store.listenToGitChanges();
    },
  }),
);
