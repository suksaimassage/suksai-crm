import React, { Suspense } from 'react';
import { createRoute } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

const LazyPlaceholderPage = React.lazy(() =>
  import('@infra/pages/PlaceholderPage/PlaceholderPage').then((m) => ({
    default: () => <m.PlaceholderPage labelKey="ajustes" />,
  })),
);

function AjustesErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="ajustes" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardAjustesRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/ajustes',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'ajustes')) {
      throw new ForbiddenError('ajustes', user?.roles ?? []);
    }
  },
  errorComponent: AjustesErrorComponent,
  component: () => (
    <Suspense>
      <LazyPlaceholderPage />
    </Suspense>
  ),
});
