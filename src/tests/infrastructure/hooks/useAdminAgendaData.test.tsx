/**
 * useAdminAgendaData.test.tsx
 *
 * Tests the EXTENDED admin agenda data hook: real computed alerts, the 5-card
 * KPI strip, and the adminCount badge value.
 *
 * Mock strategy (mirrors useAdminWeekData.test.tsx): SupabaseAgendaAdapter mocked
 * as a real class; fetchDayCitas / fetchDayTerapeutas / fetchDayCancelledCitas
 * exposed via module-level vi.fn()s. The REAL AgendaEnrichmentService runs (no
 * domain mocking). Real QueryClient, retry:false.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockFetchDayCitas = vi.fn();
const mockFetchDayTerapeutas = vi.fn();
const mockFetchDayCancelledCitas = vi.fn();
const mockFetchDayUnassignedCitas = vi.fn();
const mockFetchDayHorarios = vi.fn();

vi.mock('@infra/adapters/SupabaseAgendaAdapter', () => ({
  SupabaseAgendaAdapter: class {
    fetchDayCitas(...a: unknown[]): unknown {
      return mockFetchDayCitas(...a);
    }
    fetchDayTerapeutas(...a: unknown[]): unknown {
      return mockFetchDayTerapeutas(...a);
    }
    fetchDayCancelledCitas(...a: unknown[]): unknown {
      return mockFetchDayCancelledCitas(...a);
    }
    fetchDayUnassignedCitas(...a: unknown[]): unknown {
      return mockFetchDayUnassignedCitas(...a);
    }
    fetchDayHorarios(...a: unknown[]): unknown {
      return mockFetchDayHorarios(...a);
    }
  },
}));

import { useAdminAgendaData } from '@infra/hooks/useAdminAgendaData';
import type { IAgendaRawCita, IAgendaTerapeutaRow } from '@domain/models/agenda.models';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeRawCita(overrides: Partial<IAgendaRawCita> = {}): IAgendaRawCita {
  return {
    id: 1,
    therapistId: 1,
    startIso: '2026-05-18T10:00:00',
    endIso: '2026-05-18T11:00:00',
    durationMin: 60,
    clientName: 'Cliente',
    serviceName: 'Masaje',
    sala: 'Sala 1',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'confirmada',
    precio: 5000,
    ...overrides,
  };
}

const TERAPEUTA: IAgendaTerapeutaRow = { id: 1, nombre: 'Naree', apellidos: '', isActive: true };
const DATE = '2026-05-18';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no unassigned citas. Individual tests override when asserting the
  // "Sin asignación" wiring. Prevents enrichAppointments(undefined) after
  // clearAllMocks wipes the resolved value.
  mockFetchDayUnassignedCitas.mockResolvedValue([]);
});

// ── centroId=null guard ─────────────────────────────────────────────────────────

describe('useAdminAgendaData — centroId=null guard', () => {
  it('returns empty appointments/therapists/kpis/alerts and does not fetch', () => {
    const { result } = renderHook(() => useAdminAgendaData(null, DATE), {
      wrapper: createWrapper(),
    });
    expect(result.current.appointments).toEqual([]);
    expect(result.current.therapists).toEqual([]);
    expect(result.current.kpis).toEqual([]);
    expect(result.current.alerts).toEqual([]);
    expect(result.current.adminCount).toBe(0);
    expect(mockFetchDayCitas).not.toHaveBeenCalled();
  });

  it('still exposes the static legend items even with null centro', () => {
    const { result } = renderHook(() => useAdminAgendaData(null, DATE), {
      wrapper: createWrapper(),
    });
    expect(result.current.legendItems.length).toBeGreaterThan(0);
  });
});

// ── Successful load ─────────────────────────────────────────────────────────────

describe('useAdminAgendaData — successful load', () => {
  beforeEach(() => {
    mockFetchDayCitas.mockResolvedValue([makeRawCita({ id: 1 }), makeRawCita({ id: 2 })]);
    mockFetchDayTerapeutas.mockResolvedValue([TERAPEUTA]);
    mockFetchDayCancelledCitas.mockResolvedValue([]);
    mockFetchDayHorarios.mockResolvedValue([]);
  });

  it('returns exactly 5 KPI cards', async () => {
    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.kpis).toHaveLength(5);
  });

  it('adminCount mirrors the reservas-hoy KPI (real citas count)', async () => {
    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    const reservas = result.current.kpis.find((k) => k.id === 'reservas-hoy');
    expect(result.current.adminCount).toBe(reservas?.value);
    expect(result.current.adminCount).toBe(2);
  });

  it('enriches appointments from the raw day citas', async () => {
    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.appointments).toHaveLength(2);
  });

  it('derives therapists from the terapeuta rows', async () => {
    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.therapists).toHaveLength(1);
    expect(result.current.therapists[0]?.nombre).toBe('Naree');
  });
});

// ── Computed alerts ──────────────────────────────────────────────────────────────

describe('useAdminAgendaData — computed alerts', () => {
  it('produces a double-booking alert from overlapping same-therapist citas', async () => {
    mockFetchDayCitas.mockResolvedValue([
      makeRawCita({
        id: 1,
        therapistId: 1,
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ]);
    mockFetchDayTerapeutas.mockResolvedValue([TERAPEUTA]);
    mockFetchDayCancelledCitas.mockResolvedValue([]);
    mockFetchDayHorarios.mockResolvedValue([]);

    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.alerts.filter((a) => a.type === 'double_booking')).toHaveLength(1);
  });

  it('produces a cancellation alert from the cancelled-citas fetch', async () => {
    mockFetchDayCitas.mockResolvedValue([makeRawCita({ id: 1 })]);
    mockFetchDayTerapeutas.mockResolvedValue([TERAPEUTA]);
    mockFetchDayCancelledCitas.mockResolvedValue([
      makeRawCita({ id: 9, estado: 'cancelada', clientName: 'Lucía' }),
    ]);
    mockFetchDayHorarios.mockResolvedValue([]);

    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    const cancellations = result.current.alerts.filter((a) => a.type === 'cancellation');
    expect(cancellations).toHaveLength(1);
    expect(cancellations[0]?.message).toContain('Lucía');
  });
});

// ── Error state ──────────────────────────────────────────────────────────────────

describe('useAdminAgendaData — error state', () => {
  it('isError=true when a fetch rejects', async () => {
    mockFetchDayCitas.mockRejectedValue(new Error('network'));
    mockFetchDayTerapeutas.mockResolvedValue([]);
    mockFetchDayCancelledCitas.mockResolvedValue([]);
    mockFetchDayHorarios.mockResolvedValue([]);

    const { result } = renderHook(() => useAdminAgendaData(1, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.adminCount).toBe(0);
  });
});
