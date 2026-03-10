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
import { AppRoutes } from '@org/shared/utils';
import { handleError, partialStore } from '@org/angular-utils';
import { FileExplorerService, GitService, GitWsService, IdeStore } from '@org/angular-data-access';
import { SnackbarService } from '@org/angular/ui';

interface FileExplorerCoreState {
  rootPath: string;
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
    rootPath: '',
    width: 300,
    branch: '',
    branches: [],
    searchResults: [],
    searchLoading: false,
    stagedCount: 0,
    changesCount: 0,
  }),
  partialStore.withBrowserStorage({ key: 'file-explorer-core' }),
  partialStore.withRouting(),
  withProps(() => ({
    authStore: inject(IdeStore.AuthStore),
    gitService: inject(GitService),
    fileService: inject(FileExplorerService),
    wsService: inject(GitWsService),
    snackbar: inject(SnackbarService),
  })),
  withComputed((store) => ({
    activePanel: computed(() => {
      const url = store.currentUrl();
      if (url.startsWith(AppRoutes.ide.git)) return 'git';
      if (url.startsWith(AppRoutes.ide.ai)) return 'ai';
      return 'explorer';
    }),
  })),
  withMethods((store) => ({
    setWidth: (width: number) => {
      store.saveToStorage({ width });
    },
    setActivePanel: (panel: string) => {
      store.navigate(AppRoutes.ide.panel(panel));
    },
    openFile: (path: string) => {
      store.navigate(AppRoutes.ide.explorerWithFile(path));
    },
    listBranches: rxMethod<void>(
      pipe(
        switchMap(() => store.gitService.listBranches(store.rootPath())),
        tap((branches) => {
          const current = branches.find((b) => b.current);
          patchState(store, { branches, ...(current ? { branch: current.name } : {}) });
        }),
      ),
    ),
    searchFiles: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { searchLoading: true })),
        switchMap((query: string) => store.fileService.searchFiles(query, store.rootPath())),
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
        switchMap(() => store.gitService.getStatusTree(store.rootPath())),
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
            .checkout(store.rootPath(), branch)
            .pipe(switchMap(() => store.gitService.listBranches(store.rootPath()))),
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
      const rootPath = store.authStore.workspace()?.rootPath ?? '';
      patchState(store, { rootPath });
      store.loadFromStorage();
      store.listBranches();
      store.loadGitStatus();
      store.listenToGitChanges();
    },
  }),
);
