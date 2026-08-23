import type { TNombreRol } from '@domain/types';

const MANAGEMENT_ROLES = new Set<TNombreRol>(['superadmin', 'recepcionista']);

export function getRoleHomePath(roles: readonly TNombreRol[]): string {
  if (roles.some((r) => MANAGEMENT_ROLES.has(r))) {
    return '/dashboard/overview';
  }
  return '/dashboard/agenda';
}
