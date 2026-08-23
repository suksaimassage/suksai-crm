import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

function OverviewErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="overview" fallbackPath="/login" />;
  }
  throw error;
}

export const dashboardOverviewRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/overview',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'overview')) {
      throw new ForbiddenError('overview', user?.roles ?? []);
    }
  },
  errorComponent: OverviewErrorComponent,
  component: lazyRouteComponent(
    () => import('@infra/pages/DashboardOverviewPage'),
    'DashboardOverviewPage',
  ),
});
