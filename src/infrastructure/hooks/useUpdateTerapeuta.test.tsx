/**
 * useUpdateTerapeuta.test.tsx
 *
 * The update-terapeuta mutation:
 *   1. updates the usuario (usuarioAdapter.update)
 *   2. diffs centroIds vs previousCentroIds → assign() the additions,
 *      unassign() the removals
 *   3. setPrincipal() AFTER the diff resolves — SKIPPED when principal is null.
 *
 * Spec mapping:
 *   - §7 / E20: setPrincipal runs after add/remove (a newly-added principal row
 *     must exist before its flag can flip).
 *   - E21: principal null → setPrincipal is NOT called (the just-removed row
 *     keeps a stale flag but is activo=false, which findPrincipalByUsuario ignores).
 *   - Recovered BUG-02: the diff uses previousCentroIds (distinct from centroIds);
 *     identical arrays produce zero assign/unassign calls.
 *   - Recovered cache rule: the hook OWNS invalidateQueries(['terapeutas']).
 *
 * Mock strategy: usuario + usuarioCentro adapters class-mocked. We assert
 * orchestration + cache ownership, not Supabase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mocks (must precede hook import) ─────────────────────────────────

const mockUpdate = vi.fn();
const mockAssign = vi.fn();
const mockUnassign = vi.fn();
const mockSetPrincipal = vi.fn();

vi.mock('@infra/adapters/SupabaseUsuarioAdapter', () => ({
  SupabaseUsuarioAdapter: class {
    update = (...a: unknown[]): unknown => mockUpdate(...a);
  },
}));

vi.mock('@infra/adapters/SupabaseUsuarioCentroAdapter', () => ({
  SupabaseUsuarioCentroAdapter: class {
    assign = (...a: unknown[]): unknown => mockAssign(...a);
    unassign = (...a: unknown[]): unknown => mockUnassign(...a);
    setPrincipal = (...a: unknown[]): unknown => mockSetPrincipal(...a);
  },
}));

import { useUpdateTerapeuta } from './useUpdateTerapeuta';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const UPDATED_USUARIO = { id: 10, nombre: 'Ana' };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue(UPDATED_USUARIO);
  mockAssign.mockResolvedValue(undefined);
  mockUnassign.mockResolvedValue(undefined);
  mockSetPrincipal.mockResolvedValue(undefined);
});

// ── Usuario update + centro diff ───────────────────────────────────────────────

describe('useUpdateTerapeuta — usuario + centro diff', () => {
  it('updates the usuario with the provided dto', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: { nombre: 'Ana', apellidos: 'Pérez' },
        centroIds: [1],
        previousCentroIds: [1],
        principalCentroId: 1,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith(10, { nombre: 'Ana', apellidos: 'Pérez' });
  });

  it('assigns only the added centros', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1, 2, 3], // 2 and 3 are new
        previousCentroIds: [1],
        principalCentroId: 1,
      });
    });

    expect(mockAssign).toHaveBeenCalledWith(10, 2);
    expect(mockAssign).toHaveBeenCalledWith(10, 3);
    expect(mockAssign).not.toHaveBeenCalledWith(10, 1);
  });

  it('unassigns only the removed centros', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1], // 2 removed
        previousCentroIds: [1, 2],
        principalCentroId: 1,
      });
    });

    expect(mockUnassign).toHaveBeenCalledWith(10, 2);
    expect(mockUnassign).not.toHaveBeenCalledWith(10, 1);
  });

  it('makes no assign/unassign calls when centroIds equals previousCentroIds (BUG-02)', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1, 2],
        previousCentroIds: [1, 2],
        principalCentroId: 1,
      });
    });

    expect(mockAssign).not.toHaveBeenCalled();
    expect(mockUnassign).not.toHaveBeenCalled();
  });
});

// ── setPrincipal ordering + skip (E20/E21) ─────────────────────────────────────

describe('useUpdateTerapeuta — setPrincipal handling', () => {
  it('calls setPrincipal with the chosen centro after the diff', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1, 2],
        previousCentroIds: [1, 2],
        principalCentroId: 2,
      });
    });

    expect(mockSetPrincipal).toHaveBeenCalledWith(10, 2);
  });

  it('runs assign for a newly-added principal BEFORE setPrincipal (E20 ordering)', async () => {
    const order: string[] = [];
    mockAssign.mockImplementation(() => {
      order.push('assign');
      return Promise.resolve(undefined);
    });
    mockSetPrincipal.mockImplementation(() => {
      order.push('setPrincipal');
      return Promise.resolve(undefined);
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1, 5], // 5 is newly added AND the principal
        previousCentroIds: [1],
        principalCentroId: 5,
      });
    });

    expect(order.indexOf('assign')).toBeLessThan(order.indexOf('setPrincipal'));
  });

  it('does NOT call setPrincipal when principalCentroId is null (E21)', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1],
        previousCentroIds: [1, 2],
        principalCentroId: null,
      });
    });

    expect(mockSetPrincipal).not.toHaveBeenCalled();
  });

  it('does NOT call setPrincipal when principalCentroId is omitted (undefined)', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1],
        previousCentroIds: [1],
      });
    });

    expect(mockSetPrincipal).not.toHaveBeenCalled();
  });
});

// ── Failure + cache ownership ───────────────────────────────────────────────────

describe('useUpdateTerapeuta — failure + cache ownership', () => {
  it('exposes isError when the usuario update rejects', async () => {
    mockUpdate.mockRejectedValue(new Error('update failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({
        id: 10,
        dto: {},
        centroIds: [1],
        previousCentroIds: [1],
        principalCentroId: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('invalidates ["terapeutas"] on success', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        dto: {},
        centroIds: [1],
        previousCentroIds: [1],
        principalCentroId: 1,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['terapeutas'] }),
      );
    });
  });
});
