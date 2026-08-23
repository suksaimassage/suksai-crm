/**
 * useUsuarioCentroAssignments.test.tsx
 *
 * The hook reads a usuario's ACTIVE centro assignments and derives which one is
 * principal from the `esPrincipal` flag the adapter already returns (single
 * query, no extra round-trip).
 *
 * Contract returned to the modal: { centroIds, principalCentroId }.
 *
 * Spec mapping:
 *   - §6 Performance: principal derived from the same query (no second fetch).
 *   - Recovered invariant (project_terapeutas_crud — tab-freeze fix): the empty/
 *     loading state MUST return a stable module-level sentinel — never a new []
 *     each render — or the modal's useEffect loops infinitely. Asserted directly.
 *   - Edge E18/E22: legacy rows with no principal → principalCentroId null;
 *     the modal handles the legacy default, not this hook.
 *
 * Mock strategy: SupabaseUsuarioCentroAdapter is class-mocked at module level so
 * findByUsuario never hits the network. We assert the hook's derivation +
 * returned contract, not Supabase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { IUsuarioCentro } from '@domain/models';

// ── Adapter mock (must precede hook import) ──────────────────────────────────

const mockFindByUsuario = vi.fn();

vi.mock('@infra/adapters/SupabaseUsuarioCentroAdapter', () => ({
  SupabaseUsuarioCentroAdapter: class {
    findByUsuario = (...a: unknown[]): unknown => mockFindByUsuario(...a);
  },
}));

import { useUsuarioCentroAssignments } from './useUsuarioCentroAssignments';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeAssignment(centroId: number, esPrincipal: boolean): IUsuarioCentro {
  return {
    usuarioId: 5,
    centroId,
    esPrincipal,
    activo: true,
    assignedAt: new Date('2024-02-01T00:00:00Z'),
  };
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Success: centroIds + principal derivation ─────────────────────────────────

describe('useUsuarioCentroAssignments — success path', () => {
  it('returns centroIds in row order', async () => {
    mockFindByUsuario.mockResolvedValue([
      makeAssignment(10, false),
      makeAssignment(20, true),
      makeAssignment(30, false),
    ]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsuarioCentroAssignments(5, true), { wrapper });

    await waitFor(() => {
      expect(result.current.centroIds).toEqual([10, 20, 30]);
    });
  });

  it('derives principalCentroId from the esPrincipal=true row', async () => {
    mockFindByUsuario.mockResolvedValue([makeAssignment(10, false), makeAssignment(20, true)]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsuarioCentroAssignments(5, true), { wrapper });

    await waitFor(() => {
      expect(result.current.principalCentroId).toBe(20);
    });
  });

  it('passes the usuarioId through to the adapter', async () => {
    mockFindByUsuario.mockResolvedValue([makeAssignment(10, true)]);
    const { wrapper } = setup();
    renderHook(() => useUsuarioCentroAssignments(42, true), { wrapper });

    await waitFor(() => {
      expect(mockFindByUsuario).toHaveBeenCalledWith(42);
    });
  });

  it('returns principalCentroId null when no row is flagged principal (legacy rows, E18)', async () => {
    mockFindByUsuario.mockResolvedValue([makeAssignment(10, false), makeAssignment(20, false)]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsuarioCentroAssignments(5, true), { wrapper });

    await waitFor(() => {
      expect(result.current.centroIds).toEqual([10, 20]);
    });
    expect(result.current.principalCentroId).toBeNull();
  });

  it('tolerates multiple es_principal rows by picking the first (E22 data integrity)', async () => {
    mockFindByUsuario.mockResolvedValue([makeAssignment(10, true), makeAssignment(20, true)]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsuarioCentroAssignments(5, true), { wrapper });

    await waitFor(() => {
      expect(result.current.principalCentroId).toBe(10);
    });
  });
});

// ── Stable sentinel (recovered tab-freeze invariant) ──────────────────────────

describe('useUsuarioCentroAssignments — stable empty sentinel', () => {
  it('returns a stable reference while data is undefined (disabled query)', () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(() => useUsuarioCentroAssignments(5, false), {
      wrapper,
    });

    const first = result.current;
    rerender();
    const second = result.current;

    // Identity equality is the whole point: a new {} or [] each render would
    // re-fire the modal's useEffect and reproduce the freeze.
    expect(second).toBe(first);
    expect(second.centroIds).toBe(first.centroIds);
  });

  it('empty state exposes empty centroIds and null principal', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsuarioCentroAssignments(5, false), { wrapper });

    expect(result.current.centroIds).toEqual([]);
    expect(result.current.principalCentroId).toBeNull();
  });
});

// ── Disabled query gating ──────────────────────────────────────────────────────

describe('useUsuarioCentroAssignments — query gating', () => {
  it('does NOT call the adapter when enabled is false', () => {
    const { wrapper } = setup();
    renderHook(() => useUsuarioCentroAssignments(5, false), { wrapper });
    expect(mockFindByUsuario).not.toHaveBeenCalled();
  });

  it('does NOT call the adapter when usuarioId is undefined even if enabled', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsuarioCentroAssignments(undefined, true), { wrapper });

    // A disabled query never fetches; the returned value stays the empty sentinel.
    expect(result.current.centroIds).toEqual([]);
    await waitFor(() => {
      expect(mockFindByUsuario).not.toHaveBeenCalled();
    });
  });
});
