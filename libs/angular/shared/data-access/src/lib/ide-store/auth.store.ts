import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
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
        tap((session) => {
          if (session) {
            patchState(state, { profile: session.profile, workspace: session.workspace });
          }
          state.setLoading(false);
        }),
        map((session) => !!session),
        catchError(() => {
          patchState(state, { profile: null, workspace: null });
          state.setLoading(false);
          return of(false);
        }),
      );
    },

    guestLogin: rxMethod<void>(
      pipe(
        tap(() => state.setLoading(true, '')),
        switchMap(() =>
          state.authService.guestLogin().pipe(switchMap(() => state.authService.getLoginInfo())),
        ),
        tap({
          next: (session) => {
            if (session) {
              patchState(state, { profile: session.profile, workspace: session.workspace });
            }
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
            patchState(state, { workspace });
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
          window.location.href = AppRoutes.login;
        }),
      ),
    ),

    githubAuthUrl(): string {
      return state.authService.getGithubAuthUrl();
    },
  })),
);
