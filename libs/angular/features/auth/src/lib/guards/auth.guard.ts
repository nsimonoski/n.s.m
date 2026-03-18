import { inject } from '@angular/core';
import { type CanActivateFn, UrlTree } from '@angular/router';
import { IdeStore } from '@org/angular-data-access';
import { AppRoutes } from '@org/shared/utils';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(IdeStore.AuthStore);

  const resolveRoute = (): boolean | UrlTree => {
    const isCloneRepoPage = state.url.startsWith(AppRoutes.ide.cloneRepo);

    if (isCloneRepoPage || authStore.workspace()?.ready) {
      return true;
    }

    return authStore.router.createUrlTree([AppRoutes.ide.cloneRepo]);
  };

  if (authStore.profile()) {
    return resolveRoute();
  }

  return authStore.getLoginInfo().pipe(
    map((hasSession) => {
      if (!hasSession) {
        return authStore.router.createUrlTree([AppRoutes.login]);
      }
      return resolveRoute();
    }),
  );
};
