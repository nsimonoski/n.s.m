import { Route } from '@angular/router';
import { authRoutes, authGuard } from '@org/angular-auth';
import { IdeShellComponent } from './ide-shell/ide-shell.component';

export const appRoutes: Route[] = [
  ...authRoutes,
  {
    path: 'ide',
    component: IdeShellComponent,
    canActivate: [authGuard],
    loadChildren: () =>
      import('@org/angular-file-explorer-core').then((m) => m.fileExplorerCoreRoutes),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
