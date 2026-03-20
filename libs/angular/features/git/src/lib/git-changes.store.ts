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
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { DirectoryResponseDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import {
  FileExplorerService,
  GitService,
  GitStatusStore,
  GitWsService,
  IdeStore,
} from '@org/angular-data-access';
import { SnackbarService } from '@org/angular/ui';

interface GitChangesState {
  changesTree: DirectoryResponseDto | null;
  statusMap: Record<string, string>;
}

export const GitChangesStore = signalStore(
  withState<GitChangesState>({
    changesTree: null,
    statusMap: {},
  }),
  partialStore.withLoading(),
  withProps(() => ({
    gitStatusStore: inject(GitStatusStore),
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
        tap(({ success, data }) => {
          state.setLoading(false);
          if (!success) return;
          const {
            tree: changesTree,
            statusMap,
            branch,
            stagedCount,
            changesCount,
            ahead,
            behind,
          } = data;
          patchState(state, { changesTree, statusMap });
          state.gitStatusStore.updateGitStatus({
            branch,
            stagedCount,
            changesCount,
            ahead,
            behind,
          });
        }),
      ),
    ),
    stage: rxMethod<string[]>(
      pipe(
        switchMap((paths: string[]) => state.service.stage(state.gitStatusStore.rootPath(), paths)),
      ),
    ),
    unstage: rxMethod<string[]>(
      pipe(
        switchMap((paths: string[]) =>
          state.service.unstage(state.gitStatusStore.rootPath(), paths),
        ),
      ),
    ),
    discard: rxMethod<string[]>(
      pipe(
        switchMap((paths: string[]) =>
          state.service.discard(state.gitStatusStore.rootPath(), paths),
        ),
      ),
    ),
    stash: rxMethod<void>(
      pipe(
        switchMap(() => state.service.stash(state.gitStatusStore.rootPath())),
        tap(({ success, error }) => {
          if (!success) return state.snackbar.error(error);
          state.snackbar.success('Stashed!');
        }),
      ),
    ),
    stashPop: rxMethod<void>(
      pipe(
        switchMap(() => state.service.stashPop(state.gitStatusStore.rootPath())),
        tap(({ success, error }) => {
          if (!success) return state.snackbar.error(error);
          state.snackbar.success('Stash popped!');
        }),
      ),
    ),
    stashApply: rxMethod<void>(
      pipe(
        switchMap(() => state.service.stashApply(state.gitStatusStore.rootPath())),
        tap(({ success, error }) => {
          if (!success) return state.snackbar.error(error);
          state.snackbar.success('Stash applied!');
        }),
      ),
    ),
    openDiff: rxMethod<string>(
      pipe(
        switchMap((filePath: string) =>
          forkJoin({
            headContent: state.service.showDiff(state.gitStatusStore.rootPath(), filePath),
            currentFile: state.fileService.getFile(
              `${state.gitStatusStore.rootPath()}/${filePath}`,
            ),
          }),
        ),
        tap(({ headContent, currentFile }) => {
          if (!headContent.success || !currentFile.success) return;
          state.editorStore.openDiff(currentFile.data, headContent.data.content);
        }),
      ),
    ),
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => state.wsService.gitChanges$),
        tap(
          ({ tree: changesTree, statusMap, branch, stagedCount, changesCount, ahead, behind }) => {
            patchState(state, { changesTree, statusMap });
            state.gitStatusStore.updateGitStatus({
              branch,
              stagedCount,
              changesCount,
              ahead,
              behind,
            });
          },
        ),
      ),
    ),
  })),
  withHooks({
    onInit(state) {
      state.getStatus(state.gitStatusStore.rootPath());
      state.listenToGitChanges();
    },
  }),
);
