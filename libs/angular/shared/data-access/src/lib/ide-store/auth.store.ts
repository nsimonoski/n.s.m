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
import { type UserProfileDto, type WorkspaceStatusDto, Permission } from '@org/shared/contracts';
import { AppRoutes } from '@org/shared/utils';
import { partialStore, sockets } from '@org/angular-utils';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { AuthService } from '../auth.service';
import { WorkspaceService } from '../workspace.service';

interface AuthState {
  profile: UserProfileDto | null;
  workspace: WorkspaceStatusDto | null;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>({
    profile: null,
    workspace: null,
  }),

  withComputed((state) => ({
    authenticated: computed(() => !!state.profile()),
    permissions: computed(() => state.profile()?.permissions ?? []),
    canWrite: computed(() => state.profile()?.permissions?.includes(Permission.FileWrite) ?? false),
  })),

  partialStore.withLoading(),
  partialStore.withRouting(),
  partialStore.withBrowserStorage({ key: 'auth' }),

  withProps(() => ({
    authService: inject(AuthService),
    workspaceService: inject(WorkspaceService),
    socketService: inject(sockets.SocketService),
  })),

  withMethods((state) => ({
    getLoginInfo() {
      if (state.profile()) {
        return of(true);
      }

      state.setLoading(true, '');
      return state.authService.getLoginInfo().pipe(
        tap((profile) => {
          if (profile) {
            state.saveToStorage({ profile });
          }
          state.setLoading(false);
        }),
        map((profile) => !!profile),
        catchError(() => {
          patchState(state, { profile: null });
          state.setLoading(false);
          return of(false);
        }),
      );
    },

    guestLogin: rxMethod<void>(
      pipe(
        tap(() => state.setLoading(true, '')),
        switchMap(() =>
          state.authService
            .guestLogin()
            .pipe(
              switchMap((profile) =>
                state.workspaceService
                  .cloneDemoRepo()
                  .pipe(map((workspace) => ({ profile, workspace }))),
              ),
            ),
        ),
        tap({
          next: ({ profile, workspace }) => {
            state.saveToStorage({ profile, workspace });
            state.setLoading(false);
            state.navigate(AppRoutes.ide.root);
          },
          error: () => state.setLoading(false, 'Failed to start guest session'),
        }),
      ),
    ),

    cloneRepo: rxMethod<string>(
      pipe(
        tap(() => state.setLoading(true, '')),
        switchMap((repoUrl) => state.workspaceService.cloneRepo(repoUrl)),
        tap({
          next: (workspace) => {
            state.saveToStorage({ workspace });
            state.setLoading(false);
            state.navigate(AppRoutes.ide.root);
          },
          error: () =>
            state.setLoading(false, 'Failed to clone repository. Check the URL and try again.'),
        }),
      ),
    ),

    logout: rxMethod<void>(
      pipe(
        tap(() => state.socketService.disconnect()),
        switchMap(() => state.authService.logout().pipe(catchError(() => of(void 0)))),
        tap(() => {
          partialStore.clearBrowserStorage();
          state.navigate(AppRoutes.login);
          window.location.reload();
        }),
      ),
    ),

    githubAuthUrl(): string {
      return state.authService.getGithubAuthUrl();
    },
  })),

  withHooks({
    onInit(store) {
      store.loadFromStorage();
    },
  }),
);
