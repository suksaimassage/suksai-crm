import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

function TerapeutasErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="terapeutas" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardTerapeutasRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/terapeutas',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'terapeutas')) {
      throw new ForbiddenError('terapeutas', user?.roles ?? []);
    }
  },
  errorComponent: TerapeutasErrorComponent,
  component: lazyRouteComponent(() => import('@infra/pages/TerapeutasPage'), 'TerapeutasPage'),
});
