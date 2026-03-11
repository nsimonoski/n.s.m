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
import { debounceTime, distinctUntilChanged, forkJoin, pipe, switchMap, tap } from 'rxjs';
import { DirectoryResponseDto, GitLogEntryDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import { IdeStore, FileExplorerService, GitService, GitWsService } from '@org/angular-data-access';
import { SnackbarService } from '@org/angular/ui';

interface GitExplorerState {
  rootPath: string;
  branch: string;
  changesTree: DirectoryResponseDto | null;
  statusMap: Record<string, string>;
  commitMessage: string;
  commitHistory: GitLogEntryDto[];
  ahead: number;
  behind: number;
  stagedCount: number;
  changesCount: number;
}

export const FileExplorerGitStore = signalStore(
  { providedIn: 'root' },
  withState<GitExplorerState>({
    rootPath: '',
    branch: '',
    changesTree: null,
    statusMap: {},
    commitMessage: '',
    commitHistory: [],
    ahead: 0,
    behind: 0,
    stagedCount: 0,
    changesCount: 0,
  }),
  partialStore.withLoading(),
  partialStore.withBrowserStorage({ key: 'git-explorer' }),
  withProps(() => ({
    authStore: inject(IdeStore.AuthStore),
    service: inject(GitService),
    wsService: inject(GitWsService),
    fileService: inject(FileExplorerService),
    editorStore: inject(IdeStore.CodeEditorStore),
    snackbar: inject(SnackbarService),
  })),
  withMethods((state) => ({
    getStatus: rxMethod<string>(
      pipe(
        tap(() => state.setLoading()),
        switchMap((path: string) => state.service.getStatusTree(path)),
        tap(({ tree: changesTree, ...rest }) => {
          state.setLoading(false);
          patchState(state, { changesTree, ...rest });
        }),
      ),
    ),
    stage: rxMethod<string[]>(
      pipe(switchMap((paths: string[]) => state.service.stage(state.rootPath(), paths))),
    ),
    unstage: rxMethod<string[]>(
      pipe(switchMap((paths: string[]) => state.service.unstage(state.rootPath(), paths))),
    ),
    discard: rxMethod<string[]>(
      pipe(switchMap((paths: string[]) => state.service.discard(state.rootPath(), paths))),
    ),
    setCommitMessage: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((commitMessage) => state.saveToStorage({ commitMessage })),
      ),
    ),
    commit: rxMethod<string>(
      pipe(
        switchMap((message: string) => state.service.commit(state.rootPath(), message)),
        tap(() => {
          state.saveToStorage({ commitMessage: '' });
          state.snackbar.success('Committed!');
        }),
      ),
    ),
    sync: rxMethod<void>(
      pipe(
        switchMap(() => state.service.push(state.rootPath())),
        tap(() => state.snackbar.success('Pushed!')),
      ),
    ),
    fetchLog: rxMethod<string>(
      pipe(
        switchMap((path: string) => state.service.getLog(path)),
        tap((commitHistory) => patchState(state, { commitHistory })),
      ),
    ),
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => state.wsService.gitChanges$),
        tap(({ tree: changesTree, ...rest }) => {
          patchState(state, { changesTree, ...rest });
        }),
        switchMap(() => state.service.getLog(state.rootPath())),
        tap((commitHistory) => patchState(state, { commitHistory })),
      ),
    ),
    stash: rxMethod<void>(
      pipe(
        switchMap(() => state.service.stash(state.rootPath())),
        tap(() => state.snackbar.success('Stashed!')),
      ),
    ),
    stashPop: rxMethod<void>(
      pipe(
        switchMap(() => state.service.stashPop(state.rootPath())),
        tap(() => state.snackbar.success('Stash popped!')),
      ),
    ),
    stashApply: rxMethod<void>(
      pipe(
        switchMap(() => state.service.stashApply(state.rootPath())),
        tap(() => state.snackbar.success('Stash applied!')),
      ),
    ),
    openDiff: rxMethod<string>(
      pipe(
        switchMap((filePath: string) =>
          forkJoin({
            headContent: state.service.showDiff(state.rootPath(), filePath),
            currentFile: state.fileService.getFile(`${state.rootPath()}/${filePath}`),
          }),
        ),
        tap(({ headContent, currentFile }) => {
          state.editorStore.openDiff(currentFile, headContent.content);
        }),
      ),
    ),
  })),
  withHooks({
    onInit(state) {
      state.loadFromStorage();
      const rootPath = state.authStore.workspace()?.rootPath ?? '';
      patchState(state, { rootPath });
      state.getStatus(rootPath);
      state.fetchLog(rootPath);
      state.wsService.watchRepositoryForChanges(rootPath);
      state.listenToGitChanges();
    },
  }),
);
