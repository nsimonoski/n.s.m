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
import { DirectoryResponseDto, GIT_CHANGE_EVENT, GitStatusTreeResponseDto } from '@org/shared/contracts';
import { partialStore, sockets } from '@org/angular-utils';
import {
  FileExplorerService,
  GitService,
  GitStatusStore,
  IdeStore,
  withGitActions,
} from '@org/angular-data-access';

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
  withGitActions(),
  withProps(() => ({
    gitStatusStore: inject(GitStatusStore),
    service: inject(GitService),
    ws: inject(sockets.WebSocketStore),
    fileService: inject(FileExplorerService),
    editorStore: inject(IdeStore.CodeEditorStore),
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
        switchMap(() => state.ws.on<GitStatusTreeResponseDto>(GIT_CHANGE_EVENT)),
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
