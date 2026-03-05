import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import { appRoutes } from './app.routes';

const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        snackbar.error(error.error?.message ?? 'Insufficient permissions');
      }
      return throwError(() => error);
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
  ],
};
