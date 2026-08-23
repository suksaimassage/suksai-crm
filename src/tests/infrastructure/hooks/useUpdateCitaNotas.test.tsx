/**
 * useUpdateCitaNotas.test.tsx
 *
 * The note-only mutation behind the therapist quick-edit flow. It is a thin
 * pass-through to citaService.updateNotas whose ONE job beyond calling the
 * service is cache ownership: on success it must invalidate BOTH the broad
 * `['agenda']` family and the specific `['cita', id]` entry (mirrors
 * useChangeCitaEstado — see that hook for the same contract).
 *
 * Mock strategy (identical to useConfirmCita.test.tsx): the composition root is
 * mocked so citaService.updateNotas is a spy we drive; we render the real hook
 * against a real QueryClient and inspect invalidateQueries directly. The domain
 * service itself is NOT exercised here (it has its own unit tests) — only the
 * hook's contract with React Query.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockUpdateNotas = vi.fn();

vi.mock('@infra/services/agendaServices', () => ({
  citaService: {
    updateNotas: (...a: unknown[]): unknown => mockUpdateNotas(...a),
  },
  availabilityService: {},
}));

import { useUpdateCitaNotas } from '@infra/hooks/useUpdateCitaNotas';
import type { ICita } from '@domain/models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCita(overrides: Partial<ICita> = {}): ICita {
  return {
    id: 42,
    clienteId: 1,
    usuarioId: 1,
    centroId: 1,
    salaId: 1,
    servicioId: 1,
    fechaHoraInicio: new Date('2026-05-18T10:00:00Z'),
    fechaHoraFin: new Date('2026-05-18T11:00:00Z'),
    estado: 'confirmada',
    precioFinal: 5000,
    notas: 'nota guardada',
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  };
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────

describe('useUpdateCitaNotas — mutationFn wiring', () => {
  it('calls citaService.updateNotas(citaId, notas) with the input', async () => {
    const { wrapper } = setup();
    mockUpdateNotas.mockResolvedValue(makeCita());

    const { result } = renderHook(() => useUpdateCitaNotas(), { wrapper });
    act(() => {
      result.current.mutate({ citaId: 42, notas: 'cliente prefiere camilla baja' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockUpdateNotas).toHaveBeenCalledWith(42, 'cliente prefiere camilla baja');
  });

  it('passes notas: null through to the service (clear-note path)', async () => {
    const { wrapper } = setup();
    mockUpdateNotas.mockResolvedValue(makeCita({ notas: null }));

    const { result } = renderHook(() => useUpdateCitaNotas(), { wrapper });
    act(() => {
      result.current.mutate({ citaId: 42, notas: null });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockUpdateNotas).toHaveBeenCalledWith(42, null);
  });

  it('surfaces the error state when the service rejects', async () => {
    const { wrapper } = setup();
    mockUpdateNotas.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useUpdateCitaNotas(), { wrapper });
    act(() => {
      result.current.mutate({ citaId: 42, notas: 'x' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUpdateCitaNotas — cache ownership (onSuccess)', () => {
  it('invalidates the ["agenda"] family on success', async () => {
    const { qc, wrapper } = setup();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    mockUpdateNotas.mockResolvedValue(makeCita({ id: 42 }));

    const { result } = renderHook(() => useUpdateCitaNotas(), { wrapper });
    act(() => {
      result.current.mutate({ citaId: 42, notas: 'x' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
  });

  it('invalidates the specific ["cita", id] entry using the RETURNED cita id', async () => {
    const { qc, wrapper } = setup();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    // The hook keys the per-cita invalidation off the SERVER cita.id, not the
    // input — assert with a returned id (99) distinct from any incidental value.
    mockUpdateNotas.mockResolvedValue(makeCita({ id: 99 }));

    const { result } = renderHook(() => useUpdateCitaNotas(), { wrapper });
    act(() => {
      result.current.mutate({ citaId: 99, notas: 'x' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cita', 99] });
  });

  it('does NOT invalidate any cache when the mutation fails', async () => {
    const { qc, wrapper } = setup();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    mockUpdateNotas.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useUpdateCitaNotas(), { wrapper });
    act(() => {
      result.current.mutate({ citaId: 42, notas: 'x' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
