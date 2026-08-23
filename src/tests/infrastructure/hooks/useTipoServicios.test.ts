/**
 * useTipoServicios.test.ts
 *
 * Tests for the useTipoServicios hook.
 * Strategy:
 *   - Mock SupabaseTipoServicioAdapter at class level so findAll is controllable.
 *   - Each test gets a fresh QueryClient to prevent cache bleed between tests.
 *   - No snapshot tests. No CSS assertions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode, ReactElement } from 'react';
import type { ITipoServicio } from '@domain/models';

// ── Mock adapter at module level (before hook import) ─────────────────────────

const mockFindAll = vi.fn<() => Promise<readonly ITipoServicio[]>>();

vi.mock('@infra/adapters/SupabaseTipoServicioAdapter', () => ({
  SupabaseTipoServicioAdapter: class {
    findAll = mockFindAll;
  },
}));

// Import AFTER mock is registered
const { useTipoServicios } = await import('@infra/hooks/useTipoServicios');

// ── Fixtures ───────────────────────────────────────────────────────────────────

const tipoServicioFixtures: ITipoServicio[] = [
  { id: 1, nombre: 'Masajes tradicionales', descripcion: null },
  { id: 2, nombre: 'Con aceites cálidos', descripcion: null },
  { id: 3, nombre: 'Masaje deportivo', descripcion: 'Para atletas' },
];

// ── Wrapper factory ────────────────────────────────────────────────────────────

function makeWrapper(): ({ children }: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => QueryClientProvider({ client: qc, children });
}

// ── Reset mocks before each test ───────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('useTipoServicios — loading state', () => {
  it('returns empty array and isLoading=true while query is pending', () => {
    // Never resolve — keeps the query in loading state
    mockFindAll.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useTipoServicios(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.tipoServicios).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });
});

// ── Successful fetch ──────────────────────────────────────────────────────────

describe('useTipoServicios — successful fetch', () => {
  it('returns tipoServicios array when findAll resolves', async () => {
    mockFindAll.mockResolvedValue(tipoServicioFixtures);

    const { result } = renderHook(() => useTipoServicios(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tipoServicios).toHaveLength(3);
    expect(result.current.tipoServicios[0]).toEqual(tipoServicioFixtures[0]);
    expect(result.current.isError).toBe(false);
  });

  it('calls findAll exactly once on mount', async () => {
    mockFindAll.mockResolvedValue(tipoServicioFixtures);

    renderHook(() => useTipoServicios(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockFindAll).toHaveBeenCalledTimes(1);
    });
  });

  it('returns empty array when findAll resolves with empty list', async () => {
    mockFindAll.mockResolvedValue([]);

    const { result } = renderHook(() => useTipoServicios(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tipoServicios).toEqual([]);
  });

  it('preserves descripcion field (null or string)', async () => {
    mockFindAll.mockResolvedValue(tipoServicioFixtures);

    const { result } = renderHook(() => useTipoServicios(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tipoServicios[0]?.descripcion).toBeNull();
    expect(result.current.tipoServicios[2]?.descripcion).toBe('Para atletas');
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('useTipoServicios — error state', () => {
  it('sets isError=true when findAll throws', async () => {
    mockFindAll.mockRejectedValue(new Error('DB connection failed'));

    const { result } = renderHook(() => useTipoServicios(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.tipoServicios).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns empty tipoServicios array on error (never undefined)', async () => {
    mockFindAll.mockRejectedValue(new Error('timeout'));

    const { result } = renderHook(() => useTipoServicios(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(Array.isArray(result.current.tipoServicios)).toBe(true);
  });
});
