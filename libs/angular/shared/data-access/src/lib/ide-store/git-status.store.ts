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
import { handleError } from '@org/angular-utils';
import { GitService } from '../git.service';
import { GitWsService } from '../git-ws.service';
import { SnackbarService } from '@org/angular/ui';
import { AuthStore } from './auth.store';

export interface GitStatusState {
  rootPath: string;
  branch: string;
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
        tap((branches) => {
          const current = branches.find((b) => b.current);
          patchState(store, { branches, ...(current ? { branch: current.name } : {}) });
        }),
      ),
    ),
    loadGitStatus: rxMethod<void>(
      pipe(
        switchMap(() => store.gitService.getStatusTree(store.rootPath())),
        tap(({ branch, stagedCount, changesCount, ahead, behind }) => {
          patchState(store, { branch, stagedCount, changesCount, ahead, behind });
        }),
      ),
    ),
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => store.wsService.gitChanges$),
        tap(({ branch, stagedCount, changesCount, ahead, behind }) => {
          patchState(store, { branch, stagedCount, changesCount, ahead, behind });
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
    createBranch: rxMethod<{ branch: string; sourceBranch?: string }>(
      pipe(
        switchMap(({ branch, sourceBranch }) =>
          store.gitService.createBranch(store.rootPath(), branch, sourceBranch).pipe(
            switchMap(() => store.gitService.listBranches(store.rootPath())),
            tap((branches) => {
              const current = branches.find((b) => b.current);
              patchState(store, { branches, ...(current ? { branch: current.name } : {}) });
              store.snackbar.success(`Branch "${branch}" created`);
            }),
          ),
        ),
        handleError((msg) => store.snackbar.error(msg)),
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
