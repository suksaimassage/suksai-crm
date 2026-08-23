import type { TDashboardRouteId, TNombreRol } from '../types';

const ROUTE_PERMISSIONS: Record<TDashboardRouteId, readonly TNombreRol[]> = {
  overview: ['superadmin', 'recepcionista', 'masajista'],
  agenda: ['superadmin', 'recepcionista', 'masajista'],
  clientes: ['superadmin', 'recepcionista'],
  rituales: ['superadmin'],
  terapeutas: ['superadmin'],
  caja: ['superadmin'],
  informes: ['superadmin'],
  ajustes: ['superadmin'],
  centros: ['superadmin', 'recepcionista'],
} as const;

function canAccess(roles: readonly TNombreRol[], routeId: TDashboardRouteId): boolean {
  const allowed = ROUTE_PERMISSIONS[routeId];
  return roles.some((role) => (allowed as readonly string[]).includes(role));
}

function getAllowedRouteIds(roles: readonly TNombreRol[]): readonly TDashboardRouteId[] {
  return (Object.keys(ROUTE_PERMISSIONS) as TDashboardRouteId[]).filter((routeId) =>
    canAccess(roles, routeId),
  );
}

export const RoutePermissionService = {
  ROUTE_PERMISSIONS,
  canAccess,
  getAllowedRouteIds,
} as const;
