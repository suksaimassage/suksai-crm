/**
 * useCentroHorarios.test.tsx
 *
 * Read hook for the centre-wide schedule. The ADAPTER (port implementation) is
 * mocked — never Supabase, never the domain. Tests the hook's contract:
 *   - resolves to the centre's horarios on success
 *   - exposes an error flag when the adapter rejects
 *   - is DISABLED and fires NO request when centroId is null (Edge 1)
 *   - calls findByCentro with the active centroId
 *
 * Mock strategy: SupabaseHorarioAdapter is class-mocked so every `new
 * SupabaseHorarioAdapter()` in the hook module shares one stub instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const findByCentro = vi.fn();

vi.mock('@infra/adapters/SupabaseHorarioAdapter', () => ({
  // Real class so the hook's `new SupabaseHorarioAdapter()` is a valid construction;
  // the prototype method delegates to the shared spy through closure (a class-field
  // `findByCentro = findByCentro` would hit a TDZ collision with the outer const).
  SupabaseHorarioAdapter: class {
    findByCentro(...args: unknown[]): unknown {
      return findByCentro(...args);
    }
  },
}));

import { useCentroHorarios } from '@infra/hooks/useCentroHorarios';
import type { IHorarioTrabajo } from '@domain/models';

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeHorario(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 1,
    usuarioId: 1,
    centroId: 10,
    tipo: 'recurrente',
    diaSemana: 1,
    fecha: null,
    horaInicio: '09:00',
    horaFin: '17:00',
    activo: true,
    ...overrides,
  };
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────

describe('useCentroHorarios', () => {
  it('returns the centre horarios on success', async () => {
    const rows = [makeHorario({ id: 1 }), makeHorario({ id: 2 })];
    findByCentro.mockResolvedValue(rows);

    const { result } = renderHook(() => useCentroHorarios(10), {
      wrapper: setup().wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.data).toEqual(rows);
    expect(result.current.isError).toBe(false);
  });

  it('calls adapter.findByCentro with the active centroId', async () => {
    findByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useCentroHorarios(77), {
      wrapper: setup().wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(findByCentro).toHaveBeenCalledWith(77);
  });

  it('exposes the error flag when the adapter rejects', async () => {
    findByCentro.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useCentroHorarios(10), {
      wrapper: setup().wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('is disabled and fires NO request when centroId is null (Edge 1)', async () => {
    const { result } = renderHook(() => useCentroHorarios(null), {
      wrapper: setup().wrapper,
    });

    // Disabled query: never loading, no data, adapter never invoked.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
    // Give any (incorrectly) scheduled query a tick to fire — it must not.
    await Promise.resolve();
    expect(findByCentro).not.toHaveBeenCalled();
  });

  it('defaults data to an empty array before the query settles', () => {
    // A promise that never settles — the query stays pending, so data falls back to [].
    const pending = new Promise<readonly IHorarioTrabajo[]>(() => {
      /* intentionally never resolves */
    });
    findByCentro.mockReturnValue(pending);
    const { result } = renderHook(() => useCentroHorarios(10), {
      wrapper: setup().wrapper,
    });
    expect(result.current.data).toEqual([]);
  });
});
