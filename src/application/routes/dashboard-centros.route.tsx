import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

function CentrosErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="centros" fallbackPath="/login" />;
  }
  throw error;
}

export const dashboardCentrosRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/centros',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'centros')) {
      throw new ForbiddenError('centros', user?.roles ?? []);
    }
  },
  errorComponent: CentrosErrorComponent,
  component: lazyRouteComponent(() => import('@infra/pages/CentrosPage'), 'CentrosPage'),
});
