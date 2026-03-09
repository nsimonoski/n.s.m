import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { ActivatedRoute, Data, NavigationEnd, Params, Router } from '@angular/router';
import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export const withRouting = () =>
  signalStoreFeature(
    withProps(() => {
      const router = inject(Router);
      const activatedRoute = inject(ActivatedRoute);

      const navigationEnd$ = router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
      );

      const currentUrl = toSignal(
        navigationEnd$.pipe(map((event) => event.urlAfterRedirects)),
        { initialValue: router.url },
      );

      const queryParams = toSignal(
        navigationEnd$.pipe(map(() => activatedRoute.snapshot.queryParams)),
        { initialValue: activatedRoute.snapshot.queryParams },
      );

      return { router, activatedRoute, navigationEnd$, currentUrl, queryParams };
    }),
    withMethods(({ router, activatedRoute }) => ({
      navigate(route: string): void {
        router.navigateByUrl(route);
      },
      openInNewTab(route: string, queryParams?: Record<string, unknown>): void {
        const urlTree = router.createUrlTree([route], { queryParams });
        const url = router.serializeUrl(urlTree);
        window.open(url, '_blank');
      },
      getRouteParams(): Params {
        return activatedRoute.snapshot.params;
      },
      getQueryParams(): Params {
        return activatedRoute.snapshot.queryParams;
      },
      getRouteData(): Data {
        return activatedRoute.snapshot.data;
      },
    })),
  );
