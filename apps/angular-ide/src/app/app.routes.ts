import { Route } from '@angular/router';
import { authRoutes, authGuard } from '@org/angular-auth';
import { fileExplorerCoreRoutes } from '@org/angular-file-explorer-core';
import { IdeShellComponent } from './ide-shell/ide-shell.component';

export const appRoutes: Route[] = [
  ...authRoutes,
  {
    path: 'ide',
    component: IdeShellComponent,
    canActivate: [authGuard],
    children: fileExplorerCoreRoutes,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
