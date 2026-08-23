import React, { Suspense } from 'react';
import { createRoute } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

const LazyPlaceholderPage = React.lazy(() =>
  import('@infra/pages/PlaceholderPage/PlaceholderPage').then((m) => ({
    default: () => <m.PlaceholderPage labelKey="caja" />,
  })),
);

function CajaErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="caja" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardCajaRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/caja',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'caja')) {
      throw new ForbiddenError('caja', user?.roles ?? []);
    }
  },
  errorComponent: CajaErrorComponent,
  component: () => (
    <Suspense>
      <LazyPlaceholderPage />
    </Suspense>
  ),
});
