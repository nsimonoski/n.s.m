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
import { uiStore } from '@org/angular/ui';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, fromEvent, map, of, pipe, switchMap, tap } from 'rxjs';
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
  uiStore.withSnackbar(),

  withProps(() => ({
    authService: inject(AuthService),
    workspaceService: inject(WorkspaceService),
    ws: inject(sockets.WebSocketStore),
  })),

  withMethods((store) => ({
    getLoginInfo() {
      if (store.profile()) {
        return of(true);
      }

      store.setLoading(true, '');
      return store.authService.getLoginInfo().pipe(
        tap(({ success, data }) => {
          if (success && data) {
            store.saveToStorage({ profile: data });
          }
          store.setLoading(false);
        }),
        map(({ success, data }) => success && !!data),
      );
    },

    guestLogin: rxMethod<void>(
      pipe(
        tap(() => {
          store.setLoading(true, '');
          store.showInfo('Creating workspace...', 5000);
        }),
        switchMap(() => store.authService.guestLogin()),
        switchMap(({ success, data: profile }) => {
          if (!success) {
            store.setLoading(false, 'Failed to start guest session');
            return of(null);
          }
          return store.workspaceService.cloneDemoRepo().pipe(
            tap(({ success: cloneSuccess, data: workspace }) => {
              if (!cloneSuccess) {
                store.setLoading(false, 'Failed to start guest session');
                return;
              }
              store.saveToStorage({ profile, workspace });
              store.ws.reconnect();
              store.setLoading(false);
              store.dismissSnackbar();
              store.navigate(AppRoutes.ide.root);
            }),
          );
        }),
      ),
    ),

    cloneRepo: rxMethod<string>(
      pipe(
        tap(() => {
          store.setLoading(true, '');
          store.showInfo('Creating workspace...', 5000);
        }),
        switchMap((repoUrl) => store.workspaceService.cloneRepo(repoUrl)),
        tap(({ success, data }) => {
          if (!success) {
            store.setLoading(false, 'Failed to clone repository. Check the URL and try again.');
            return;
          }
          store.saveToStorage({ workspace: data });
          store.ws.reconnect();
          store.setLoading(false);
          store.dismissSnackbar();
          store.navigate(AppRoutes.ide.root);
        }),
      ),
    ),

    logout: rxMethod<void>(
      pipe(
        tap(() => {
          store.ws.disconnect();
          store.showInfo('Cleaning up workspace...', 25000);
        }),
        switchMap(() => store.authService.logout()),
        tap(() => {
          store.clearAllStorage(['ide-theme']);
          store.navigate(AppRoutes.login);
          store.dismissSnackbar();
          window.location.reload();
        }),
      ),
    ),

    syncAcrossTabs: rxMethod<void>(
      pipe(
        switchMap(() =>
          fromEvent<StorageEvent>(window, 'storage').pipe(
            filter((e) => e.key === 'auth' && e.newValue != null),
            map((e) => JSON.parse(e.newValue!) as Partial<AuthState>),
          ),
        ),
        tap((data) => {
          patchState(store, data);
          if (data.profile) {
            store.navigate(AppRoutes.ide.root);
          }
        }),
      ),
    ),

    githubAuthUrl(): string {
      return store.authService.getGithubAuthUrl();
    },
  })),

  withHooks({
    onInit(store) {
      store.loadFromStorage();
      store.syncAcrossTabs();
    },
  }),
);
