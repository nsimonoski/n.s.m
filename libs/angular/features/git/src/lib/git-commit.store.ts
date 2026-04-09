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
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';
import { GIT_CHANGE_EVENT, GitLogEntryDto, GitStatusTreeResponseDto } from '@org/shared/contracts';
import { partialStore, sockets } from '@org/angular-utils';
import { uiStore } from '@org/angular/ui';
import { GitService, GitStatusStore, withGitActions } from '@org/angular-data-access';

interface GitCommitState {
  commitMessage: string;
  commitHistory: GitLogEntryDto[];
}

export const GitCommitStore = signalStore(
  withState<GitCommitState>({
    commitMessage: '',
    commitHistory: [],
  }),
  partialStore.withBrowserStorage({ key: 'git-explorer' }),
  withGitActions(),
  uiStore.withSnackbar(),
  withProps(() => ({
    gitStatusStore: inject(GitStatusStore),
    service: inject(GitService),
    ws: inject(sockets.WebSocketStore),
  })),
  withMethods((state) => ({
    setCommitMessage: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((commitMessage) => state.saveToStorage({ commitMessage })),
      ),
    ),
    commit: rxMethod<string>(
      pipe(
        switchMap((message: string) =>
          state.service.commit(state.gitStatusStore.rootPath(), message),
        ),
        tap(({ success, error }) => {
          if (!success) return state.showError(error);
          state.saveToStorage({ commitMessage: '' });
          state.showSuccess('Committed!');
        }),
      ),
    ),
    sync: rxMethod<void>(pipe(tap(() => state.gitPush()))),
    fetchLog: rxMethod<string>(
      pipe(
        switchMap((path: string) => state.service.getLog(path)),
        tap(({ success, data }) => {
          if (!success) return;
          patchState(state, { commitHistory: data });
        }),
      ),
    ),
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => state.ws.on<GitStatusTreeResponseDto>(GIT_CHANGE_EVENT)),
        switchMap(() => state.service.getLog(state.gitStatusStore.rootPath())),
        tap(({ success, data }) => {
          if (!success) return;
          patchState(state, { commitHistory: data });
        }),
      ),
    ),
  })),
  withHooks({
    onInit(state) {
      state.loadFromStorage();
      state.fetchLog(state.gitStatusStore.rootPath());
      state.listenToGitChanges();
    },
  }),
);
