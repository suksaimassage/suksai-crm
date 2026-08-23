/**
 * useCentrosPage.test.ts
 *
 * Tests the useCentrosPage hook's aggregation and KPI derivation logic.
 *
 * Mock strategy: SupabaseCentroAdapter and SupabaseDashboardAdapter are mocked
 * as classes so `new XAdapter()` (called at module load time) works correctly.
 * Module-level vi.fn() refs are used for per-test configuration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { IPaginatedResult } from '@domain/types';
import type { ICentro } from '@domain/models';

// ── Adapter mocks ─────────────────────────────────────────────────────────────

const mockCentroFindAll = vi.fn();
const mockFetchAllSalas = vi.fn();
const mockFetchNetworkTodayCitas = vi.fn();
const mockFetchStaffByCentros = vi.fn();

vi.mock('@infra/adapters/SupabaseCentroAdapter', () => ({
  SupabaseCentroAdapter: class {
    findAll(...args: unknown[]) {
      return mockCentroFindAll(...args);
    }
    findById() {
      return Promise.resolve(null);
    }
    findActivos() {
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

vi.mock('@infra/adapters/SupabaseDashboardAdapter', () => ({
  SupabaseDashboardAdapter: class {
    fetchAllSalas(...args: unknown[]) {
      return mockFetchAllSalas(...args);
    }
    fetchNetworkTodayCitas(...args: unknown[]) {
      return mockFetchNetworkTodayCitas(...args);
    }
    fetchStaffByCentros(...args: unknown[]) {
      return mockFetchStaffByCentros(...args);
    }
    fetchTodayAppointments() {
      return Promise.resolve([]);
    }
    fetchWeekAppointmentsWithPrices() {
      return Promise.resolve([]);
    }
    fetchTopClientData() {
      return Promise.resolve([]);
    }
    fetchFutureAppointmentsByClients() {
      return Promise.resolve([]);
    }
    fetchTerapeutaTodayAppointments() {
      return Promise.resolve([]);
    }
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useCentrosPage } from './useCentrosPage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function makePaginatedCentros(centros: ICentro[]): IPaginatedResult<ICentro> {
  return {
    data: centros,
    total: centros.length,
    page: 1,
    perPage: 50,
    totalPages: 1,
  };
}

function makeCentro(overrides: Partial<ICentro> = {}): ICentro {
  return {
    id: overrides.id ?? 1,
    nombre: overrides.nombre ?? 'Centro Test',
    direccion: overrides.direccion ?? 'Calle Test 1',
    ciudad: overrides.ciudad ?? 'Madrid',
    codigoPostal: overrides.codigoPostal ?? '28001',
    telefono: overrides.telefono ?? null,
    email: overrides.email ?? null,
    activo: overrides.activo ?? true,
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
  };
}

// Sala raw shape expected by useCentrosPage (via dashboardAdapter.fetchAllSalas)
function makeSalaRaw(id: number, centroId: number, activa = true) {
  return { id, centro_id: centroId, nombre: `Sala ${id}`, activa };
}

// Network cita shape expected by useCentrosPage (via dashboardAdapter.fetchNetworkTodayCitas)
function makeNetworkCita(centroId: number, salaId: number | null, estado: string) {
  return { centro_id: centroId, sala_id: salaId, estado, servicios: null };
}

// Staff shape expected by useCentrosPage (via dashboardAdapter.fetchStaffByCentros)
function makeStaff(centroId: number, usuarioId: number) {
  return { centro_id: centroId, usuario_id: usuarioId };
}

// ── Tests: loading state ──────────────────────────────────────────────────────

describe('useCentrosPage — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isLoading is true when centros query is pending', () => {
    mockCentroFindAll.mockReturnValue(new Promise(() => {}));
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('isLoading is true when salas query is pending', () => {
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));
    mockFetchAllSalas.mockReturnValue(new Promise(() => {}));
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('isLoading transitions to false after all queries resolve', async () => {
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

// ── Tests: error state ────────────────────────────────────────────────────────

describe('useCentrosPage — error state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isError is true when centros query fails', async () => {
    mockCentroFindAll.mockRejectedValue(new Error('DB error'));
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('isError is true when salas query fails', async () => {
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));
    mockFetchAllSalas.mockRejectedValue(new Error('Salas error'));
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('centros falls back to [] when query fails', async () => {
    mockCentroFindAll.mockRejectedValue(new Error('fail'));
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.centros).toHaveLength(0);
  });
});

// ── Tests: centros extraction from IPaginatedResult ───────────────────────────

describe('useCentrosPage — centros extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);
  });

  it('extracts centros from .data field of IPaginatedResult', async () => {
    const centro = makeCentro({ id: 1, nombre: 'Centro Ibiza' });
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([centro]));

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.centros).toHaveLength(1);
    expect(result.current.centros[0].nombre).toBe('Centro Ibiza');
  });

  it('returns empty centros array when paginated result has empty data', async () => {
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.centros).toHaveLength(0);
  });
});

// ── Tests: networkKPIs.centrosActivos ─────────────────────────────────────────

describe('useCentrosPage — networkKPIs.centrosActivos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);
  });

  it('counts only centros with activo=true', async () => {
    const centros = [
      makeCentro({ id: 1, activo: true }),
      makeCentro({ id: 2, activo: false }),
      makeCentro({ id: 3, activo: true }),
    ];
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros(centros));

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.centrosActivos).toBe(2);
  });

  it('returns 0 centrosActivos when all are inactive', async () => {
    const centros = [makeCentro({ id: 1, activo: false })];
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros(centros));

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.centrosActivos).toBe(0);
  });
});

// ── Tests: networkKPIs.enMantenimiento ───────────────────────────────────────

describe('useCentrosPage — networkKPIs.enMantenimiento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);
  });

  it('counts salas with activa=false', async () => {
    mockFetchAllSalas.mockResolvedValue([
      makeSalaRaw(1, 1, true),
      makeSalaRaw(2, 1, false),
      makeSalaRaw(3, 2, false),
    ]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.enMantenimiento).toBe(2);
  });

  it('returns 0 when all salas are active', async () => {
    mockFetchAllSalas.mockResolvedValue([makeSalaRaw(1, 1, true)]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.enMantenimiento).toBe(0);
  });
});

// ── Tests: networkKPIs.salasTotales ──────────────────────────────────────────

describe('useCentrosPage — networkKPIs.salasTotales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);
  });

  it('counts all salas regardless of activa flag', async () => {
    mockFetchAllSalas.mockResolvedValue([
      makeSalaRaw(1, 1, true),
      makeSalaRaw(2, 1, false),
      makeSalaRaw(3, 2, true),
    ]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.salasTotales).toBe(3);
  });
});

// ── Tests: networkKPIs.ocupacionHoyPct ───────────────────────────────────────

describe('useCentrosPage — networkKPIs.ocupacionHoyPct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([]));
    mockFetchStaffByCentros.mockResolvedValue([]);
  });

  it('computes ocupacion as (en_curso citas / total salas) * 100, rounded', async () => {
    mockFetchAllSalas.mockResolvedValue([
      makeSalaRaw(1, 1),
      makeSalaRaw(2, 1),
      makeSalaRaw(3, 1),
      makeSalaRaw(4, 2),
    ]);
    // 1 en_curso cita out of 4 salas = 25%
    mockFetchNetworkTodayCitas.mockResolvedValue([makeNetworkCita(1, 1, 'en_curso')]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.ocupacionHoyPct).toBe(25);
  });

  it('returns 0 when there are no salas', async () => {
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([makeNetworkCita(1, 1, 'en_curso')]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.ocupacionHoyPct).toBe(0);
  });

  it('ignores non-en_curso citas when computing ocupacion', async () => {
    mockFetchAllSalas.mockResolvedValue([makeSalaRaw(1, 1)]);
    mockFetchNetworkTodayCitas.mockResolvedValue([
      makeNetworkCita(1, 1, 'completada'),
      makeNetworkCita(1, 1, 'pendiente'),
    ]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.ocupacionHoyPct).toBe(0);
  });

  it('rounds fractional occupancy percentage', async () => {
    mockFetchAllSalas.mockResolvedValue([makeSalaRaw(1, 1), makeSalaRaw(2, 1), makeSalaRaw(3, 1)]);
    // 1/3 = 33.33... → rounds to 33
    mockFetchNetworkTodayCitas.mockResolvedValue([makeNetworkCita(1, 1, 'en_curso')]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkKPIs.ocupacionHoyPct).toBe(33);
  });
});

// ── Tests: centroStats per centro ─────────────────────────────────────────────

describe('useCentrosPage — centroStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes salaCount per centro', async () => {
    const c1 = makeCentro({ id: 1 });
    const c2 = makeCentro({ id: 2 });
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([c1, c2]));
    mockFetchAllSalas.mockResolvedValue([makeSalaRaw(1, 1), makeSalaRaw(2, 1), makeSalaRaw(3, 2)]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.centroStats.get(1)?.salaCount).toBe(2);
    expect(result.current.centroStats.get(2)?.salaCount).toBe(1);
  });

  it('computes staffCount per centro', async () => {
    const c1 = makeCentro({ id: 1 });
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([c1]));
    mockFetchAllSalas.mockResolvedValue([]);
    mockFetchNetworkTodayCitas.mockResolvedValue([]);
    mockFetchStaffByCentros.mockResolvedValue([
      makeStaff(1, 10),
      makeStaff(1, 11),
      makeStaff(2, 12),
    ]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.centroStats.get(1)?.staffCount).toBe(2);
  });

  it('computes ocupacionPct per centro based on en_curso citas in that centro salas', async () => {
    const c1 = makeCentro({ id: 1 });
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([c1]));
    // 2 salas for centro 1
    mockFetchAllSalas.mockResolvedValue([makeSalaRaw(10, 1), makeSalaRaw(11, 1)]);
    // 1 en_curso cita in sala 10
    mockFetchNetworkTodayCitas.mockResolvedValue([makeNetworkCita(1, 10, 'en_curso')]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 1 active / 2 salas = 50%
    expect(result.current.centroStats.get(1)?.ocupacionPct).toBe(50);
  });

  it('returns 0 ocupacionPct when centro has no salas', async () => {
    const c1 = makeCentro({ id: 1 });
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([c1]));
    mockFetchAllSalas.mockResolvedValue([]); // no salas
    mockFetchNetworkTodayCitas.mockResolvedValue([makeNetworkCita(1, 1, 'en_curso')]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.centroStats.get(1)?.ocupacionPct).toBe(0);
  });

  it('does not count citas from other centros when computing centroStats', async () => {
    const c1 = makeCentro({ id: 1 });
    const c2 = makeCentro({ id: 2 });
    mockCentroFindAll.mockResolvedValue(makePaginatedCentros([c1, c2]));
    mockFetchAllSalas.mockResolvedValue([makeSalaRaw(10, 1), makeSalaRaw(20, 2)]);
    // cita is in centro 2 sala 20 — should not count for centro 1
    mockFetchNetworkTodayCitas.mockResolvedValue([makeNetworkCita(2, 20, 'en_curso')]);
    mockFetchStaffByCentros.mockResolvedValue([]);

    const { result } = renderHook(() => useCentrosPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.centroStats.get(1)?.ocupacionPct).toBe(0);
    expect(result.current.centroStats.get(2)?.ocupacionPct).toBe(100);
  });
});
