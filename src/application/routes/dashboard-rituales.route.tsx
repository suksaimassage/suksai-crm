import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

function RitualesErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="rituales" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardRitualesRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/rituales',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'rituales')) {
      throw new ForbiddenError('rituales', user?.roles ?? []);
    }
  },
  errorComponent: RitualesErrorComponent,
  component: lazyRouteComponent(() => import('@infra/pages/RitualesPage'), 'RitualesPage'),
});
