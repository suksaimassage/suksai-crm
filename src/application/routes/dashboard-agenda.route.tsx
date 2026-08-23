import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { z } from 'zod';
import { dashboardRoute } from './dashboard.route';
import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import { ForbiddenError } from '@domain/types';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized';

const agendaSearchSchema = z.object({
  clienteId: z.coerce.number().int().positive().optional(),
});

function AgendaErrorComponent({ error }: { error: unknown }) {
  if (error instanceof ForbiddenError) {
    return <Unauthorized routeKey="agenda" fallbackPath="/dashboard/overview" />;
  }
  throw error;
}

export const dashboardAgendaRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/agenda',
  validateSearch: agendaSearchSchema,
  beforeLoad: () => {
    const { user } = useUserStore.getState();
    if (user === null || !RoutePermissionService.canAccess(user.roles, 'agenda')) {
      throw new ForbiddenError('agenda', user?.roles ?? []);
    }
  },
  errorComponent: AgendaErrorComponent,
  component: lazyRouteComponent(() => import('@infra/pages/AgendaPage'), 'AgendaPage'),
});
