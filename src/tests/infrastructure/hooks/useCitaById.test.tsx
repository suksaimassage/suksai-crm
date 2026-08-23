/**
 * useCitaById.test.tsx
 *
 * Contract tests for the detail-popover loader hook.
 *
 * Mock strategy: SupabaseCitaAdapter mocked as a real class exposing findById.
 * The `null` citaId case must NOT fetch (query disabled) and must expose
 * cita=null; a resolved null is the "not-found" case.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockFindById = vi.fn();

vi.mock('@infra/adapters/SupabaseCitaAdapter', () => ({
  SupabaseCitaAdapter: class {
    findById(...a: unknown[]): unknown {
      return mockFindById(...a);
    }
  },
}));

import { useCitaById } from '@infra/hooks/useCitaById';
import type { ICita } from '@domain/models';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeCita(): ICita {
  return {
    id: 7,
    clienteId: 1,
    usuarioId: 2,
    centroId: 3,
    salaId: 4,
    servicioId: 5,
    fechaHoraInicio: new Date('2026-05-18T10:00:00Z'),
    fechaHoraFin: new Date('2026-05-18T11:00:00Z'),
    estado: 'confirmada',
    precioFinal: 5000,
    notas: null,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCitaById', () => {
  it('loads the cita by id', async () => {
    mockFindById.mockResolvedValue(makeCita());
    const { result } = renderHook(() => useCitaById(7), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.cita?.id).toBe(7);
    expect(mockFindById).toHaveBeenCalledWith(7);
  });

  it('does not fetch and returns cita=null when citaId is null', () => {
    const { result } = renderHook(() => useCitaById(null), { wrapper: createWrapper() });
    expect(result.current.cita).toBeNull();
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it('returns cita=null (not-found) when the adapter resolves null', async () => {
    mockFindById.mockResolvedValue(null);
    const { result } = renderHook(() => useCitaById(999), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.cita).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('exposes the error state when findById rejects', async () => {
    mockFindById.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useCitaById(7), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.cita).toBeNull();
  });
});
