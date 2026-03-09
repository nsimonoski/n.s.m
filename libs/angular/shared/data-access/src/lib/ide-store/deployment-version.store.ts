import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { partialStore } from '@org/angular-utils';
import { filter, from, interval, pipe, startWith, switchMap, tap } from 'rxjs';

const FIVE_MINUTES = 5 * 60 * 1000;
const SNACKBAR_DELAY = 5000;

export const DeploymentVersionStore = signalStore(
  { providedIn: 'root' },

  withState<{ eTag: string | null; lastModified: string | null }>({
    eTag: null,
    lastModified: null,
  }),

  partialStore.withBrowserStorage({ key: 'deployment-version' }),
  partialStore.withSnackbar(),

  withMethods((state) => ({
    reloadIfNewVersion: rxMethod<void>(
      pipe(
        switchMap(() =>
          interval(FIVE_MINUTES).pipe(
            startWith(0),
            switchMap(() => from(fetch('/index.html', { method: 'HEAD' }))),
            tap((response) => {
              const eTag = response.headers.get('ETag');
              const lastModified = response.headers.get('Last-Modified');
              const oldETag = state.eTag();
              const oldLastModified = state.lastModified();

              const hasNewVersion =
                (oldETag && eTag !== oldETag) ||
                (oldLastModified && lastModified !== oldLastModified);

              state.saveToStorage({ eTag, lastModified });

              if (hasNewVersion) {
                state.showSnackBar('New version available. Reloading...');
                setTimeout(() => document.location.reload(), SNACKBAR_DELAY);
              }
            }),
          ),
        ),
      ),
    ),
  })),

  withHooks({
    onInit(state) {
      state.loadFromStorage();
      state.reloadIfNewVersion();
    },
  }),
);
