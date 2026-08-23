/**
 * useAdminWeekData.test.ts
 *
 * Hook tests for useAdminWeekData.
 * Mock strategy:
 *   - SupabaseAgendaAdapter mocked as a real class (module-level singleton in hook).
 *   - fetchWeekCitas and fetchDayTerapeutas exposed via module-level vi.fn() refs.
 *   - Real AgendaEnrichmentService runs — no domain mocking.
 *   - Wrapped in real QueryClient (retry: false to surface errors immediately).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mock (must precede hook import) ───────────────────────────────────

const mockFetchWeekCitas = vi.fn();
const mockFetchDayTerapeutas = vi.fn();

vi.mock('@infra/adapters/SupabaseAgendaAdapter', () => ({
  SupabaseAgendaAdapter: class MockAgendaAdapter {
    fetchWeekCitas(...args: unknown[]) {
      return mockFetchWeekCitas(...args);
    }
    fetchDayTerapeutas(...args: unknown[]) {
      return mockFetchDayTerapeutas(...args);
    }
    fetchMonthCitas() {
      return Promise.resolve([]);
    }
    fetchTherapistWeekCitas() {
      return Promise.resolve([]);
    }
  },
}));

// ── Hook import (after mock) ──────────────────────────────────────────────────

import { useAdminWeekData } from '@infra/hooks/useAdminWeekData';
import type { IAgendaRawCita, IAgendaTerapeutaRow } from '@domain/models/agenda.models';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    clientName: 'Test Client',
    serviceName: 'Masaje Test',
    sala: 'Sala 1',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'confirmada',
    precio: 60,
    ...overrides,
  };
}

const TERAPEUTA_1: IAgendaTerapeutaRow = {
  id: 1,
  nombre: 'Naree',
  apellidos: 'Test',
  isActive: true,
};

const WEEK_START = '2026-05-18';

// ── centroId=null guard ───────────────────────────────────────────────────────

describe('useAdminWeekData — centroId=null guard', () => {
  beforeEach(() => {
    mockFetchWeekCitas.mockReset();
    mockFetchDayTerapeutas.mockReset();
  });

  it('returns empty weekDays when centroId is null', () => {
    const { result } = renderHook(() => useAdminWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.weekDays).toEqual([]);
  });

  it('returns empty therapists when centroId is null', () => {
    const { result } = renderHook(() => useAdminWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.therapists).toEqual([]);
  });

  it('returns empty colorMap when centroId is null', () => {
    const { result } = renderHook(() => useAdminWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.colorMap).toEqual({});
  });

  it('returns isLoading=false when centroId is null', () => {
    const { result } = renderHook(() => useAdminWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('does NOT call adapter methods when centroId is null', () => {
    renderHook(() => useAdminWeekData(null, WEEK_START), { wrapper: createWrapper() });
    expect(mockFetchWeekCitas).not.toHaveBeenCalled();
    expect(mockFetchDayTerapeutas).not.toHaveBeenCalled();
  });
});

// ── Successful fetch ──────────────────────────────────────────────────────────

describe('useAdminWeekData — successful fetch', () => {
  beforeEach(() => {
    mockFetchWeekCitas.mockResolvedValue([makeRawCita()]);
    mockFetchDayTerapeutas.mockResolvedValue([TERAPEUTA_1]);
  });

  it('weekDays has 7 items (one per day of the week)', async () => {
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.weekDays).toHaveLength(7);
  });

  it('therapists array built from terapeutas', async () => {
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.therapists).toHaveLength(1);
    expect(result.current.therapists[0]?.nombre).toBe('Naree');
  });

  it('colorMap maps therapist id to a color slot', async () => {
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.colorMap[1]).toBe('a');
  });

  it('each weekDay carries a real citaCount derived from the raw citas', async () => {
    // Two citas on Monday (week start), one on Tuesday.
    mockFetchWeekCitas.mockResolvedValue([
      makeRawCita({ id: 1, startIso: '2026-05-18T10:00:00', endIso: '2026-05-18T11:00:00' }),
      makeRawCita({ id: 2, startIso: '2026-05-18T12:00:00', endIso: '2026-05-18T13:00:00' }),
      makeRawCita({ id: 3, startIso: '2026-05-19T10:00:00', endIso: '2026-05-19T11:00:00' }),
    ]);
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.weekDays[0]?.citaCount).toBe(2); // Monday
    expect(result.current.weekDays[1]?.citaCount).toBe(1); // Tuesday
    expect(result.current.weekDays[2]?.citaCount).toBe(0); // Wednesday
  });
});

// ── enabled flag (overlay closed → no fetch) ───────────────────────────────────

describe('useAdminWeekData — enabled flag', () => {
  beforeEach(() => {
    // reset call counts — the module-level mocks accumulate across describes
    mockFetchWeekCitas.mockReset();
    mockFetchDayTerapeutas.mockReset();
    mockFetchWeekCitas.mockResolvedValue([makeRawCita()]);
    mockFetchDayTerapeutas.mockResolvedValue([TERAPEUTA_1]);
  });

  it('does NOT query while disabled (overlay closed) and returns empty weekDays', () => {
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START, false), {
      wrapper: createWrapper(),
    });
    expect(mockFetchWeekCitas).not.toHaveBeenCalled();
    expect(mockFetchDayTerapeutas).not.toHaveBeenCalled();
    expect(result.current.weekDays).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('queries once enabled flips to true', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useAdminWeekData(1, WEEK_START, enabled),
      { wrapper: createWrapper(), initialProps: { enabled: false } },
    );
    expect(mockFetchWeekCitas).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => {
      expect(result.current.weekDays).toHaveLength(7);
    });
    expect(mockFetchWeekCitas).toHaveBeenCalled();
  });

  it('isLoading becomes false after data resolves', async () => {
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isError).toBe(false);
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('useAdminWeekData — error state', () => {
  beforeEach(() => {
    mockFetchWeekCitas.mockRejectedValue(new Error('Network error'));
    mockFetchDayTerapeutas.mockResolvedValue([]);
  });

  it('isError=true when adapter throws', async () => {
    const { result } = renderHook(() => useAdminWeekData(1, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
