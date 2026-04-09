import { inject } from '@angular/core';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { SnackbarService } from './snackbar.service';

export const withSnackbar = () =>
  signalStoreFeature(
    withProps(() => ({
      _snackbar: inject(SnackbarService),
    })),
    withMethods((store) => ({
      showSuccess(message?: string, duration?: number): void {
        store._snackbar.success(message, duration);
      },
      showError(message?: string, duration?: number): void {
        store._snackbar.error(message, duration);
      },
      showInfo(message?: string, duration?: number): void {
        store._snackbar.info(message, duration);
      },
      dismissSnackbar(): void {
        store._snackbar.dismiss();
      },
    })),
  );
