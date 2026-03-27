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
import { GitLogEntryDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import { GitService, GitStatusStore, GitWsService, withGitActions } from '@org/angular-data-access';
import { SnackbarService } from '@org/angular/ui';

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
  withProps(() => ({
    gitStatusStore: inject(GitStatusStore),
    service: inject(GitService),
    wsService: inject(GitWsService),
    snackbar: inject(SnackbarService),
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
          if (!success) return state.snackbar.error(error);
          state.saveToStorage({ commitMessage: '' });
          state.snackbar.success('Committed!');
        }),
      ),
    ),
    sync: rxMethod<void>(
      pipe(
        tap(() => state.gitPush()),
      ),
    ),
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
        switchMap(() => state.wsService.gitChanges$),
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
