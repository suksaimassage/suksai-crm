/**
 * useTerapeutas.test.ts
 *
 * Tests for the useTerapeutas orchestrating hook.
 * Strategy:
 *   - Mock SupabaseTerapeutasAdapter at class level so all 5 methods are controllable.
 *   - Wrap renderHook in a real QueryClientProvider (no staleTime override needed because
 *     each test gets a fresh QueryClient).
 *   - Domain service calls execute against real implementations — they are pure functions.
 *   - No snapshot tests. No CSS assertions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode, ReactElement } from 'react';

// ── Mock adapter at module level (before hook import) ─────────────────────────

const mockAdapter = {
  fetchTerapeutasByCentro: vi.fn(),
  fetchWeekCitasForUsuarios: vi.fn(),
  fetchHorariosForUsuarios: vi.fn(),
  fetchAusenciasForUsuarios: vi.fn(),
  fetchCurrentCitasForCentro: vi.fn(),
};

vi.mock('@infra/adapters/SupabaseTerapeutasAdapter', () => ({
  SupabaseTerapeutasAdapter: class {
    fetchTerapeutasByCentro = mockAdapter.fetchTerapeutasByCentro;
    fetchWeekCitasForUsuarios = mockAdapter.fetchWeekCitasForUsuarios;
    fetchHorariosForUsuarios = mockAdapter.fetchHorariosForUsuarios;
    fetchAusenciasForUsuarios = mockAdapter.fetchAusenciasForUsuarios;
    fetchCurrentCitasForCentro = mockAdapter.fetchCurrentCitasForCentro;
  },
}));

// Import AFTER mock is registered
const { useTerapeutas } = await import('@infra/hooks/useTerapeutas');

// ── Fixtures ───────────────────────────────────────────────────────────────────

const CENTRO_ID = 5;

const rawTerapeuta = {
  id: 1,
  nombre: 'Ana García',
  email: 'ana@example.com',
  is_active: true,
  created_at: '2023-01-15T00:00:00Z',
};

const rawHorario = {
  id: 10,
  usuario_id: 1,
  tipo: 'recurrente',
  dia_semana: 1,
  fecha: null,
  hora_inicio: '09:00',
  hora_fin: '17:00',
};

const rawCitaSemana = {
  id: 100,
  usuario_id: 1,
  fecha_inicio: new Date().toISOString(),
  fecha_fin: new Date(Date.now() + 3600_000).toISOString(),
  estado: 'completada',
  servicios: { nombre: 'Masaje Tailandés', precio: 60 },
};

const rawCurrentCita = {
  id: 200,
  usuario_id: 1,
  sala_id: 3,
  estado: 'en_curso',
  fecha_inicio: new Date(Date.now() - 1800_000).toISOString(),
  fecha_fin: new Date(Date.now() + 1800_000).toISOString(),
  salas: { id: 3, nombre: 'Sala Zen' },
};

// ── Wrapper factory ────────────────────────────────────────────────────────────

function makeWrapper(): ({ children }: { children: ReactNode }) => ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => QueryClientProvider({ client: qc, children });
}

// ── Reset mocks before each test ───────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAdapter.fetchTerapeutasByCentro.mockResolvedValue([rawTerapeuta]);
  mockAdapter.fetchWeekCitasForUsuarios.mockResolvedValue([rawCitaSemana]);
  mockAdapter.fetchHorariosForUsuarios.mockResolvedValue([rawHorario]);
  mockAdapter.fetchAusenciasForUsuarios.mockResolvedValue([]);
  mockAdapter.fetchCurrentCitasForCentro.mockResolvedValue([]);
});

// ── null centroId ─────────────────────────────────────────────────────────────

describe('useTerapeutas — null centroId', () => {
  it('returns empty data and isLoading=false when centroId is null', () => {
    const { result } = renderHook(() => useTerapeutas(null), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('does not call any adapter method when centroId is null', () => {
    renderHook(() => useTerapeutas(null), { wrapper: makeWrapper() });

    expect(mockAdapter.fetchTerapeutasByCentro).not.toHaveBeenCalled();
    expect(mockAdapter.fetchWeekCitasForUsuarios).not.toHaveBeenCalled();
  });
});

// ── successful fetch ──────────────────────────────────────────────────────────

describe('useTerapeutas — successful fetch', () => {
  it('assembles an ITerapeutaAggregate with correct usuarioId and nombre', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]?.usuarioId).toBe(1);
    expect(result.current.data[0]?.nombre).toBe('Ana García');
  });

  it('sets activo from is_active flag', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.activo).toBe(true);
  });

  it('parses createdAt as a Date', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.createdAt).toBeInstanceOf(Date);
    expect(result.current.data[0]?.createdAt.getFullYear()).toBe(2023);
  });

  it('valoracionMedia is always null at MVP', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.valoracionMedia).toBeNull();
  });

  it('computes sesionesEstaSemana from completed citas', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // rawCitaSemana has estado='completada' for usuarioId=1
    expect(result.current.data[0]?.sesionesEstaSemana).toBe(1);
  });

  it('computes ingresosSemana from completed citas precio', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.ingresosSemana).toBe(60);
  });

  it('computes totalHorasSemana from fixed horarios', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // rawHorario: 09:00–17:00 = 8 h
    expect(result.current.data[0]?.totalHorasSemana).toBe(8);
  });

  it('derives especialidades from completed cita service names', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.especialidades).toContain('Masaje Tailandés');
  });
});

// ── en_sala status ────────────────────────────────────────────────────────────

describe('useTerapeutas — en_sala status derivation', () => {
  it('sets estadoActual to en_sala when a current cita exists', async () => {
    mockAdapter.fetchCurrentCitasForCentro.mockResolvedValue([rawCurrentCita]);

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.estadoActual).toBe('en_sala');
  });

  it('populates salaActual from the joined sala name', async () => {
    mockAdapter.fetchCurrentCitasForCentro.mockResolvedValue([rawCurrentCita]);

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.salaActual).toBe('Sala Zen');
  });

  it('salaActual is null when no current cita exists', async () => {
    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.salaActual).toBeNull();
  });
});

// ── empty therapist list ──────────────────────────────────────────────────────

describe('useTerapeutas — empty therapist list', () => {
  it('returns empty data array when no therapists are found', async () => {
    mockAdapter.fetchTerapeutasByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });

  it('does not call downstream adapters when therapist list is empty', async () => {
    mockAdapter.fetchTerapeutasByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockAdapter.fetchWeekCitasForUsuarios).not.toHaveBeenCalled();
    expect(mockAdapter.fetchHorariosForUsuarios).not.toHaveBeenCalled();
    expect(mockAdapter.fetchAusenciasForUsuarios).not.toHaveBeenCalled();
  });
});

// ── error state ───────────────────────────────────────────────────────────────

describe('useTerapeutas — error state', () => {
  it('sets isError=true when adapter throws', async () => {
    mockAdapter.fetchTerapeutasByCentro.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('returns a refetch function', () => {
    const { result } = renderHook(() => useTerapeutas(null), {
      wrapper: makeWrapper(),
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

// ── proximaCita ───────────────────────────────────────────────────────────────

describe('useTerapeutas — proximaCita', () => {
  it('is null when no future citas exist', async () => {
    // rawCitaSemana already happened (fecha_inicio = now, estado = completada)
    mockAdapter.fetchWeekCitasForUsuarios.mockResolvedValue([]);

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.proximaCita).toBeNull();
  });

  it('is set to the earliest future confirmed cita', async () => {
    const futureDate = new Date(Date.now() + 7200_000).toISOString();
    const futureCita = {
      id: 300,
      usuario_id: 1,
      fecha_inicio: futureDate,
      fecha_fin: new Date(Date.now() + 10800_000).toISOString(),
      estado: 'confirmada',
      servicios: null,
    };
    mockAdapter.fetchWeekCitasForUsuarios.mockResolvedValue([futureCita]);

    const { result } = renderHook(() => useTerapeutas(CENTRO_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0]?.proximaCita).toBeInstanceOf(Date);
    expect(result.current.data[0]?.proximaCita?.toISOString()).toBe(futureDate);
  });
});
