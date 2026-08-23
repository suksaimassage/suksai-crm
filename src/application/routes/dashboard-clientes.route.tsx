import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

function ClientesErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="clientes" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardClientesRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/clientes',
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'clientes')) {
      throw new ForbiddenError('clientes', user?.roles ?? []);
    }
  },
  errorComponent: ClientesErrorComponent,
  component: lazyRouteComponent(() => import('@infra/pages/ClientesPage'), 'ClientesPage'),
});
