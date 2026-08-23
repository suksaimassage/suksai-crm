/**
 * useCitaMutations.test.tsx
 *
 * Contract tests for the non-optimistic cita mutation hooks:
 *   useCreateCita · useRescheduleCita · useReassignCita · useCancelCita ·
 *   useChangeCitaEstado
 *
 * (useConfirmCita is optimistic and has its own dedicated test file.)
 *
 * Mock strategy:
 *   - The composition root `@infra/services/agendaServices` is mocked so the
 *     domain service methods are vi.fn()s. The hooks are wired to call THESE,
 *     so we assert the hook→service contract + that the hook owns cache
 *     invalidation (project_react_query_cache rule: hooks invalidate, pages
 *     never refetch).
 *   - Real QueryClient (retry:false) so errors surface immediately. We spy on
 *     invalidateQueries to prove the hook invalidates the right key families.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Composition-root mock (must precede hook imports) ──────────────────────────
const mockSchedule = vi.fn();
const mockReschedule = vi.fn();
const mockCancel = vi.fn();
const mockChangeEstado = vi.fn();
const mockCalculateFinalPrice = vi.fn();

vi.mock('@infra/services/agendaServices', () => ({
  citaService: {
    schedule: (...a: unknown[]): unknown => mockSchedule(...a),
    reschedule: (...a: unknown[]): unknown => mockReschedule(...a),
    cancel: (...a: unknown[]): unknown => mockCancel(...a),
    changeEstado: (...a: unknown[]): unknown => mockChangeEstado(...a),
    calculateFinalPrice: (...a: unknown[]): unknown => mockCalculateFinalPrice(...a),
  },
  availabilityService: { getAvailableSlots: vi.fn() },
}));

import { useCreateCita } from '@infra/hooks/useCreateCita';
import { useRescheduleCita } from '@infra/hooks/useRescheduleCita';
import { useReassignCita } from '@infra/hooks/useReassignCita';
import { useCancelCita } from '@infra/hooks/useCancelCita';
import { useChangeCitaEstado } from '@infra/hooks/useChangeCitaEstado';
import type { ICita } from '@domain/models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCita(overrides: Partial<ICita> = {}): ICita {
  return {
    id: 42,
    clienteId: 1,
    usuarioId: 2,
    centroId: 3,
    salaId: 4,
    servicioId: 5,
    fechaHoraInicio: new Date('2026-05-18T10:00:00Z'),
    fechaHoraFin: new Date('2026-05-18T11:00:00Z'),
    estado: 'pendiente',
    precioFinal: 5000,
    notas: null,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  };
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, invalidateSpy, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// useCreateCita
// ════════════════════════════════════════════════════════════════════════════

describe('useCreateCita', () => {
  const input = {
    clienteId: 1,
    usuarioId: 2,
    centroId: 3,
    salaId: 4,
    servicioId: 5,
    fechaHoraInicio: new Date('2026-05-18T10:00:00Z'),
    fechaHoraFin: new Date('2026-05-18T11:00:00Z'),
  } as const;

  it('resolves the price via the service and schedules with precioFinal in cents', async () => {
    mockCalculateFinalPrice.mockResolvedValue({ cents: 6500 });
    mockSchedule.mockResolvedValue(makeCita());
    const { wrapper } = setup();
    const { result } = renderHook(() => useCreateCita(), { wrapper });

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockCalculateFinalPrice).toHaveBeenCalledWith(5, 3);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: 1, usuarioId: 2, precioFinal: 6500 }),
    );
  });

  it('invalidates the ["agenda"] query family on success', async () => {
    mockCalculateFinalPrice.mockResolvedValue({ cents: 5000 });
    mockSchedule.mockResolvedValue(makeCita());
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useCreateCita(), { wrapper });

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
  });

  it('surfaces a domain error (does not invalidate)', async () => {
    mockCalculateFinalPrice.mockResolvedValue({ cents: 5000 });
    mockSchedule.mockRejectedValue(new Error('THERAPIST_CONFLICT'));
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useCreateCita(), { wrapper });

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useRescheduleCita
// ════════════════════════════════════════════════════════════════════════════

describe('useRescheduleCita', () => {
  it('calls citaService.reschedule with citaId + changes', async () => {
    mockReschedule.mockResolvedValue(makeCita({ id: 42 }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useRescheduleCita(), { wrapper });

    result.current.mutate({ citaId: 42, changes: { salaId: 9 } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockReschedule).toHaveBeenCalledWith(42, { salaId: 9 });
  });

  it('invalidates both ["agenda"] and ["cita", id] on success', async () => {
    mockReschedule.mockResolvedValue(makeCita({ id: 42 }));
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useRescheduleCita(), { wrapper });

    result.current.mutate({ citaId: 42, changes: { salaId: 9 } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cita', 42] });
  });

  it('exposes the error state when reschedule rejects', async () => {
    mockReschedule.mockRejectedValue(new Error('SALA_CONFLICT'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useRescheduleCita(), { wrapper });

    result.current.mutate({ citaId: 42, changes: { salaId: 9 } });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useReassignCita
// ════════════════════════════════════════════════════════════════════════════

describe('useReassignCita', () => {
  it('reschedules with only the usuarioId changed', async () => {
    mockReschedule.mockResolvedValue(makeCita({ id: 42, usuarioId: 77 }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useReassignCita(), { wrapper });

    result.current.mutate({ citaId: 42, usuarioId: 77 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockReschedule).toHaveBeenCalledWith(42, { usuarioId: 77 });
  });

  it('invalidates ["agenda"] and ["cita", id] on success', async () => {
    mockReschedule.mockResolvedValue(makeCita({ id: 42 }));
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useReassignCita(), { wrapper });

    result.current.mutate({ citaId: 42, usuarioId: 77 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cita', 42] });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useCancelCita
// ════════════════════════════════════════════════════════════════════════════

describe('useCancelCita', () => {
  it('calls citaService.cancel with citaId and motivo', async () => {
    mockCancel.mockResolvedValue(undefined);
    const { wrapper } = setup();
    const { result } = renderHook(() => useCancelCita(), { wrapper });

    result.current.mutate({ citaId: 42, motivo: 'cliente lo pidió' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockCancel).toHaveBeenCalledWith(42, 'cliente lo pidió');
  });

  it('invalidates ["agenda"] and ["cita", id] on success', async () => {
    mockCancel.mockResolvedValue(undefined);
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useCancelCita(), { wrapper });

    result.current.mutate({ citaId: 42 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cita', 42] });
  });

  it('surfaces CANNOT_CANCEL_COMPLETED as an error state', async () => {
    mockCancel.mockRejectedValue(new Error('CANNOT_CANCEL_COMPLETED'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useCancelCita(), { wrapper });

    result.current.mutate({ citaId: 42 });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useChangeCitaEstado
// ════════════════════════════════════════════════════════════════════════════

describe('useChangeCitaEstado', () => {
  it('calls citaService.changeEstado with citaId + estado', async () => {
    mockChangeEstado.mockResolvedValue(makeCita({ id: 42, estado: 'en_curso' }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useChangeCitaEstado(), { wrapper });

    result.current.mutate({ citaId: 42, estado: 'en_curso' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockChangeEstado).toHaveBeenCalledWith(42, 'en_curso');
  });

  it('invalidates ["agenda"] and ["cita", id] on success', async () => {
    mockChangeEstado.mockResolvedValue(makeCita({ id: 42, estado: 'completada' }));
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useChangeCitaEstado(), { wrapper });

    result.current.mutate({ citaId: 42, estado: 'completada' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cita', 42] });
  });

  it('surfaces ILLEGAL_ESTADO_TRANSITION as an error state', async () => {
    mockChangeEstado.mockRejectedValue(new Error('ILLEGAL_ESTADO_TRANSITION'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useChangeCitaEstado(), { wrapper });

    result.current.mutate({ citaId: 42, estado: 'confirmada' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
