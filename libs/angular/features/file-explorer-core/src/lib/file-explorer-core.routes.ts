import { Route } from '@angular/router';

export const fileExplorerCoreRoutes: Route[] = [
  {
    path: 'explorer',
    loadComponent: () => import('@org/angular-file-explorer').then((m) => m.FileExplorerComponent),
  },
  {
    path: 'git',
    loadComponent: () =>
      import('@org/angular-file-explorer-git').then((m) => m.FileExplorerGitComponent),
  },
  { path: '', redirectTo: 'explorer', pathMatch: 'full' },
];
