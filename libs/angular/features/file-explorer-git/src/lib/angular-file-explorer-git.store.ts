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
import { DirectoryResponseDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import { GitService } from './data-access/git.service';
import { GitWsService } from './data-access/git-ws.service';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

interface GitExplorerState {
  changesTree: DirectoryResponseDto | null;
  statusMap: Record<string, string>;
  commitMessage: string;
  ahead: number;
  behind: number;
}

export const AngularFileExplorerGitStore = signalStore(
  { providedIn: 'root' },
  withState<GitExplorerState>({
    changesTree: null,
    statusMap: {},
    commitMessage: '',
    ahead: 0,
    behind: 0,
  }),
  partialStore.withLoading(),
  partialStore.withBrowserStorage({ key: 'git-explorer' }),
  withProps(() => ({
    service: inject(GitService),
    wsService: inject(GitWsService),
  })),
  withMethods((state) => {
    const patchFromResponse = (response: { tree: DirectoryResponseDto; statusMap: Record<string, string>; ahead: number; behind: number }) => {
      patchState(state, {
        changesTree: response.tree,
        statusMap: response.statusMap,
        ahead: response.ahead,
        behind: response.behind,
      });
    };

    const refreshStatus = () => {
      state.service.getStatusTree(ROOT_PATH).subscribe(patchFromResponse);
    };

    return {
      getStatus: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.getStatusTree(path)),
          tap((response) => {
            state.setLoading(false);
            patchFromResponse(response);
          }),
        ),
      ),
      stage: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) => state.service.stage(ROOT_PATH, paths)),
          tap(() => refreshStatus()),
        ),
      ),
      unstage: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) => state.service.unstage(ROOT_PATH, paths)),
          tap(() => refreshStatus()),
        ),
      ),
      setCommitMessage: (commitMessage: string) => {
        state.saveToStorage({ commitMessage });
      },
      commit: rxMethod<string>(
        pipe(
          switchMap((message: string) =>
            state.service.commit(ROOT_PATH, message).pipe(
              switchMap(() => state.service.getStatusTree(ROOT_PATH)),
            ),
          ),
          tap((response) => {
            state.saveToStorage({ commitMessage: '' });
            patchFromResponse(response);
          }),
        ),
      ),
      sync: rxMethod<void>(
        pipe(
          switchMap(() =>
            state.service.push(ROOT_PATH).pipe(
              switchMap(() => state.service.getStatusTree(ROOT_PATH)),
            ),
          ),
          tap(patchFromResponse),
        ),
      ),
      listenToGitChanges: rxMethod<void>(
        pipe(
          switchMap(() => state.wsService.gitChanges$),
          tap((event) => refreshStatus()),
        ),
      ),
    };
  }),
  withHooks({
    onInit(state) {
      state.loadFromStorage();
      state.getStatus(ROOT_PATH);
      state.wsService.watchPath(ROOT_PATH);
      state.listenToGitChanges();
    },
  }),
);
