/**
 * RoutePermissionService.test.ts
 *
 * Pure unit tests — no mocking required.
 * RoutePermissionService has zero external dependencies; it operates solely on
 * the in-memory ROUTE_PERMISSIONS constant and two deterministic functions.
 *
 * Roles (live DB): superadmin | masajista | recepcionista
 *
 * Test goals:
 *   - canAccess: verify every role × route combination in the permission matrix
 *   - canAccess: boundary conditions — empty roles, unknown overlap, multi-role OR semantics
 *   - getAllowedRouteIds: verify the complete allowed set per role profile
 *   - getAllowedRouteIds: multi-role OR semantics (union, not intersection)
 *   - ROUTE_PERMISSIONS: verify shape completeness (all 9 routes present)
 */

import { describe, it, expect } from 'vitest';
import { RoutePermissionService } from '@domain/services/RoutePermissionService';
import type { TDashboardRouteId, TNombreRol } from '@domain/types';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const ALL_ROUTES: readonly TDashboardRouteId[] = [
  'overview',
  'agenda',
  'clientes',
  'rituales',
  'terapeutas',
  'caja',
  'informes',
  'ajustes',
  'centros',
];

// ── ROUTE_PERMISSIONS shape ────────────────────────────────────────────────────

describe('RoutePermissionService.ROUTE_PERMISSIONS', () => {
  it('contains exactly 9 route entries', () => {
    expect(Object.keys(RoutePermissionService.ROUTE_PERMISSIONS)).toHaveLength(9);
  });

  it.each(ALL_ROUTES)('contains route "%s"', (routeId) => {
    expect(RoutePermissionService.ROUTE_PERMISSIONS).toHaveProperty(routeId);
  });

  it('each route maps to a non-empty array of roles', () => {
    for (const routeId of ALL_ROUTES) {
      const roles = RoutePermissionService.ROUTE_PERMISSIONS[routeId];
      expect(roles.length).toBeGreaterThan(0);
    }
  });
});

// ── canAccess — superadmin ─────────────────────────────────────────────────────

describe('RoutePermissionService.canAccess — superadmin', () => {
  const roles: readonly TNombreRol[] = ['superadmin'];

  it.each(ALL_ROUTES)('grants access to "%s"', (routeId) => {
    expect(RoutePermissionService.canAccess(roles, routeId)).toBe(true);
  });
});

// ── canAccess — recepcionista ─────────────────────────────────────────────────

describe('RoutePermissionService.canAccess — recepcionista', () => {
  const roles: readonly TNombreRol[] = ['recepcionista'];

  it.each([
    ['overview', true],
    ['agenda', true],
    ['clientes', true],
    ['rituales', false],
    ['terapeutas', false],
    ['caja', false],
    ['informes', false],
    ['ajustes', false],
    ['centros', true],
  ] as [TDashboardRouteId, boolean][])('returns %s for route "%s"', (routeId, expected) => {
    expect(RoutePermissionService.canAccess(roles, routeId)).toBe(expected);
  });
});

// ── canAccess — masajista ─────────────────────────────────────────────────────

describe('RoutePermissionService.canAccess — masajista', () => {
  const roles: readonly TNombreRol[] = ['masajista'];

  it.each([
    ['overview', true],
    ['agenda', true],
    ['clientes', false],
    ['rituales', false],
    ['terapeutas', false],
    ['caja', false],
    ['informes', false],
    ['ajustes', false],
    ['centros', false],
  ] as [TDashboardRouteId, boolean][])('returns %s for route "%s"', (routeId, expected) => {
    expect(RoutePermissionService.canAccess(roles, routeId)).toBe(expected);
  });
});

// ── canAccess — empty roles ───────────────────────────────────────────────────

describe('RoutePermissionService.canAccess — empty roles array', () => {
  it.each(ALL_ROUTES)('denies access to "%s" when roles is []', (routeId) => {
    expect(RoutePermissionService.canAccess([], routeId)).toBe(false);
  });
});

// ── canAccess — multi-role OR semantics ───────────────────────────────────────

describe('RoutePermissionService.canAccess — multi-role OR semantics', () => {
  it('grants access to clientes when roles includes recepcionista alongside masajista', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'recepcionista'];
    expect(RoutePermissionService.canAccess(roles, 'clientes')).toBe(true);
  });

  it('grants access to rituales when roles includes superadmin alongside masajista', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'superadmin'];
    expect(RoutePermissionService.canAccess(roles, 'rituales')).toBe(true);
  });

  it('grants access to ajustes when roles includes superadmin alongside recepcionista', () => {
    const roles: readonly TNombreRol[] = ['recepcionista', 'superadmin'];
    expect(RoutePermissionService.canAccess(roles, 'ajustes')).toBe(true);
  });

  it('denies access to caja for masajista+recepcionista (neither holds permission)', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'recepcionista'];
    expect(RoutePermissionService.canAccess(roles, 'caja')).toBe(false);
  });
});

// ── getAllowedRouteIds — superadmin ────────────────────────────────────────────

describe('RoutePermissionService.getAllowedRouteIds — superadmin', () => {
  it('returns all 9 routes', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['superadmin']);
    expect(result).toHaveLength(9);
    for (const routeId of ALL_ROUTES) {
      expect(result).toContain(routeId);
    }
  });
});

// ── getAllowedRouteIds — recepcionista ─────────────────────────────────────────

describe('RoutePermissionService.getAllowedRouteIds — recepcionista', () => {
  it('returns exactly overview, agenda, clientes, centros', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['recepcionista']);
    expect(result).toHaveLength(4);
    expect(result).toContain('overview');
    expect(result).toContain('agenda');
    expect(result).toContain('clientes');
    expect(result).toContain('centros');
  });

  it('does not include restricted routes', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['recepcionista']);
    for (const restricted of [
      'rituales',
      'terapeutas',
      'caja',
      'informes',
      'ajustes',
    ] as TDashboardRouteId[]) {
      expect(result).not.toContain(restricted);
    }
  });
});

// ── getAllowedRouteIds — masajista ─────────────────────────────────────────────

describe('RoutePermissionService.getAllowedRouteIds — masajista', () => {
  it('returns exactly overview and agenda', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['masajista']);
    expect(result).toHaveLength(2);
    expect(result).toContain('overview');
    expect(result).toContain('agenda');
  });

  it('does not include any management routes', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['masajista']);
    for (const restricted of [
      'clientes',
      'rituales',
      'terapeutas',
      'caja',
      'informes',
      'ajustes',
      'centros',
    ] as TDashboardRouteId[]) {
      expect(result).not.toContain(restricted);
    }
  });
});

// ── getAllowedRouteIds — empty roles ──────────────────────────────────────────

describe('RoutePermissionService.getAllowedRouteIds — empty roles array', () => {
  it('returns an empty array', () => {
    expect(RoutePermissionService.getAllowedRouteIds([])).toHaveLength(0);
  });
});

// ── getAllowedRouteIds — multi-role union ─────────────────────────────────────

describe('RoutePermissionService.getAllowedRouteIds — multi-role union (OR semantics)', () => {
  it('masajista+recepcionista yields union: overview, agenda, clientes, centros', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['masajista', 'recepcionista']);
    expect(result).toHaveLength(4);
    expect(result).toContain('overview');
    expect(result).toContain('agenda');
    expect(result).toContain('clientes');
    expect(result).toContain('centros');
  });

  it('masajista+superadmin yields all 9 routes (superadmin covers everything)', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['masajista', 'superadmin']);
    expect(result).toHaveLength(9);
  });

  it('recepcionista+superadmin yields all 9 routes (superadmin covers everything)', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['recepcionista', 'superadmin']);
    expect(result).toHaveLength(9);
  });

  it('does not produce duplicate route entries for overlapping roles', () => {
    const result = RoutePermissionService.getAllowedRouteIds(['superadmin', 'recepcionista']);
    const uniqueResult = [...new Set(result)];
    expect(result).toHaveLength(uniqueResult.length);
  });
});
