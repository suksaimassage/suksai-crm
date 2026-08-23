/**
 * useConfirmCita.test.tsx
 *
 * The only OPTIMISTIC cita mutation (Analyst decision 10). Tests the full
 * optimistic lifecycle:
 *   - onMutate flips the matching appointment's estado to 'confirmada' in every
 *     cached ['agenda', …] query that holds an `appointments` array,
 *   - on error it rolls the cache back to the pre-mutation snapshot,
 *   - on settle it invalidates ['agenda'] to reconcile,
 *   - non-agenda-shaped caches are left untouched.
 *
 * Mock strategy: composition root mocked; we drive success/failure of
 * citaService.changeEstado and inspect the QueryClient cache directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockChangeEstado = vi.fn();

vi.mock('@infra/services/agendaServices', () => ({
  citaService: {
    changeEstado: (...a: unknown[]): unknown => mockChangeEstado(...a),
  },
  availabilityService: {},
}));

import { useConfirmCita } from '@infra/hooks/useConfirmCita';
import type { ICita } from '@domain/models';
import type { IAgendaAppointment } from '@domain/models/agenda.models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAppt(id: number, estado: IAgendaAppointment['estado']): IAgendaAppointment {
  return {
    id,
    therapistId: 1,
    startTime: '10:00',
    endTime: '11:00',
    durationMin: 60,
    clientName: `Cliente ${id}`,
    visitInfo: null,
    serviceName: 'Masaje',
    sala: 'Sala 1',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado,
    timelineState: 'pending',
    evtVariant: 'pending',
    notes: null,
    tags: [],
    precioFinal: 5000,
  };
}

function makeCita(estado: ICita['estado'] = 'confirmada'): ICita {
  return {
    id: 1,
    clienteId: 1,
    usuarioId: 1,
    centroId: 1,
    salaId: 1,
    servicioId: 1,
    fechaHoraInicio: new Date('2026-05-18T10:00:00Z'),
    fechaHoraFin: new Date('2026-05-18T11:00:00Z'),
    estado,
    precioFinal: 5000,
    notas: null,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
  };
}

const AGENDA_KEY = ['agenda', 'admin', 1, '2026-05-18'] as const;

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

describe('useConfirmCita — optimistic update', () => {
  it('flips the matching appointment estado to confirmada immediately (before the server resolves)', async () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(AGENDA_KEY, {
      appointments: [makeAppt(1, 'pendiente'), makeAppt(2, 'pendiente')],
    });

    // Keep the server pending so we observe the optimistic state mid-flight.
    let resolveServer: (c: ICita) => void = () => {
      /* replaced synchronously below */
    };
    mockChangeEstado.mockReturnValue(
      new Promise<ICita>((res) => {
        resolveServer = res;
      }),
    );

    const { result } = renderHook(() => useConfirmCita(), { wrapper });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      const cached = qc.getQueryData<{ appointments: IAgendaAppointment[] }>(AGENDA_KEY);
      expect(cached?.appointments.find((a) => a.id === 1)?.estado).toBe('confirmada');
    });
    // The non-targeted appointment is untouched.
    const cached = qc.getQueryData<{ appointments: IAgendaAppointment[] }>(AGENDA_KEY);
    expect(cached?.appointments.find((a) => a.id === 2)?.estado).toBe('pendiente');

    // Let the server settle to avoid an unhandled pending mutation.
    act(() => {
      resolveServer(makeCita('confirmada'));
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('calls changeEstado(citaId, "confirmada")', async () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(AGENDA_KEY, { appointments: [makeAppt(1, 'pendiente')] });
    mockChangeEstado.mockResolvedValue(makeCita('confirmada'));

    const { result } = renderHook(() => useConfirmCita(), { wrapper });
    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockChangeEstado).toHaveBeenCalledWith(1, 'confirmada');
  });

  it('leaves non-agenda-shaped cache entries untouched', async () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(AGENDA_KEY, { appointments: [makeAppt(1, 'pendiente')] });
    // An ['agenda', …] entry WITHOUT an appointments array (e.g. a picker query).
    qc.setQueryData(['agenda', 'picker', 'salas', 1], [{ id: 9, nombre: 'Sala' }]);
    mockChangeEstado.mockResolvedValue(makeCita('confirmada'));

    const { result } = renderHook(() => useConfirmCita(), { wrapper });
    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(qc.getQueryData(['agenda', 'picker', 'salas', 1])).toEqual([{ id: 9, nombre: 'Sala' }]);
  });
});

describe('useConfirmCita — rollback on error', () => {
  it('restores the previous estado when the server rejects', async () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(AGENDA_KEY, {
      appointments: [makeAppt(1, 'pendiente'), makeAppt(2, 'confirmada')],
    });
    mockChangeEstado.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useConfirmCita(), { wrapper });
    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // After rollback + settle invalidation, the optimistic flip must be gone:
    // appointment 1 returns to 'pendiente'.
    await waitFor(() => {
      const cached = qc.getQueryData<{ appointments: IAgendaAppointment[] }>(AGENDA_KEY);
      expect(cached?.appointments.find((a) => a.id === 1)?.estado).toBe('pendiente');
    });
  });
});

describe('useConfirmCita — reconciliation', () => {
  it('invalidates the ["agenda"] family on settle (success path)', async () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(AGENDA_KEY, { appointments: [makeAppt(1, 'pendiente')] });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    mockChangeEstado.mockResolvedValue(makeCita('confirmada'));

    const { result } = renderHook(() => useConfirmCita(), { wrapper });
    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });
  });
});
