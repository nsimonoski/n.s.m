import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

export const withDialog = () =>
  signalStoreFeature(
    withState<{
      dialogOpen: boolean;
      dialogTitle: string;
      dialogMessage: string;
      dialogData: unknown;
    }>({
      dialogOpen: false,
      dialogTitle: '',
      dialogMessage: '',
      dialogData: null,
    }),
    withMethods((state) => ({
      openDialog(title: string, message: string, data?: unknown): void {
        patchState(state, {
          dialogOpen: true,
          dialogTitle: title,
          dialogMessage: message,
          dialogData: data ?? null,
        });
      },
      closeDialog(): void {
        patchState(state, {
          dialogOpen: false,
          dialogTitle: '',
          dialogMessage: '',
          dialogData: null,
        });
      },
    })),
  );
