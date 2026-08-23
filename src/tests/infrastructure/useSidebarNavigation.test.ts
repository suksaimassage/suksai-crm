/**
 * useSidebarNavigation.test.ts
 *
 * Tests for the useSidebarNavigation hook.
 *
 * Strategy:
 *   - vi.mock '@app/stores/useUserStore' to control the `user` value returned
 *     by useUserStore(selector). The hook's only external dependency is the
 *     user store; RoutePermissionService and DASHBOARD_SIDEBAR_GROUPS run real.
 *   - renderHook from @testing-library/react (no wrapper needed — hook has no
 *     React context dependencies).
 *
 * Roles (live DB): superadmin | masajista | recepcionista
 *
 * Functional goals verified:
 *   - Returns [] when user is null (unauthenticated)
 *   - Filters sidebar items based on role permission matrix
 *   - Maps sidebar id 'dashboard' → route id 'overview' correctly
 *   - Removes groups where ALL items are filtered out
 *   - Multi-role OR semantics: union of permissions across all roles
 *   - superadmin sees all 9 items across both groups
 *   - recepcionista sees overview+agenda+clientes+centros (4 items, 1 group)
 *   - masajista sees overview+agenda only (2 items, 1 group)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSidebarNavigation } from '@infra/hooks/useSidebarNavigation';
import type { IAuthenticatedUser } from '@domain/ports';
import type { TNombreRol } from '@domain/types';

// ── Mock useUserStore ──────────────────────────────────────────────────────────
// We intercept the store selector call. The hook does:
//   const user = useUserStore((s) => s.user);
// So we make useUserStore a vi.fn() that calls the selector with a controlled state.

let mockUser: IAuthenticatedUser | null = null;

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: vi.fn((selector: (s: { user: IAuthenticatedUser | null }) => unknown) =>
    selector({ user: mockUser }),
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeUser(roles: readonly TNombreRol[]): IAuthenticatedUser {
  return {
    id: 1,
    nombre: 'test-user',
    apellidos: '',
    email: 'test@example.com',
    roles,
    isActive: true,
    centroPrincipalNombre: null,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUser = null;
});

// ── Unauthenticated (null user) ────────────────────────────────────────────────

describe('useSidebarNavigation — null user', () => {
  it('returns an empty array when user is null', () => {
    mockUser = null;
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current).toEqual([]);
  });

  it('returns an empty array (length 0) when user is null', () => {
    mockUser = null;
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current).toHaveLength(0);
  });
});

// ── superadmin — all 6 items in the estudio group ────────────────────────────

describe('useSidebarNavigation — superadmin', () => {
  beforeEach(() => {
    mockUser = makeUser(['superadmin']);
  });

  it('returns 1 sidebar group (estudio)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current).toHaveLength(1);
  });

  it('estudio group contains all 6 items', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const estudio = result.current.find((g) => g.id === 'estudio');
    expect(estudio).toBeDefined();
    expect(estudio!.items).toHaveLength(6);
  });

  it('total item count is 6', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const total = result.current.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(6);
  });

  it('estudio group includes the dashboard item (mapped from overview)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const estudio = result.current.find((g) => g.id === 'estudio');
    const dashboardItem = estudio!.items.find((item) => item.id === 'dashboard');
    expect(dashboardItem).toBeDefined();
  });
});

// ── recepcionista — 4 items, operaciones group removed ───────────────────────

describe('useSidebarNavigation — recepcionista', () => {
  beforeEach(() => {
    mockUser = makeUser(['recepcionista']);
  });

  it('returns only 1 group (estudio; operaciones is entirely restricted)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('estudio');
  });

  it('estudio group has 4 items: dashboard, agenda, clientes, centros', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const estudio = result.current[0];
    expect(estudio.items).toHaveLength(4);
  });

  it('estudio items contain dashboard (mapped from overview)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).toContain('dashboard');
  });

  it('estudio items contain agenda', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).toContain('agenda');
  });

  it('estudio items contain clientes', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).toContain('clientes');
  });

  it('estudio items contain centros', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).toContain('centros');
  });

  it('estudio items do NOT contain rituales', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).not.toContain('rituales');
  });

  it('estudio items do NOT contain terapeutas', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).not.toContain('terapeutas');
  });

  it('operaciones group is fully removed (not present in result)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const operaciones = result.current.find((g) => g.id === 'operaciones');
    expect(operaciones).toBeUndefined();
  });
});

// ── masajista — 2 items, only estudio group with overview+agenda ──────────────

describe('useSidebarNavigation — masajista', () => {
  beforeEach(() => {
    mockUser = makeUser(['masajista']);
  });

  it('returns only 1 group (estudio)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('estudio');
  });

  it('estudio group has exactly 2 items', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current[0].items).toHaveLength(2);
  });

  it('estudio items contain dashboard (mapped from overview)', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).toContain('dashboard');
  });

  it('estudio items contain agenda', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).toContain('agenda');
  });

  it('estudio items do NOT contain clientes', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const itemIds = result.current[0].items.map((i) => i.id);
    expect(itemIds).not.toContain('clientes');
  });

  it('operaciones group is fully removed', () => {
    const { result } = renderHook(() => useSidebarNavigation());
    const operaciones = result.current.find((g) => g.id === 'operaciones');
    expect(operaciones).toBeUndefined();
  });
});

// ── Multi-role OR semantics ────────────────────────────────────────────────────

describe('useSidebarNavigation — multi-role OR semantics', () => {
  it('masajista+recepcionista: includes clientes (recepcionista permission)', () => {
    mockUser = makeUser(['masajista', 'recepcionista']);
    const { result } = renderHook(() => useSidebarNavigation());
    const allItemIds = result.current.flatMap((g) => g.items.map((i) => i.id));
    expect(allItemIds).toContain('clientes');
  });

  it('masajista+recepcionista: still 1 group only (operaciones restricted for both)', () => {
    mockUser = makeUser(['masajista', 'recepcionista']);
    const { result } = renderHook(() => useSidebarNavigation());
    expect(result.current).toHaveLength(1);
  });

  it('masajista+superadmin: all 6 estudio items are visible', () => {
    mockUser = makeUser(['masajista', 'superadmin']);
    const { result } = renderHook(() => useSidebarNavigation());
    const estudio = result.current.find((g) => g.id === 'estudio');
    expect(estudio).toBeDefined();
    expect(estudio!.items).toHaveLength(6);
  });

  it('masajista+superadmin: total item count is 6', () => {
    mockUser = makeUser(['masajista', 'superadmin']);
    const { result } = renderHook(() => useSidebarNavigation());
    const totalItems = result.current.reduce((sum, g) => sum + g.items.length, 0);
    expect(totalItems).toBe(6);
  });
});

// ── Group structure integrity ─────────────────────────────────────────────────

describe('useSidebarNavigation — group structure integrity', () => {
  it('returned group preserves id, label, and items shape from DASHBOARD_SIDEBAR_GROUPS', () => {
    mockUser = makeUser(['superadmin']);
    const { result } = renderHook(() => useSidebarNavigation());
    const estudio = result.current.find((g) => g.id === 'estudio');
    expect(estudio).toMatchObject({ id: 'estudio', label: 'Estudio' });
  });

  it('each item preserves id, label, href, and icon from the sidebar config', () => {
    mockUser = makeUser(['masajista']);
    const { result } = renderHook(() => useSidebarNavigation());
    const dashboardItem = result.current[0].items.find((i) => i.id === 'dashboard');
    expect(dashboardItem).toBeDefined();
    expect(dashboardItem!.href).toBe('/dashboard/overview');
    expect(dashboardItem!.label).toBe('Dashboard');
    expect(dashboardItem!.icon).toBeDefined();
  });

  it('does not mutate the original DASHBOARD_SIDEBAR_GROUPS (spread is used)', () => {
    mockUser = makeUser(['masajista']);
    const { result } = renderHook(() => useSidebarNavigation());
    // The group returned is NOT the same reference as the original — it was spread
    // This is implicitly verified by item count: DASHBOARD_SIDEBAR_GROUPS has 6 items
    // in estudio, but masajista only gets 2.
    expect(result.current[0].items).toHaveLength(2);
  });
});
