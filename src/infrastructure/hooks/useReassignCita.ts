/**
 * useReassignCita.ts — specialised reschedule that only changes the therapist.
 *
 * Thin wrapper over `citaService.reschedule` passing only `usuarioId`. The full
 * rule set still runs (the new therapist must be free, assigned to the centro,
 * within work hours, not on leave) — reassignment is just an edit of one field.
 *
 * Cache ownership: invalidates `['agenda']` on success. Page handlers MUST NOT
 * refetch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { ICita } from '@domain/models';
import type { TCitaId, TUserId } from '@domain/types';

export interface IReassignCitaInput {
  readonly citaId: TCitaId;
  readonly usuarioId: TUserId;
}

export function useReassignCita() {
  const qc = useQueryClient();

  return useMutation<ICita, Error, IReassignCitaInput>({
    mutationFn: ({ citaId, usuarioId }: IReassignCitaInput): Promise<ICita> =>
      citaService.reschedule(citaId, { usuarioId }),
    onSuccess: (cita) => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
      void qc.invalidateQueries({ queryKey: ['cita', cita.id] });
    },
  });
}
