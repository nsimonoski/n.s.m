import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Login } from './login/login';
import { CloneRepo } from './clone-repo/clone-repo';
import { AuthGuard } from './guards/auth-guard';
import { LoginGuard } from './guards/login-guard';

export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    element: (
      <LoginGuard>
        <Login />
      </LoginGuard>
    ),
  },
];

export const cloneRepoRoute: RouteObject = {
  path: 'clone-repo',
  element: (
    <AuthGuard>
      <CloneRepo />
    </AuthGuard>
  ),
};

export const catchAllRoute: RouteObject = {
  path: '*',
  element: <Navigate to="/login" replace />,
};
