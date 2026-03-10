import { Route } from '@angular/router';
import { loginGuard } from './guards/login.guard';

export const authRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
  },
];
