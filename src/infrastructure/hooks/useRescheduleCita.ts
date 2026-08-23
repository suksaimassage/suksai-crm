/**
 * useRescheduleCita.ts — edit an existing cita's schedule (in-place).
 *
 * Routes through `citaService.reschedule`, which re-runs schedule rules 1–10 on
 * the merged result while excluding the edited cita from its own overlap checks.
 * Preserves the cita id + estado.
 *
 * Cache ownership: invalidates `['agenda']` on success. Page handlers MUST NOT
 * refetch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { ICita, IUpdateCitaDTO } from '@domain/models';
import type { TCitaId } from '@domain/types';

export interface IRescheduleCitaInput {
  readonly citaId: TCitaId;
  readonly changes: IUpdateCitaDTO;
}

export function useRescheduleCita() {
  const qc = useQueryClient();

  return useMutation<ICita, Error, IRescheduleCitaInput>({
    mutationFn: ({ citaId, changes }: IRescheduleCitaInput): Promise<ICita> =>
      citaService.reschedule(citaId, changes),
    onSuccess: (cita) => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
      void qc.invalidateQueries({ queryKey: ['cita', cita.id] });
    },
  });
}
