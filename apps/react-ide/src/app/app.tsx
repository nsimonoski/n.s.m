import { BrowserRouter, useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { authRoutes, cloneRepoRoute, catchAllRoute, AuthGuard } from '@org/react-auth';
import { IdeShell } from './ide-shell';
import './app.scss';

const appRoutes: RouteObject[] = [
  ...authRoutes,
  {
    path: 'ide',
    children: [
      cloneRepoRoute,
      {
        path: '',
        element: (
          <AuthGuard requireWorkspace>
            <IdeShell />
          </AuthGuard>
        ),
      },
    ],
  },
  catchAllRoute,
];

function AppRoutes() {
  return useRoutes(appRoutes);
}

export function App() {
  return (
    <BrowserRouter basename="/react">
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
