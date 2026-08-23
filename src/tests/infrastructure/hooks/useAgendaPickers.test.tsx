/**
 * useAgendaPickers.test.tsx
 *
 * Contract tests for the CitaModal picker hooks:
 *   useClientesActivos · useServiciosActivosCentro · useSalasActivas ·
 *   useCentroMasajistas
 *
 * Mock strategy (mirrors useClientes.test.tsx): each underlying Supabase adapter
 * is mocked as a real class so the module-level `new SupabaseXxxAdapter()` works;
 * the relevant method is exposed via a module-level vi.fn(). Real QueryClient,
 * retry:false. We assert: success mapping, the active-only filter, the
 * centroId===null guard (no fetch, empty result), and the error state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mocks (must precede hook imports) ──────────────────────────────────
const mockFindAllClientes = vi.fn();
const mockFindByCentroServicios = vi.fn();
const mockFindActivasByCentroSalas = vi.fn();
const mockFetchDayTerapeutas = vi.fn();

vi.mock('@infra/adapters/SupabaseClienteAdapter', () => ({
  SupabaseClienteAdapter: class {
    findAll(...a: unknown[]): unknown {
      return mockFindAllClientes(...a);
    }
  },
}));
vi.mock('@infra/adapters/SupabaseServicioAdapter', () => ({
  SupabaseServicioAdapter: class {
    findByCentro(...a: unknown[]): unknown {
      return mockFindByCentroServicios(...a);
    }
  },
}));
vi.mock('@infra/adapters/SupabaseSalaAdapter', () => ({
  SupabaseSalaAdapter: class {
    findActivasByCentro(...a: unknown[]): unknown {
      return mockFindActivasByCentroSalas(...a);
    }
  },
}));
vi.mock('@infra/adapters/SupabaseAgendaAdapter', () => ({
  SupabaseAgendaAdapter: class {
    fetchDayTerapeutas(...a: unknown[]): unknown {
      return mockFetchDayTerapeutas(...a);
    }
  },
}));

import { useClientesActivos } from '@infra/hooks/useClientesActivos';
import { useServiciosActivosCentro } from '@infra/hooks/useServiciosActivosCentro';
import { useSalasActivas } from '@infra/hooks/useSalasActivas';
import { useCentroMasajistas } from '@infra/hooks/useCentroMasajistas';
import type { ICliente, IServicio, ISala } from '@domain/models';
import type { IAgendaTerapeutaRow } from '@domain/models/agenda.models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeCliente(id: number, activo: boolean): ICliente {
  return {
    id,
    nombre: `Cliente ${id}`,
    apellidos: 'Apellido',
    email: null,
    telefono: '+34 600 000 000',
    fechaNacimiento: null,
    observaciones: null,
    activo,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function makeServicio(id: number, estado: IServicio['estado']): IServicio {
  return {
    id,
    tipoServicioId: 1,
    nombre: `Servicio ${id}`,
    descripcion: null,
    duracionMinutos: 60,
    precioBase: 5000,
    esBono: false,
    sesionesTotales: null,
    tieneDescuento: false,
    porcentajeDescuento: 0,
    estado,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function makeSala(id: number): ISala {
  return { id, centroId: 1, nombre: `Sala ${id}`, capacidad: 1, activa: true, descripcion: null };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// useClientesActivos
// ════════════════════════════════════════════════════════════════════════════

describe('useClientesActivos', () => {
  it('returns only active clientes from findAll', async () => {
    mockFindAllClientes.mockResolvedValue({
      data: [makeCliente(1, true), makeCliente(2, false), makeCliente(3, true)],
      total: 3,
      page: 1,
      perPage: 500,
      totalPages: 1,
    });
    const { result } = renderHook(() => useClientesActivos(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.clientes.map((c) => c.id)).toEqual([1, 3]);
  });

  it('does not fetch when disabled and returns an empty list', () => {
    const { result } = renderHook(() => useClientesActivos(false), { wrapper: createWrapper() });
    expect(result.current.clientes).toEqual([]);
    expect(mockFindAllClientes).not.toHaveBeenCalled();
  });

  it('exposes the error state when findAll rejects', async () => {
    mockFindAllClientes.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useClientesActivos(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.clientes).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useServiciosActivosCentro
// ════════════════════════════════════════════════════════════════════════════

describe('useServiciosActivosCentro', () => {
  it('returns only servicios with estado="activo" for the centro', async () => {
    mockFindByCentroServicios.mockResolvedValue([
      makeServicio(1, 'activo'),
      makeServicio(2, 'inactivo'),
      makeServicio(3, 'activo'),
    ]);
    const { result } = renderHook(() => useServiciosActivosCentro(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.servicios.map((s) => s.id)).toEqual([1, 3]);
    expect(mockFindByCentroServicios).toHaveBeenCalledWith(1);
  });

  it('returns [] and does not fetch when centroId is null', () => {
    const { result } = renderHook(() => useServiciosActivosCentro(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.servicios).toEqual([]);
    expect(mockFindByCentroServicios).not.toHaveBeenCalled();
  });

  it('exposes the error state when the adapter rejects', async () => {
    mockFindByCentroServicios.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useServiciosActivosCentro(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useSalasActivas
// ════════════════════════════════════════════════════════════════════════════

describe('useSalasActivas', () => {
  it('returns the adapter salas for the centro', async () => {
    mockFindActivasByCentroSalas.mockResolvedValue([makeSala(1), makeSala(2)]);
    const { result } = renderHook(() => useSalasActivas(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.salas).toHaveLength(2);
    expect(mockFindActivasByCentroSalas).toHaveBeenCalledWith(1);
  });

  it('returns [] and does not fetch when centroId is null', () => {
    const { result } = renderHook(() => useSalasActivas(null), { wrapper: createWrapper() });
    expect(result.current.salas).toEqual([]);
    expect(mockFindActivasByCentroSalas).not.toHaveBeenCalled();
  });

  it('exposes the error state when the adapter rejects', async () => {
    mockFindActivasByCentroSalas.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useSalasActivas(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useCentroMasajistas
// ════════════════════════════════════════════════════════════════════════════

describe('useCentroMasajistas', () => {
  const masajistas: IAgendaTerapeutaRow[] = [
    { id: 1, nombre: 'Naree', apellidos: '', isActive: true },
    { id: 2, nombre: 'Som', apellidos: '', isActive: true },
  ];

  it('returns the centro masajistas from fetchDayTerapeutas', async () => {
    mockFetchDayTerapeutas.mockResolvedValue(masajistas);
    const { result } = renderHook(() => useCentroMasajistas(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.masajistas).toHaveLength(2);
    expect(mockFetchDayTerapeutas).toHaveBeenCalledWith(1);
  });

  it('returns [] and does not fetch when centroId is null', () => {
    const { result } = renderHook(() => useCentroMasajistas(null), { wrapper: createWrapper() });
    expect(result.current.masajistas).toEqual([]);
    expect(mockFetchDayTerapeutas).not.toHaveBeenCalled();
  });

  it('exposes the error state when the adapter rejects', async () => {
    mockFetchDayTerapeutas.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useCentroMasajistas(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
