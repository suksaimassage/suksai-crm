/**
 * useTherapistWeekData.test.ts
 *
 * Hook tests for useTherapistWeekData.
 * Mock strategy:
 *   - SupabaseAgendaAdapter mocked as a real class (module-level singleton in hook).
 *   - fetchTherapistWeekCitas exposed via module-level vi.fn() ref.
 *   - Real AgendaEnrichmentService runs — no domain mocking.
 *   - Wrapped in real QueryClient (retry: false).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mock (must precede hook import) ───────────────────────────────────

const mockFetchTherapistWeekCitas = vi.fn();

vi.mock('@infra/adapters/SupabaseAgendaAdapter', () => ({
  SupabaseAgendaAdapter: class MockAgendaAdapter {
    fetchTherapistWeekCitas(...args: unknown[]) {
      return mockFetchTherapistWeekCitas(...args);
    }
    fetchWeekCitas() {
      return Promise.resolve([]);
    }
    fetchDayTerapeutas() {
      return Promise.resolve([]);
    }
    fetchMonthCitas() {
      return Promise.resolve([]);
    }
  },
}));

// ── Hook import (after mock) ──────────────────────────────────────────────────

import { useTherapistWeekData } from '@infra/hooks/useTherapistWeekData';
import type { IAgendaRawCita } from '@domain/models/agenda.models';

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
    therapistId: 10,
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

const WEEK_START = '2026-05-18';

// ── therapistId=null guard ────────────────────────────────────────────────────

describe('useTherapistWeekData — therapistId=null guard', () => {
  beforeEach(() => {
    mockFetchTherapistWeekCitas.mockReset();
  });

  it('returns empty weekDays when therapistId is null', () => {
    const { result } = renderHook(() => useTherapistWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.weekDays).toEqual([]);
  });

  it('returns EMPTY_BALANCE when therapistId is null', () => {
    const { result } = renderHook(() => useTherapistWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.balance.citasTotal).toBe(0);
    expect(result.current.balance.horasEnSala).toBe(0);
    expect(result.current.balance.weekLabel).toBe('');
  });

  it('returns isLoading=false when therapistId is null', () => {
    const { result } = renderHook(() => useTherapistWeekData(null, WEEK_START), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('does NOT call adapter when therapistId is null', () => {
    renderHook(() => useTherapistWeekData(null, WEEK_START), { wrapper: createWrapper() });
    expect(mockFetchTherapistWeekCitas).not.toHaveBeenCalled();
  });
});

// ── Successful fetch ──────────────────────────────────────────────────────────

describe('useTherapistWeekData — successful fetch', () => {
  beforeEach(() => {
    mockFetchTherapistWeekCitas.mockResolvedValue([
      makeRawCita({ id: 1, startIso: '2026-05-18T10:00:00', endIso: '2026-05-18T11:00:00' }),
      makeRawCita({ id: 2, startIso: '2026-05-20T11:00:00', endIso: '2026-05-20T12:00:00' }),
    ]);
  });

  it('weekDays has 7 items', async () => {
    const { result } = renderHook(() => useTherapistWeekData(10, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.weekDays).toHaveLength(7);
  });

  it('balance.citasTotal reflects appointment count', async () => {
    const { result } = renderHook(() => useTherapistWeekData(10, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // 2 real appointments (non-libranza)
    expect(result.current.balance.citasTotal).toBe(2);
  });

  it('balance.weekLabel is a non-empty string', async () => {
    const { result } = renderHook(() => useTherapistWeekData(10, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.balance.weekLabel.length).toBeGreaterThan(0);
  });

  it('isLoading becomes false after data resolves', async () => {
    const { result } = renderHook(() => useTherapistWeekData(10, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isError).toBe(false);
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('useTherapistWeekData — error state', () => {
  beforeEach(() => {
    mockFetchTherapistWeekCitas.mockRejectedValue(new Error('Network error'));
  });

  it('isError=true when adapter throws', async () => {
    const { result } = renderHook(() => useTherapistWeekData(10, WEEK_START), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
