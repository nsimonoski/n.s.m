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
import { GitBranchDto } from '@org/shared/contracts';
import { GitService } from '../git.service';
import { GitWsService } from '../git-ws.service';
import { SnackbarService } from '@org/angular/ui';
import { AuthStore } from './auth.store';

export interface GitStatusState {
  rootPath: string;
  branch: string;
  tracking: boolean;
  branches: GitBranchDto[];
  stagedCount: number;
  changesCount: number;
  ahead: number;
  behind: number;
}

export const GitStatusStore = signalStore(
  { providedIn: 'root' },
  withState<GitStatusState>({
    rootPath: '',
    branch: '',
    tracking: true,
    branches: [],
    stagedCount: 0,
    changesCount: 0,
    ahead: 0,
    behind: 0,
  }),
  withProps(() => ({
    authStore: inject(AuthStore),
    gitService: inject(GitService),
    wsService: inject(GitWsService),
    snackbar: inject(SnackbarService),
  })),
  withMethods((store) => ({
    updateGitStatus: (partial: Partial<GitStatusState>) => {
      patchState(store, partial);
    },
    listBranches: rxMethod<void>(
      pipe(
        switchMap(() => store.gitService.listBranches(store.rootPath())),
        tap(({ success, data }) => {
          if (!success) return;
          const current = data.find((b) => b.current);
          patchState(store, { branches: data, ...(current ? { branch: current.name } : {}) });
        }),
      ),
    ),
    loadGitStatus: rxMethod<void>(
      pipe(
        switchMap(() => store.gitService.getStatusTree(store.rootPath())),
        tap(({ success, data }) => {
          if (!success) return;
          const { branch, tracking, stagedCount, changesCount, ahead, behind } = data;
          patchState(store, { branch, tracking, stagedCount, changesCount, ahead, behind });
        }),
      ),
    ),
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => store.wsService.gitChanges$),
        tap(({ branch, tracking, stagedCount, changesCount, ahead, behind }) => {
          patchState(store, { branch, tracking, stagedCount, changesCount, ahead, behind });
        }),
      ),
    ),
    checkout: rxMethod<string>(
      pipe(
        switchMap((branch: string) => store.gitService.checkout(store.rootPath(), branch)),
        switchMap(({ success, error }) => {
          if (!success) {
            store.snackbar.error(error);
            return [];
          }
          return store.gitService.listBranches(store.rootPath());
        }),
        tap(({ success, data }) => {
          if (!success) return;
          const current = data.find((b) => b.current);
          patchState(store, { branches: data, ...(current ? { branch: current.name } : {}) });
        }),
      ),
    ),
    createBranch: rxMethod<{ branch: string; sourceBranch?: string }>(
      pipe(
        switchMap(({ branch, sourceBranch }) =>
          store.gitService.createBranch(store.rootPath(), branch, sourceBranch),
        ),
        switchMap((result) => {
          if (!result.success) {
            store.snackbar.error(result.error);
            return [];
          }
          return store.gitService.listBranches(store.rootPath()).pipe(
            tap(({ success, data }) => {
              if (!success) return;
              const current = data.find((b) => b.current);
              patchState(store, {
                branches: data,
                ...(current ? { branch: current.name } : {}),
              });
              store.snackbar.success(`Branch "${current?.name}" created`);
            }),
          );
        }),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      const rootPath = store.authStore.workspace()?.rootPath ?? '';
      patchState(store, { rootPath });
      store.wsService.watchRepositoryForChanges(rootPath);
      store.listBranches();
      store.loadGitStatus();
      store.listenToGitChanges();
    },
  }),
);
