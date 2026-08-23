/**
 * useCentroDetail.test.ts
 *
 * Tests the useCentroDetail hook's data fetching, occupancy derivation, and
 * KPI computation logic.
 *
 * Mock strategy: SupabaseSalaAdapter and SupabaseDashboardAdapter are mocked
 * as class constructors so `new XAdapter()` at module load time works.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ISala } from '@domain/models';

// ── Adapter mocks ─────────────────────────────────────────────────────────────

const mockSalaFindByCentro = vi.fn();
const mockFetchTodayAppointments = vi.fn();

vi.mock('@infra/adapters/SupabaseSalaAdapter', () => ({
  SupabaseSalaAdapter: class {
    findByCentro(...args: unknown[]) {
      return mockSalaFindByCentro(...args);
    }
    findById() {
      return Promise.resolve(null);
    }
    findActivasByCentro() {
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
    fetchTodayAppointments(...args: unknown[]) {
      return mockFetchTodayAppointments(...args);
    }
    fetchAllSalas() {
      return Promise.resolve([]);
    }
    fetchNetworkTodayCitas() {
      return Promise.resolve([]);
    }
    fetchStaffByCentros() {
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

import { useCentroDetail } from './useCentroDetail';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function makeSala(id: number, centroId = 1, activa = true): ISala {
  return { id, centroId, nombre: `Sala ${id}`, capacidad: 2, activa, descripcion: null };
}

/** ICitaConJoins-shaped cita for fetchTodayAppointments */
function makeCita(id: number, salaId: number, estado: string, precio: number | null = null) {
  return {
    id,
    sala_id: salaId,
    fecha_inicio: new Date().toISOString(),
    fecha_fin: new Date().toISOString(),
    estado,
    cliente_id: 1,
    usuario_id: 1,
    clientes: null,
    usuarios: null,
    salas: null,
    servicios: precio !== null ? { nombre: 'Masaje', duracion: 60, precio } : null,
  };
}

// ── Tests: disabled when centroId is null ─────────────────────────────────────

describe('useCentroDetail — disabled when centroId is null', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not call the sala adapter when centroId is null', async () => {
    const { result } = renderHook(() => useCentroDetail(null), {
      wrapper: createWrapper(),
    });

    // Small wait to ensure no pending queries fire
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockSalaFindByCentro).not.toHaveBeenCalled();
    expect(mockFetchTodayAppointments).not.toHaveBeenCalled();
  });

  it('returns empty salas when centroId is null', async () => {
    const { result } = renderHook(() => useCentroDetail(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.salas).toHaveLength(0);
  });
});

// ── Tests: fetches salas via salaAdapter.findByCentro ────────────────────────

describe('useCentroDetail — sala fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTodayAppointments.mockResolvedValue([]);
  });

  it('calls salaAdapter.findByCentro with the provided centroId', async () => {
    mockSalaFindByCentro.mockResolvedValue([]);

    renderHook(() => useCentroDetail(5), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockSalaFindByCentro).toHaveBeenCalledWith(5);
    });
  });

  it('exposes salas returned by the adapter', async () => {
    const salas = [makeSala(1), makeSala(2)];
    mockSalaFindByCentro.mockResolvedValue(salas);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.salas).toHaveLength(2);
    expect(result.current.salas[0].id).toBe(1);
    expect(result.current.salas[1].id).toBe(2);
  });

  it('exposes empty salas when adapter returns empty array', async () => {
    mockSalaFindByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.salas).toHaveLength(0);
  });
});

// ── Tests: occupancy uses sala_id comparison ──────────────────────────────────

describe('useCentroDetail — salaOccupancy (sala_id === sala.id)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks hasActiveCita=true for sala with en_curso cita', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10)]);
    mockFetchTodayAppointments.mockResolvedValue([makeCita(1, 10, 'en_curso')]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const occ = result.current.salaOccupancy.get(10);
    expect(occ?.hasActiveCita).toBe(true);
    expect(occ?.slotsUsed).toBe(1);
  });

  it('marks hasActiveCita=false for sala with no en_curso cita', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10)]);
    mockFetchTodayAppointments.mockResolvedValue([makeCita(1, 10, 'completada')]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const occ = result.current.salaOccupancy.get(10);
    expect(occ?.hasActiveCita).toBe(false);
    expect(occ?.slotsUsed).toBe(0);
  });

  it('does not count citas from a different sala', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10), makeSala(20)]);
    // cita is in sala 20 — sala 10 should remain unoccupied
    mockFetchTodayAppointments.mockResolvedValue([makeCita(1, 20, 'en_curso')]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.salaOccupancy.get(10)?.hasActiveCita).toBe(false);
    expect(result.current.salaOccupancy.get(20)?.hasActiveCita).toBe(true);
  });

  it('caps slotsUsed at TOTAL_SLOTS (10)', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10)]);
    // 12 en_curso citas in sala 10 → slotsUsed should be capped at 10
    mockFetchTodayAppointments.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => makeCita(i + 1, 10, 'en_curso')),
    );

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.salaOccupancy.get(10)?.slotsUsed).toBe(10);
  });
});

// ── Tests: detailKPIs.sesionesHoy ─────────────────────────────────────────────

describe('useCentroDetail — detailKPIs.sesionesHoy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts en_curso and completada citas', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10)]);
    mockFetchTodayAppointments.mockResolvedValue([
      makeCita(1, 10, 'en_curso'),
      makeCita(2, 10, 'completada'),
      makeCita(3, 10, 'pendiente'),
    ]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detailKPIs.sesionesHoy).toBe(2);
  });

  it('returns 0 sesionesHoy when no citas', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10)]);
    mockFetchTodayAppointments.mockResolvedValue([]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detailKPIs.sesionesHoy).toBe(0);
  });

  it('does not count cancelada citas in sesionesHoy', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10)]);
    mockFetchTodayAppointments.mockResolvedValue([
      makeCita(1, 10, 'cancelada'),
      makeCita(2, 10, 'no_presentado'),
    ]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detailKPIs.sesionesHoy).toBe(0);
  });
});

// ── Tests: detailKPIs.ocupacionPct ────────────────────────────────────────────

describe('useCentroDetail — detailKPIs.ocupacionPct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes ocupacion as (en_curso citas / sala count) * 100', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(10), makeSala(11)]);
    mockFetchTodayAppointments.mockResolvedValue([makeCita(1, 10, 'en_curso')]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detailKPIs.ocupacionPct).toBe(50);
  });

  it('returns 0 ocupacionPct when no salas', async () => {
    mockSalaFindByCentro.mockResolvedValue([]);
    mockFetchTodayAppointments.mockResolvedValue([makeCita(1, 10, 'en_curso')]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detailKPIs.ocupacionPct).toBe(0);
  });
});

// ── Tests: detailKPIs.salaCount ───────────────────────────────────────────────

describe('useCentroDetail — detailKPIs.salaCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reflects the number of salas returned', async () => {
    mockSalaFindByCentro.mockResolvedValue([makeSala(1), makeSala(2), makeSala(3)]);
    mockFetchTodayAppointments.mockResolvedValue([]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.detailKPIs.salaCount).toBe(3);
  });
});

// ── Tests: error state ────────────────────────────────────────────────────────

describe('useCentroDetail — error state', () => {
  beforeEach(() => vi.clearAllMocks());

  it('isError is true when sala adapter throws', async () => {
    mockSalaFindByCentro.mockRejectedValue(new Error('Sala DB error'));
    mockFetchTodayAppointments.mockResolvedValue([]);

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('isError is true when citas adapter throws', async () => {
    mockSalaFindByCentro.mockResolvedValue([]);
    mockFetchTodayAppointments.mockRejectedValue(new Error('Citas DB error'));

    const { result } = renderHook(() => useCentroDetail(1), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
