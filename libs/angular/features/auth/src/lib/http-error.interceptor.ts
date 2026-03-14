import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import { IdeStore } from '@org/angular-data-access';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);
  const authStore = inject(IdeStore.AuthStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/logout')) {
        snackbar.error('Session expired. Logging out...');
        authStore.logout();
      }
      if (error.status === 403) {
        snackbar.error(error.error?.message ?? 'Insufficient permissions');
      }
      return throwError(() => error);
    }),
  );
};
