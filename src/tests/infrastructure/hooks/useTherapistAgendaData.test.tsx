/**
 * useTherapistAgendaData.test.tsx
 *
 * Tests the EXTENDED therapist agenda data hook, focused on the new
 * therapistCount badge value (= real cita count for the shown therapist) and the
 * userId=null guard.
 *
 * Mock strategy: SupabaseAgendaAdapter mocked as a real class exposing
 * fetchTherapistDayCitas; REAL AgendaEnrichmentService runs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockFetchTherapistDayCitas = vi.fn();

vi.mock('@infra/adapters/SupabaseAgendaAdapter', () => ({
  SupabaseAgendaAdapter: class {
    fetchTherapistDayCitas(...a: unknown[]): unknown {
      return mockFetchTherapistDayCitas(...a);
    }
  },
}));

import { useTherapistAgendaData } from '@infra/hooks/useTherapistAgendaData';
import type { IAgendaRawCita } from '@domain/models/agenda.models';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeRawCita(overrides: Partial<IAgendaRawCita> = {}): IAgendaRawCita {
  return {
    id: 1,
    therapistId: 5,
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

const DATE = '2026-05-18';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTherapistAgendaData — userId=null guard', () => {
  it('returns empty appointments and therapistCount=0 without fetching', () => {
    const { result } = renderHook(() => useTherapistAgendaData(null, DATE), {
      wrapper: createWrapper(),
    });
    expect(result.current.appointments).toEqual([]);
    expect(result.current.therapistCount).toBe(0);
    expect(result.current.sala).toBe('—');
    expect(mockFetchTherapistDayCitas).not.toHaveBeenCalled();
  });
});

describe('useTherapistAgendaData — successful load', () => {
  it('therapistCount equals the real cita count (matches stats.citasTotal)', async () => {
    mockFetchTherapistDayCitas.mockResolvedValue([
      makeRawCita({ id: 1, serviceName: 'Masaje' }),
      makeRawCita({ id: 2, serviceName: 'Reflexología' }),
      makeRawCita({ id: 3, serviceName: 'Libranza' }), // not a real cita
    ]);
    const { result } = renderHook(() => useTherapistAgendaData(5, DATE), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.therapistCount).toBe(2);
    expect(result.current.therapistCount).toBe(result.current.stats.citasTotal);
  });

  it('passes the therapist userId to the adapter', async () => {
    mockFetchTherapistDayCitas.mockResolvedValue([]);
    renderHook(() => useTherapistAgendaData(5, DATE), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockFetchTherapistDayCitas).toHaveBeenCalled();
    });
    const [userId] = mockFetchTherapistDayCitas.mock.calls[0] as [number, Date];
    expect(userId).toBe(5);
  });

  it('derives the sala from the earliest cita', async () => {
    mockFetchTherapistDayCitas.mockResolvedValue([
      makeRawCita({ id: 1, startIso: '2026-05-18T12:00:00', sala: 'Sala Tarde' }),
      makeRawCita({ id: 2, startIso: '2026-05-18T09:00:00', sala: 'Sala Mañana' }),
    ]);
    const { result } = renderHook(() => useTherapistAgendaData(5, DATE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.sala).toBe('Sala Mañana');
  });
});

describe('useTherapistAgendaData — error state', () => {
  it('isError=true and therapistCount falls back to 0 when the fetch rejects', async () => {
    mockFetchTherapistDayCitas.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useTherapistAgendaData(5, DATE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.therapistCount).toBe(0);
  });
});
