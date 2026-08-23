/**
 * useClientes.test.tsx
 *
 * Tests the useClientes hook's contract after the real-data rewrite.
 * No mock fallback exists anymore — the hook always delegates to the
 * SupabaseClienteAdapter and exposes its results directly.
 *
 * Mock strategy:
 *   The adapter is mocked as a real class so `new SupabaseClienteAdapter()`
 *   (called at module load time in useClientes.ts) works correctly.
 *   findAllWithStats and findClienteKPI are exposed via module-level vi.fn()
 *   refs that each test configures independently via `beforeEach`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mock ──────────────────────────────────────────────────────────────
// Must use a real class constructor so `new SupabaseClienteAdapter()` works.
// The module-level singleton in useClientes.ts calls `new` at import time.

const mockFindAllWithStats = vi.fn();
const mockFindClienteKPI = vi.fn();

vi.mock('@infra/adapters/SupabaseClienteAdapter', () => ({
  SupabaseClienteAdapter: class MockClienteAdapter {
    findAllWithStats(...args: unknown[]) {
      return mockFindAllWithStats(...args);
    }
    findClienteKPI(...args: unknown[]) {
      return mockFindClienteKPI(...args);
    }
    findById() {
      return Promise.resolve(null);
    }
    findByEmail() {
      return Promise.resolve(null);
    }
    findByTelefono() {
      return Promise.resolve(null);
    }
    findAll() {
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 });
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

// ── Import after mock ─────────────────────────────────────────────────────────

import { useClientes } from '@infra/hooks/useClientes';
import { VIP_THRESHOLD_CENTS } from '@infra/pages/ClientesPage/Clientes.types';
import type { IPaginatedResult } from '@domain/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const DEFAULT_PARAMS = { page: 1, perPage: 50 } as const;

const MOCK_KPI_DATA = {
  totalClientes: 10,
  nuevos30Dias: 3,
  recurrenciaPct: 40,
  gastoMedioCliente: 0,
} as const;

/** A minimal IClienteWithStats-shaped object the adapter would return. */
function makeStatsRow(overrides: {
  id?: number;
  nombre?: string;
  apellidos?: string;
  email?: string | null;
  telefono?: string;
  activo?: boolean;
  createdAt?: Date;
  ultimaVisita?: Date | null;
  gastoAnual?: number;
  totalVisitasAnio?: number;
  frecuenciaVisitas?: number;
  ritualFavorito?: string | null;
}) {
  return {
    cliente: {
      id: overrides.id ?? 1,
      nombre: overrides.nombre ?? 'Test',
      apellidos: overrides.apellidos ?? 'User',
      email: overrides.email ?? 'test@example.com',
      telefono: overrides.telefono ?? '+34 600 000 000',
      observaciones: null,
      activo: overrides.activo ?? true,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    },
    ultimaVisita: overrides.ultimaVisita !== undefined ? overrides.ultimaVisita : null,
    totalVisitasAnio: overrides.totalVisitasAnio ?? 0,
    frecuenciaVisitas: overrides.frecuenciaVisitas ?? 0,
    ritualFavorito: overrides.ritualFavorito ?? null,
    gastoAnual: overrides.gastoAnual ?? 0,
  };
}

function makePaginatedStats(
  rows: ReturnType<typeof makeStatsRow>[],
  total?: number,
): IPaginatedResult<ReturnType<typeof makeStatsRow>> {
  return {
    data: rows,
    total: total ?? rows.length,
    page: 1,
    perPage: 50,
    totalPages: 1,
  };
}

// ── Tests: row mapping ────────────────────────────────────────────────────────

describe('useClientes — row mapping from findAllWithStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps adapter stats row to IClienteTableRow correctly', async () => {
    const statsRow = makeStatsRow({
      id: 42,
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana@example.com',
      telefono: '+34 612 000 000',
      ultimaVisita: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      frecuenciaVisitas: 2.5,
      gastoAnual: 30_000,
      totalVisitasAnio: 8,
      ritualFavorito: 'Masaje Deportivo',
      createdAt: new Date('2023-01-01'),
    });

    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const row = result.current.rows[0];
    expect(row).toBeDefined();
    expect(row.clienteId).toBe(42);
    expect(row.nombreCompleto).toBe('Ana García');
    expect(row.email).toBe('ana@example.com');
    expect(row.telefono).toBe('+34 612 000 000');
    expect(row.frecuenciaVisitas).toBe(2.5);
    expect(row.gastoAnual).toBe(30_000);
    expect(row.totalVisitasAnio).toBe(8);
    expect(row.ritualFavorito).toBe('Masaje Deportivo');
  });

  it('returns empty rows array when adapter returns empty data', async () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rows).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('exposes kpi from findClienteKPI on the hook result', async () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.kpi).toEqual(MOCK_KPI_DATA);
  });

  it('total reflects adapter total', async () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([], 99));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.total).toBe(99);
  });
});

// ── Tests: segmento derivation ────────────────────────────────────────────────

describe('useClientes — segmento derivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // KPI is a bystander for these tests
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);
  });

  it('ultimaVisita null and not new → inactivo', async () => {
    const statsRow = makeStatsRow({
      ultimaVisita: null,
      gastoAnual: 0,
      createdAt: new Date('2022-01-01'), // well over 30 days ago
      totalVisitasAnio: 5, // >= 3 to bypass the nuevo threshold
    });
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows[0].segmento).toBe('inactivo');
  });

  it('ultimaVisita > 90 days ago → inactivo', async () => {
    const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
    const statsRow = makeStatsRow({
      ultimaVisita: ninetyOneDaysAgo,
      gastoAnual: 0,
      createdAt: new Date('2022-01-01'),
      totalVisitasAnio: 5, // >= 3 to bypass the nuevo threshold
    });
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows[0].segmento).toBe('inactivo');
  });

  it('ultimaVisita 61-90 days ago → en_riesgo', async () => {
    const seventyFiveDaysAgo = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000);
    const statsRow = makeStatsRow({
      ultimaVisita: seventyFiveDaysAgo,
      gastoAnual: 0,
      createdAt: new Date('2022-01-01'),
      totalVisitasAnio: 5, // >= 3 to bypass the nuevo threshold
    });
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows[0].segmento).toBe('en_riesgo');
  });

  it('ultimaVisita ≤ 60 days ago → activo', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const statsRow = makeStatsRow({
      ultimaVisita: thirtyDaysAgo,
      gastoAnual: 0,
      createdAt: new Date('2022-01-01'),
      totalVisitasAnio: 5, // >= 3 to bypass the nuevo threshold
    });
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows[0].segmento).toBe('activo');
  });

  it('createdAt within 30 days → nuevo (trumps visit date logic)', async () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    // ultimaVisita is 80 days ago which would be en_riesgo — but nuevo wins
    const eightyDaysAgo = new Date(Date.now() - 80 * 24 * 60 * 60 * 1000);
    const statsRow = makeStatsRow({
      ultimaVisita: eightyDaysAgo,
      gastoAnual: 0,
      createdAt: fifteenDaysAgo,
    });
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows[0].segmento).toBe('nuevo');
  });

  it('gastoAnual >= VIP_THRESHOLD_CENTS → vip (trumps all other segments)', async () => {
    // Even if null ultimaVisita (would be inactivo), vip wins
    const statsRow = makeStatsRow({
      ultimaVisita: null,
      gastoAnual: VIP_THRESHOLD_CENTS,
      createdAt: new Date('2022-01-01'),
    });
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([statsRow]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows[0].segmento).toBe('vip');
  });
});

// ── Tests: loading state ──────────────────────────────────────────────────────

describe('useClientes — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isLoading is true before rowsQuery resolves', () => {
    // Don't resolve — keep pending indefinitely
    mockFindAllWithStats.mockReturnValue(new Promise(() => {}));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('isLoading is true when kpiQuery is pending', () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockReturnValue(new Promise(() => {}));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('isLoading transitions to false after both queries resolve', async () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

// ── Tests: error state ────────────────────────────────────────────────────────

describe('useClientes — error state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isError is true when rowsQuery throws', async () => {
    mockFindAllWithStats.mockRejectedValue(new Error('Supabase network error'));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('isError is true when kpiQuery throws', async () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockRejectedValue(new Error('KPI query failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('rows falls back to [] when rowsQuery fails', async () => {
    mockFindAllWithStats.mockRejectedValue(new Error('DB down'));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.rows).toHaveLength(0);
  });

  it('kpi falls back to EMPTY_KPI when kpiQuery fails', async () => {
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockRejectedValue(new Error('KPI down'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.kpi.totalClientes).toBe(0);
    expect(result.current.kpi.recurrenciaPct).toBe(0);
  });
});

// ── Tests: refetch ────────────────────────────────────────────────────────────

describe('useClientes — refetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindAllWithStats.mockResolvedValue(makePaginatedStats([]));
    mockFindClienteKPI.mockResolvedValue(MOCK_KPI_DATA);
  });

  it('exposes a refetch function', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(typeof result.current.refetch).toBe('function');
  });

  it('calling refetch triggers both adapter methods again', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(DEFAULT_PARAMS), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const rowsCallCount = mockFindAllWithStats.mock.calls.length;
    const kpiCallCount = mockFindClienteKPI.mock.calls.length;

    result.current.refetch();

    await waitFor(() => {
      expect(mockFindAllWithStats.mock.calls.length).toBeGreaterThan(rowsCallCount);
      expect(mockFindClienteKPI.mock.calls.length).toBeGreaterThan(kpiCallCount);
    });
  });
});
