import { Route } from '@angular/router';
import { authRoutes, authGuard, cloneRepoRoute } from '@org/angular-auth';
import { ideLayoutRoutes } from '@org/angular-ide';
import { IdeShellComponent } from './ide-shell/ide-shell.component';

export const appRoutes: Route[] = [
  ...authRoutes,
  {
    path: 'ide',
    canActivate: [authGuard],
    children: [
      cloneRepoRoute,
      {
        path: '',
        component: IdeShellComponent,
        children: ideLayoutRoutes,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
