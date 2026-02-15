import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';

export const withLoading = () =>
  signalStoreFeature(
    withState<{ isLoading: boolean; errorMessage: string }>({
      isLoading: false,
      errorMessage: '',
    }),
    withMethods((state) => ({
      setLoading(isLoading = true, errorMessage?: string): void {
        patchState(state, { isLoading, errorMessage });
      },
    }))
  );
