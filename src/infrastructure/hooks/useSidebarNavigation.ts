import { useUserStore } from '@app/stores/useUserStore';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import type { TDashboardRouteId } from '@domain/types';
import { DASHBOARD_SIDEBAR_GROUPS } from '@infra/pages/DashboardPage/Dashboard.sidebar';
import type { ISidebarGroup } from '@infra/components/ui/common/Sidebar';

// The sidebar config uses 'dashboard' as the item id but the permission
// matrix calls it 'overview'. This mapping resolves the discrepancy.
// Partial<Record<...>> so TS understands lookups may return undefined.
const SIDEBAR_ID_TO_ROUTE_ID: Partial<Record<string, TDashboardRouteId>> = {
  dashboard: 'overview',
  agenda: 'agenda',
  clientes: 'clientes',
  rituales: 'rituales',
  terapeutas: 'terapeutas',
  caja: 'caja',
  informes: 'informes',
  ajustes: 'ajustes',
  centros: 'centros',
};

export function useSidebarNavigation(): readonly ISidebarGroup[] {
  const user = useUserStore((s) => s.user);

  if (user === null) {
    return [];
  }

  const allowedRouteIds = RoutePermissionService.getAllowedRouteIds(user.roles);
  const allowedSet = new Set<TDashboardRouteId>(allowedRouteIds);

  const filteredGroups: ISidebarGroup[] = [];

  for (const group of DASHBOARD_SIDEBAR_GROUPS) {
    const allowedItems = group.items.filter((item) => {
      const routeId = SIDEBAR_ID_TO_ROUTE_ID[item.id];
      return routeId !== undefined && allowedSet.has(routeId);
    });

    if (allowedItems.length > 0) {
      filteredGroups.push({ ...group, items: allowedItems });
    }
  }

  return filteredGroups;
}
