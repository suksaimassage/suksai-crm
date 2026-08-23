/**
 * useAdminMonthData.test.ts
 *
 * Hook tests for useAdminMonthData.
 * Mock strategy:
 *   - SupabaseAgendaAdapter mocked as a real class (module-level singleton in hook).
 *   - fetchMonthCitas exposed via module-level vi.fn() ref.
 *   - Real AgendaEnrichmentService runs — no domain mocking.
 *   - Wrapped in real QueryClient (retry: false).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mock (must precede hook import) ───────────────────────────────────

const mockFetchMonthCitas = vi.fn();

vi.mock('@infra/adapters/SupabaseAgendaAdapter', () => ({
  SupabaseAgendaAdapter: class MockAgendaAdapter {
    fetchMonthCitas(...args: unknown[]) {
      return mockFetchMonthCitas(...args);
    }
    fetchWeekCitas() {
      return Promise.resolve([]);
    }
    fetchDayTerapeutas() {
      return Promise.resolve([]);
    }
    fetchTherapistWeekCitas() {
      return Promise.resolve([]);
    }
  },
}));

// ── Hook import (after mock) ──────────────────────────────────────────────────

import { useAdminMonthData } from '@infra/hooks/useAdminMonthData';
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
    therapistId: 1,
    startIso: '2026-05-07T10:00:00',
    endIso: '2026-05-07T11:00:00',
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

// ── centroId=null guard ───────────────────────────────────────────────────────

describe('useAdminMonthData — centroId=null guard', () => {
  beforeEach(() => {
    mockFetchMonthCitas.mockReset();
  });

  it('returns empty cells when centroId is null', () => {
    const { result } = renderHook(() => useAdminMonthData(null, 2026, 5), {
      wrapper: createWrapper(),
    });
    expect(result.current.cells).toEqual([]);
  });

  it('returns footerKpis with totalCitas=0 when centroId is null', () => {
    const { result } = renderHook(() => useAdminMonthData(null, 2026, 5), {
      wrapper: createWrapper(),
    });
    expect(result.current.footerKpis.totalCitas).toBe(0);
  });

  it('returns isLoading=false when centroId is null', () => {
    const { result } = renderHook(() => useAdminMonthData(null, 2026, 5), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('does NOT call adapter when centroId is null', () => {
    renderHook(() => useAdminMonthData(null, 2026, 5), { wrapper: createWrapper() });
    expect(mockFetchMonthCitas).not.toHaveBeenCalled();
  });
});

// ── Successful fetch ──────────────────────────────────────────────────────────

describe('useAdminMonthData — successful fetch', () => {
  beforeEach(() => {
    mockFetchMonthCitas.mockResolvedValue([makeRawCita({ id: 1 }), makeRawCita({ id: 2 })]);
  });

  it('cells array is non-empty (month grid built)', async () => {
    const { result } = renderHook(() => useAdminMonthData(1, 2026, 5), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.cells.length).toBeGreaterThan(0);
  });

  it('footerKpis.totalCitas reflects real appointment count', async () => {
    const { result } = renderHook(() => useAdminMonthData(1, 2026, 5), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.footerKpis.totalCitas).toBe(2);
  });

  it('isLoading becomes false after data resolves', async () => {
    const { result } = renderHook(() => useAdminMonthData(1, 2026, 5), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isError).toBe(false);
  });

  it('query is keyed by centroId, year, and month', async () => {
    // Calling with different year/month creates a different query entry — verify
    // by checking adapter is called with the correct arguments
    renderHook(() => useAdminMonthData(1, 2026, 5), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockFetchMonthCitas).toHaveBeenCalledWith(1, 2026, 5);
    });
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('useAdminMonthData — error state', () => {
  beforeEach(() => {
    mockFetchMonthCitas.mockRejectedValue(new Error('Network error'));
  });

  it('isError=true when adapter throws', async () => {
    const { result } = renderHook(() => useAdminMonthData(1, 2026, 5), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
