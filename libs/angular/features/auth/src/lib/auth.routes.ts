import { Route } from '@angular/router';
import { loginGuard } from './guards/login.guard';

export const authRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
        canActivate: [loginGuard],
      },
      {
        path: 'cv',
        loadComponent: () => import('./resume/resume.component').then((m) => m.ResumeComponent),
      },
      {
        path: 'docs',
        loadComponent: () => import('./docs/docs.component').then((m) => m.DocsComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];

export const cloneRepoRoute: Route = {
  path: 'clone-repo',
  loadComponent: () =>
    import('./clone-repo/clone-repo.component').then((m) => m.CloneRepoComponent),
};
