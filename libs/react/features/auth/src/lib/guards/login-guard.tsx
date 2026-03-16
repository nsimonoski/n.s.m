import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@org/react-data-access';

interface LoginGuardProps {
  children: ReactNode;
}

export function LoginGuard({ children }: LoginGuardProps) {
  const profile = useAuthStore((s) => s.profile);
  const getLoginInfo = useAuthStore((s) => s.getLoginInfo);
  const [checking, setChecking] = useState(!profile);

  useEffect(() => {
    if (!profile) {
      getLoginInfo().then(() => setChecking(false));
    }
  }, [profile, getLoginInfo]);

  if (checking) return null;
  if (profile) return <Navigate to="/ide" replace />;

  return <>{children}</>;
}
