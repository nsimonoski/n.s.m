import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@org/react-data-access';

interface AuthGuardProps {
  children: ReactNode;
  requireWorkspace?: boolean;
}

export function AuthGuard({ children, requireWorkspace }: AuthGuardProps) {
  const profile = useAuthStore((s) => s.profile);
  const workspace = useAuthStore((s) => s.workspace);
  const getLoginInfo = useAuthStore((s) => s.getLoginInfo);
  const [checking, setChecking] = useState(!profile);

  useEffect(() => {
    if (!profile) {
      getLoginInfo().then(() => setChecking(false));
    }
  }, [profile, getLoginInfo]);

  if (checking) return null;
  if (!profile) return <Navigate to="/login" replace />;
  if (requireWorkspace && !workspace?.ready) return <Navigate to="/ide/clone-repo" replace />;

  return <>{children}</>;
}
