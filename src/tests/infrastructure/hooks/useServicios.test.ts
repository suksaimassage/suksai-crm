/**
 * useServicios.test.ts
 *
 * Tests for the useServicios hook.
 * Strategy:
 *   - Mock SupabaseServicioAdapter at class level so findByCentro and findActivos
 *     are fully controllable without touching Supabase.
 *   - Each test gets a fresh QueryClient to prevent cache bleed between tests.
 *   - Domain layer is NOT mocked — the hook's contract is what's under test.
 *   - No snapshot tests. No CSS assertions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode, ReactElement } from 'react';
import type { IServicio } from '@domain/models';

// ── Mock adapter at module level (before hook import) ─────────────────────────

const mockFindByCentro = vi.fn<() => Promise<readonly IServicio[]>>();
const mockFindActivos = vi.fn<() => Promise<readonly IServicio[]>>();

vi.mock('@infra/adapters/SupabaseServicioAdapter', () => ({
  SupabaseServicioAdapter: class {
    findByCentro = mockFindByCentro;
    findActivos = mockFindActivos;
  },
}));

// Import AFTER mock is registered
const { useServicios } = await import('@infra/hooks/useServicios');

// ── Fixtures ───────────────────────────────────────────────────────────────────

const servicioFixture: IServicio = {
  id: 1,
  tipoServicioId: 10,
  nombre: 'Masaje Thai',
  descripcion: 'Presión profunda',
  duracionMinutos: 60,
  precioBase: 55,
  esBono: false,
  sesionesTotales: null,
  tieneDescuento: false,
  porcentajeDescuento: 0,
  estado: 'activo',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const bonoFixture: IServicio = {
  id: 2,
  tipoServicioId: 10,
  nombre: 'Bono 5 sesiones',
  descripcion: null,
  duracionMinutos: 60,
  precioBase: 250,
  esBono: true,
  sesionesTotales: 5,
  tieneDescuento: false,
  porcentajeDescuento: 0,
  estado: 'activo',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

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

describe('useServicios — loading state', () => {
  it('returns empty array and isLoading=true while query is pending (centroId provided)', () => {
    // Never resolve — keeps the query in loading state
    mockFindByCentro.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useServicios(1), {
      wrapper: makeWrapper(),
    });

    expect(result.current.servicios).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('returns empty array and isLoading=true while query is pending (centroId=null)', () => {
    mockFindActivos.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useServicios(null), {
      wrapper: makeWrapper(),
    });

    expect(result.current.servicios).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });
});

// ── Successful fetch with centroId ────────────────────────────────────────────

describe('useServicios — successful fetch with centroId', () => {
  it('returns services array when findByCentro resolves', async () => {
    mockFindByCentro.mockResolvedValue([servicioFixture, bonoFixture]);

    const { result } = renderHook(() => useServicios(1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.servicios).toHaveLength(2);
    expect(result.current.servicios[0]).toEqual(servicioFixture);
    expect(result.current.servicios[1]).toEqual(bonoFixture);
    expect(result.current.isError).toBe(false);
  });

  it('calls findByCentro with the provided centroId', async () => {
    mockFindByCentro.mockResolvedValue([servicioFixture]);

    renderHook(() => useServicios(42), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockFindByCentro).toHaveBeenCalledWith(42);
    });

    expect(mockFindActivos).not.toHaveBeenCalled();
  });

  it('returns empty array when findByCentro resolves with empty list', async () => {
    mockFindByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useServicios(1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.servicios).toEqual([]);
  });
});

// ── Successful fetch without centroId (activos) ───────────────────────────────

describe('useServicios — successful fetch with centroId=null', () => {
  it('returns services array when findActivos resolves', async () => {
    mockFindActivos.mockResolvedValue([servicioFixture]);

    const { result } = renderHook(() => useServicios(null), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.servicios).toHaveLength(1);
    expect(result.current.servicios[0]).toEqual(servicioFixture);
    expect(result.current.isError).toBe(false);
  });

  it('calls findActivos (not findByCentro) when centroId is null', async () => {
    mockFindActivos.mockResolvedValue([servicioFixture]);

    renderHook(() => useServicios(null), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockFindActivos).toHaveBeenCalledTimes(1);
    });

    expect(mockFindByCentro).not.toHaveBeenCalled();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('useServicios — error state', () => {
  it('sets isError=true when findByCentro throws', async () => {
    mockFindByCentro.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useServicios(1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.servicios).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets isError=true when findActivos throws', async () => {
    mockFindActivos.mockRejectedValue(new Error('DB unreachable'));

    const { result } = renderHook(() => useServicios(null), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.servicios).toEqual([]);
  });
});

// ── refetch ───────────────────────────────────────────────────────────────────

describe('useServicios — refetch', () => {
  it('exposes a refetch function', async () => {
    mockFindByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useServicios(1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('re-invokes findByCentro when refetch is called', async () => {
    mockFindByCentro.mockResolvedValue([servicioFixture]);

    const { result } = renderHook(() => useServicios(1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFindByCentro.mockResolvedValue([servicioFixture, bonoFixture]);
    void result.current.refetch();

    await waitFor(() => {
      expect(mockFindByCentro).toHaveBeenCalledTimes(2);
    });
  });
});

// ── Query key distinction ─────────────────────────────────────────────────────

describe('useServicios — query key routing', () => {
  it('uses findByCentro path when centroId is a positive integer', async () => {
    mockFindByCentro.mockResolvedValue([servicioFixture]);

    renderHook(() => useServicios(99), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockFindByCentro).toHaveBeenCalledWith(99);
    });
  });

  it('uses findActivos path when centroId is null', async () => {
    mockFindActivos.mockResolvedValue([servicioFixture]);

    renderHook(() => useServicios(null), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockFindActivos).toHaveBeenCalledTimes(1);
    });
  });
});
