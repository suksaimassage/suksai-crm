/**
 * useConfirmCita.ts — confirm a pending cita (pendiente → confirmada).
 *
 * This is the ONLY optimistic mutation in the agenda (per Analyst decision 10):
 * the rail "Confirmar" must feel instant. We optimistically flip the estado of
 * the matching appointment in every cached `['agenda', 'admin', …]` and
 * `['agenda', 'therapist', …]` query so the item leaves "Por confirmar"
 * immediately; on error we roll back; on settle we invalidate to reconcile.
 *
 * Routes through `citaService.changeEstado` (enforces the transition graph).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { ICita } from '@domain/models';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';

interface IAgendaQuerySnapshot {
  readonly appointments: readonly IAgendaAppointment[];
  readonly [key: string]: unknown;
}

interface IConfirmContext {
  readonly previous: readonly (readonly [readonly unknown[], unknown])[];
}

/** Narrows an arbitrary cached `['agenda', …]` value to one holding appointments. */
function hasAppointments(value: unknown): value is IAgendaQuerySnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { appointments?: unknown }).appointments)
  );
}

/**
 * Optimistically flips the matching appointment's estado to 'confirmada'.
 * Accepts unknown because setQueriesData visits EVERY `['agenda', …]` cache
 * entry — availability/picker/week queries have different shapes and are left
 * untouched.
 */
function patchEstado(snapshot: unknown, citaId: TCitaId): unknown {
  if (!hasAppointments(snapshot)) return snapshot;
  return {
    ...snapshot,
    appointments: snapshot.appointments.map((a) =>
      a.id === citaId ? { ...a, estado: 'confirmada' as const } : a,
    ),
  };
}

export function useConfirmCita() {
  const qc = useQueryClient();

  return useMutation<ICita, Error, TCitaId, IConfirmContext>({
    mutationFn: (citaId: TCitaId): Promise<ICita> => citaService.changeEstado(citaId, 'confirmada'),
    onMutate: async (citaId: TCitaId): Promise<IConfirmContext> => {
      await qc.cancelQueries({ queryKey: ['agenda'] });
      const previous = qc.getQueriesData({ queryKey: ['agenda'] });
      qc.setQueriesData({ queryKey: ['agenda'] }, (old: unknown) => patchEstado(old, citaId));
      return { previous };
    },
    onError: (_error, _citaId, context) => {
      if (!context) return;
      for (const [key, data] of context.previous) {
        qc.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
    },
  });
}
