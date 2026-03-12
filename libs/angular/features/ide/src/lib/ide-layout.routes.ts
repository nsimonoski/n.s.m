import { Route } from '@angular/router';

export const ideLayoutRoutes: Route[] = [
  {
    path: 'explorer',
    loadComponent: () => import('@org/angular-file-explorer').then((m) => m.FileExplorerComponent),
  },
  {
    path: 'git',
    loadComponent: () =>
      import('@org/angular-file-explorer-git').then((m) => m.FileExplorerGitComponent),
  },
  {
    path: 'ai',
    loadComponent: () => import('@org/angular-ai-chat').then((m) => m.AiChatComponent),
  },
  { path: '', redirectTo: 'explorer', pathMatch: 'full' },
];
