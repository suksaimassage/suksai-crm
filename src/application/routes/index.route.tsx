import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useUserStore } from '@app/stores/useUserStore';
import { BootstrapSplash } from '@infra/components/ui/shared/BootstrapSplash';
import { rootRoute } from './root.route';

const AuthGateway = () => {
  const navigate = useNavigate();
  const status = useUserStore((s) => s.status);

  useEffect(() => {
    if (status === 'authenticated') {
      void navigate({ to: '/dashboard', replace: true });
    } else if (status === 'unauthenticated') {
      void navigate({ to: '/login', replace: true });
    }
  }, [status, navigate]);

  return <BootstrapSplash />;
};

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { status } = useUserStore.getState();
    if (status === 'idle' || status === 'loading') return;
    if (status === 'authenticated') {
      throw redirect({ to: '/dashboard' });
    }
    throw redirect({ to: '/login' });
  },
  component: AuthGateway,
});
