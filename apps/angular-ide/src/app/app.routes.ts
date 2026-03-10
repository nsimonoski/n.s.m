import { Route } from '@angular/router';
import { authRoutes, authGuard } from '@org/angular-auth';
import { fileExplorerCoreRoutes } from '@org/angular-file-explorer-core';
import { IdeShellComponent } from './ide-shell/ide-shell.component';

export const appRoutes: Route[] = [
  ...authRoutes,
  {
    path: 'ide',
    canActivate: [authGuard],
    children: [
      {
        path: 'clone-repo',
        loadComponent: () =>
          import('@org/angular-auth').then((m) => m.CloneRepoComponent),
      },
      {
        path: '',
        component: IdeShellComponent,
        children: fileExplorerCoreRoutes,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
