/**
 * useClienteDetalle.test.tsx
 *
 * Tests the useClienteDetalle hook's contract after the real-data rewrite.
 * Key changes from the old static-phase tests:
 *   - clienteId=1 no longer returns MOCK_LUCIA_DETALLE — calls real adapters
 *   - mock fallback path is gone: every non-null clienteId triggers real fetches
 *   - notaFecha is always null (clientes table has no updated_at column)
 *   - plan is always null, puntos always 0, gastoAnio always 0
 *   - totalVisitasAnio comes from citaAdapter.countYTDByCliente (adapter, not supabase direct)
 *   - preferencias are parsed from observaciones by comma-splitting
 *   - proximaCita from findEnrichedByCliente(id, { limit:1, onlyFuture:true })
 *   - citasRecientes from findEnrichedByCliente(id, { limit:5, onlyPast:true })
 *
 * Mock strategy:
 *   - SupabaseClienteAdapter and SupabaseCitaAdapter are mocked as real class
 *     constructors so `new Adapter()` works at module-load time in the hook.
 *   - Module-level vi.fn() refs expose the methods the hook calls.
 *   - No supabase singleton mock needed — the hook calls countYTDByCliente
 *     on the adapter, not supabase directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ICliente } from '@domain/models';
import type { ICitaEnriquecida } from '@infra/pages/ClientesPage/Clientes.types';

// ── Module-level mock refs ────────────────────────────────────────────────────

const mockClienteFindById = vi.fn();
const mockCitaFindEnriched = vi.fn();
const mockCountYTD = vi.fn();

// ── Adapter mocks ─────────────────────────────────────────────────────────────
// Must be real class constructors — the hook creates instances at module load.

vi.mock('@infra/adapters/SupabaseClienteAdapter', () => ({
  SupabaseClienteAdapter: class MockClienteAdapter {
    findById(...args: unknown[]): Promise<unknown> {
      return mockClienteFindById(...args) as Promise<unknown>;
    }
    findAll() {
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 });
    }
    findAllWithStats() {
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 });
    }
    findClienteKPI() {
      return Promise.resolve({
        totalClientes: 0,
        nuevos30Dias: 0,
        recurrenciaPct: 0,
        gastoMedioCliente: 0,
      });
    }
    findByEmail() {
      return Promise.resolve(null);
    }
    findByTelefono() {
      return Promise.resolve(null);
    }
    search() {
      return Promise.resolve([]);
    }
    create() {
      return Promise.resolve(null);
    }
    update() {
      return Promise.resolve(null);
    }
    deactivate() {
      return Promise.resolve(undefined);
    }
  },
}));

vi.mock('@infra/adapters/SupabaseCitaAdapter', () => ({
  SupabaseCitaAdapter: class MockCitaAdapter {
    findEnrichedByCliente(...args: unknown[]): Promise<unknown> {
      return mockCitaFindEnriched(...args) as Promise<unknown>;
    }
    countYTDByCliente(...args: unknown[]): Promise<unknown> {
      return mockCountYTD(...args) as Promise<unknown>;
    }
    // sumYTDGastoByCliente: called by useClienteDetalle for gastoAnio
    sumYTDGastoByCliente(_clienteId: unknown, _startOfYear: unknown): Promise<number> {
      return Promise.resolve(0);
    }
    findById() {
      return Promise.resolve(null);
    }
    findByCentroAndFecha() {
      return Promise.resolve([]);
    }
    findByCentroAndRange() {
      return Promise.resolve([]);
    }
    findByUsuario() {
      return Promise.resolve([]);
    }
    findBySala() {
      return Promise.resolve([]);
    }
    findByCliente() {
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 });
    }
    findByEstado() {
      return Promise.resolve([]);
    }
    create() {
      return Promise.resolve(null);
    }
    updateEstado() {
      return Promise.resolve(null);
    }
    cancel() {
      return Promise.resolve(undefined);
    }
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useClienteDetalle } from '@infra/hooks/useClienteDetalle';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ── Base fixtures ─────────────────────────────────────────────────────────────

const CLIENTE_BASE: ICliente = {
  id: 42,
  nombre: 'Carlos',
  apellidos: 'Test',
  email: 'carlos@example.com',
  telefono: '+34 600 000 042',
  fechaNacimiento: null,
  observaciones: 'Prefiere silencio, Presión suave',
  activo: true,
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2024-01-15'),
};

const CITA_ENRIQUECIDA: ICitaEnriquecida = {
  citaId: 101,
  fechaHoraInicio: new Date('2025-01-15T10:00:00Z'),
  fechaHoraFin: new Date('2025-01-15T11:30:00Z'),
  estado: 'completada',
  servicioNombre: 'Masaje Thai',
  duracionMinutos: 90,
  salaNombre: 'Sala Loto',
  terapeutaNombre: 'Naree Apinya',
  valoracion: null,
};

const FUTURE_CITA: ICitaEnriquecida = {
  citaId: 202,
  fechaHoraInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  fechaHoraFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60_000),
  estado: 'confirmada',
  servicioNombre: 'Hierbas Calientes',
  duracionMinutos: 90,
  salaNombre: 'Sala Bambú',
  terapeutaNombre: 'Naree Apinya',
  valoracion: null,
};

// ── Tests: disabled when clienteId is null ────────────────────────────────────

describe('useClienteDetalle — disabled when clienteId is null', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountYTD.mockResolvedValue(0);
  });

  it('does not call the adapter when clienteId is null', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(null), { wrapper });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockClienteFindById).not.toHaveBeenCalled();
    expect(result.current.detalle).toBeNull();
  });

  it('isLoading is false when clienteId is null (query disabled)', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(null), { wrapper });
    expect(result.current.isLoading).toBe(false);
  });

  it('isError is false when clienteId is null', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(null), { wrapper });
    expect(result.current.isError).toBe(false);
  });

  it('detalle is null when clienteId is null', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(null), { wrapper });
    expect(result.current.detalle).toBeNull();
  });
});

// ── Tests: real fetch path ────────────────────────────────────────────────────

describe('useClienteDetalle — real fetch path (non-null clienteId)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountYTD.mockResolvedValue(5);
    mockClienteFindById.mockResolvedValue(CLIENTE_BASE);
    mockCitaFindEnriched.mockResolvedValue([]);
  });

  it('returns assembled IClienteDetalle from adapter data', async () => {
    mockCitaFindEnriched
      .mockResolvedValueOnce([FUTURE_CITA])
      .mockResolvedValueOnce([CITA_ENRIQUECIDA]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const detalle = result.current.detalle;
    expect(detalle).not.toBeNull();
    expect(detalle?.cliente.nombre).toBe('Carlos');
    expect(detalle?.cliente.apellidos).toBe('Test');
  });

  it('plan is null (not migrated)', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.plan).toBeNull();
  });

  it('puntos is 0 (not migrated)', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.puntos).toBe(0);
  });

  it('gastoAnio is 0 (pagos table not migrated)', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.gastoAnio).toBe(0);
  });

  it('notaFecha is null (clientes table has no updated_at column)', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.notaFecha).toBeNull();
  });

  it('notaAutor is null', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.notaAutor).toBeNull();
  });

  // NOTE: preferencias tests removed — IClienteDetalle has no `preferencias` field.
  // The observaciones string is exposed as-is via notaEstudio.
  // These tests were drift from a prior design iteration.

  it('proximaCita is the first element from the onlyFuture query', async () => {
    mockCitaFindEnriched
      .mockResolvedValueOnce([FUTURE_CITA])
      .mockResolvedValueOnce([CITA_ENRIQUECIDA]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.proximaCita).toEqual(FUTURE_CITA);
  });

  it('proximaCita is null when no future citas returned', async () => {
    // mockCitaFindEnriched already returns [] from beforeEach
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.proximaCita).toBeNull();
  });

  it('citasRecientes comes from the onlyPast query', async () => {
    mockCitaFindEnriched
      .mockResolvedValueOnce([FUTURE_CITA]) // onlyFuture
      .mockResolvedValueOnce([CITA_ENRIQUECIDA]); // onlyPast

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.citasRecientes).toEqual([CITA_ENRIQUECIDA]);
  });

  it('totalVisitasAnio comes from citaAdapter.countYTDByCliente', async () => {
    mockCountYTD.mockResolvedValue(7);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.totalVisitasAnio).toBe(7);
    // startOfYear is new Date(year, 0, 1).toISOString() — timezone-dependent,
    // but always an ISO string starting with 4-digit year and ending in Z.
    expect(mockCountYTD).toHaveBeenCalledWith(
      42,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    );
  });

  it('totalVisitasAnio is 0 when count adapter returns 0', async () => {
    mockCountYTD.mockResolvedValue(0);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.totalVisitasAnio).toBe(0);
  });

  it('segmento is activo when last cita was 10 days ago (not new, not vip)', async () => {
    const recentCita: ICitaEnriquecida = {
      ...CITA_ENRIQUECIDA,
      fechaHoraInicio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    };
    mockClienteFindById.mockResolvedValue({
      ...CLIENTE_BASE,
      createdAt: new Date('2022-01-01'), // old client, not nuevo
    });
    mockCitaFindEnriched
      .mockResolvedValueOnce([]) // onlyFuture
      .mockResolvedValueOnce([recentCita]); // onlyPast

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.segmento).toBe('activo');
  });

  it('segmento is inactivo when no citasRecientes and client is not new', async () => {
    mockClienteFindById.mockResolvedValue({
      ...CLIENTE_BASE,
      createdAt: new Date('2022-01-01'),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.detalle?.segmento).toBe('inactivo');
  });
});

// ── Tests: loading state ──────────────────────────────────────────────────────

describe('useClienteDetalle — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountYTD.mockResolvedValue(0);
  });

  it('isLoading is true before the adapter resolves', () => {
    // never-resolving promise simulates a pending fetch

    mockClienteFindById.mockReturnValue(new Promise(() => {}));
    mockCitaFindEnriched.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('isLoading transitions to false after the adapter resolves', async () => {
    mockClienteFindById.mockResolvedValue(CLIENTE_BASE);
    mockCitaFindEnriched.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

// ── Tests: error states ───────────────────────────────────────────────────────

describe('useClienteDetalle — error states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountYTD.mockResolvedValue(0);
  });

  it('isError is true when clienteAdapter.findById throws', async () => {
    mockClienteFindById.mockRejectedValue(new Error('DB error'));
    mockCitaFindEnriched.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('detalle is null when the adapter throws', async () => {
    mockClienteFindById.mockRejectedValue(new Error('DB error'));
    mockCitaFindEnriched.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.detalle).toBeNull();
  });

  it('isError is true when findById returns null (cliente not found)', async () => {
    // The hook throws `Error('Cliente 42 not found')` when findById returns null
    mockClienteFindById.mockResolvedValue(null);
    mockCitaFindEnriched.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('isError is true when countYTDByCliente throws', async () => {
    mockCountYTD.mockRejectedValue(new Error('count query failed'));
    mockClienteFindById.mockResolvedValue(CLIENTE_BASE);
    mockCitaFindEnriched.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('isError is true when citaAdapter.findEnrichedByCliente throws', async () => {
    mockClienteFindById.mockResolvedValue(CLIENTE_BASE);
    mockCitaFindEnriched.mockRejectedValue(new Error('citas query failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ── Tests: refetch ────────────────────────────────────────────────────────────

describe('useClienteDetalle — refetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountYTD.mockResolvedValue(0);
    mockClienteFindById.mockResolvedValue(CLIENTE_BASE);
    mockCitaFindEnriched.mockResolvedValue([]);
  });

  it('exposes a refetch function', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(typeof result.current.refetch).toBe('function');
  });

  it('calling refetch triggers a second call to clienteAdapter.findById', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClienteDetalle(42), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockClienteFindById).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockClienteFindById).toHaveBeenCalledTimes(2);
  });
});
