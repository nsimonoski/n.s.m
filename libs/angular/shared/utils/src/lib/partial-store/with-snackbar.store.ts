import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, pipe, tap } from 'rxjs';

export const withSnackbar = () =>
  signalStoreFeature(
    withState<{ showSnackbar: boolean; message: string }>({
      showSnackbar: false,
      message: '',
    }),
    withMethods((state) => {
      return {
        showSnackBar: rxMethod<string>(
          pipe(
            tap((message) =>
              patchState(state, { showSnackbar: true, message })
            ),
            debounceTime(1500),
            tap(() => patchState(state, { showSnackbar: false, message: '' }))
          )
        ),
      };
    })
  );
