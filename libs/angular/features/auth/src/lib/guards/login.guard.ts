import { inject } from '@angular/core';
import { type CanActivateFn } from '@angular/router';
import { IdeStore } from '@org/angular-data-access';
import { AppRoutes } from '@org/shared/utils';

export const loginGuard: CanActivateFn = () => {
  const authStore = inject(IdeStore.AuthStore);

  return authStore.profile()
    ? authStore.router.createUrlTree([AppRoutes.ide.root])
    : true;
};
