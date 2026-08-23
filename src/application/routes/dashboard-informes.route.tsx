import React, { Suspense } from 'react';
import { createRoute } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

const LazyPlaceholderPage = React.lazy(() =>
  import('@infra/pages/PlaceholderPage/PlaceholderPage').then((m) => ({
    default: () => <m.PlaceholderPage labelKey="informes" />,
  })),
);

function InformesErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="informes" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardInformesRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/informes',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'informes')) {
      throw new ForbiddenError('informes', user?.roles ?? []);
    }
  },
  errorComponent: InformesErrorComponent,
  component: () => (
    <Suspense>
      <LazyPlaceholderPage />
    </Suspense>
  ),
});
