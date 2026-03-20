import { computed, inject } from '@angular/core';
import {
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
import { map, of, pipe, switchMap, tap } from 'rxjs';
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
        tap(({ success, data }) => {
          if (success && data) {
            state.saveToStorage({ profile: data });
          }
          state.setLoading(false);
        }),
        map(({ success, data }) => success && !!data),
      );
    },

    guestLogin: rxMethod<void>(
      pipe(
        tap(() => state.setLoading(true, '')),
        switchMap(() => state.authService.guestLogin()),
        switchMap(({ success, data: profile }) => {
          if (!success) {
            state.setLoading(false, 'Failed to start guest session');
            return of(null);
          }
          return state.workspaceService.cloneDemoRepo().pipe(
            tap(({ success: cloneSuccess, data: workspace }) => {
              if (!cloneSuccess) {
                state.setLoading(false, 'Failed to start guest session');
                return;
              }
              state.saveToStorage({ profile, workspace });
              state.setLoading(false);
              state.navigate(AppRoutes.ide.root);
            }),
          );
        }),
      ),
    ),

    cloneRepo: rxMethod<string>(
      pipe(
        tap(() => state.setLoading(true, '')),
        switchMap((repoUrl) => state.workspaceService.cloneRepo(repoUrl)),
        tap(({ success, data }) => {
          if (!success) {
            state.setLoading(false, 'Failed to clone repository. Check the URL and try again.');
            return;
          }
          state.saveToStorage({ workspace: data });
          state.setLoading(false);
          state.navigate(AppRoutes.ide.root);
        }),
      ),
    ),

    logout: rxMethod<void>(
      pipe(
        tap(() => state.socketService.disconnect()),
        switchMap(() => state.authService.logout()),
        tap(() => {
          state.clearAllStorage(['ide-theme']);
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
