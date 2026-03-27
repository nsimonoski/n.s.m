import { inject } from '@angular/core';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import { GitService } from '../git.service';
import { GitStatusStore } from '../ide-store';

export const withGitActions = () =>
  signalStoreFeature(
    withProps(() => ({
      _gitService: inject(GitService),
      _gitStatusStore: inject(GitStatusStore),
      _gitSnackbar: inject(SnackbarService),
    })),
    withMethods((store) => ({
      gitCommit: rxMethod<string>(
        pipe(
          switchMap((message: string) =>
            store._gitService.commit(store._gitStatusStore.rootPath(), message),
          ),
          tap(({ success, error }) => {
            if (!success) return store._gitSnackbar.error(error);
            store._gitSnackbar.success('Committed!');
          }),
        ),
      ),
      gitPush: rxMethod<void>(
        pipe(
          switchMap(() => store._gitService.push(store._gitStatusStore.rootPath())),
          tap(({ success, error }) => {
            if (!success) return store._gitSnackbar.error(error);
            store._gitSnackbar.success('Pushed!');
          }),
        ),
      ),
      gitStage: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) =>
            store._gitService.stage(store._gitStatusStore.rootPath(), paths),
          ),
        ),
      ),
      gitUnstage: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) =>
            store._gitService.unstage(store._gitStatusStore.rootPath(), paths),
          ),
        ),
      ),
      gitDiscard: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) =>
            store._gitService.discard(store._gitStatusStore.rootPath(), paths),
          ),
        ),
      ),
      gitStash: rxMethod<void>(
        pipe(
          switchMap(() => store._gitService.stash(store._gitStatusStore.rootPath())),
          tap(({ success, error }) => {
            if (!success) return store._gitSnackbar.error(error);
            store._gitSnackbar.success('Stashed!');
          }),
        ),
      ),
      gitStashPop: rxMethod<void>(
        pipe(
          switchMap(() => store._gitService.stashPop(store._gitStatusStore.rootPath())),
          tap(({ success, error }) => {
            if (!success) return store._gitSnackbar.error(error);
            store._gitSnackbar.success('Stash popped!');
          }),
        ),
      ),
      gitStashApply: rxMethod<void>(
        pipe(
          switchMap(() => store._gitService.stashApply(store._gitStatusStore.rootPath())),
          tap(({ success, error }) => {
            if (!success) return store._gitSnackbar.error(error);
            store._gitSnackbar.success('Stash applied!');
          }),
        ),
      ),
    })),
  );
