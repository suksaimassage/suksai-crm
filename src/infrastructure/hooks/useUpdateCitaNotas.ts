/**
 * useUpdateCitaNotas.ts — update a cita's observation notes only.
 *
 * Narrow note-only mutation used by the therapist quick-edit flow. Routes
 * through `citaService.updateNotas`, which patches a single field and does NOT
 * re-run the schedule rules (unlike reschedule).
 *
 * Cache ownership: invalidates `['agenda']` and `['cita', id]` on success.
 * Page handlers MUST NOT refetch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { ICita } from '@domain/models';
import type { TCitaId } from '@domain/types';

export interface IUpdateCitaNotasInput {
  readonly citaId: TCitaId;
  /** `null` (or an empty note normalised to null) clears the observation. */
  readonly notas: string | null;
}

export function useUpdateCitaNotas() {
  const qc = useQueryClient();

  return useMutation<ICita, Error, IUpdateCitaNotasInput>({
    mutationFn: ({ citaId, notas }: IUpdateCitaNotasInput): Promise<ICita> =>
      citaService.updateNotas(citaId, notas),
    onSuccess: (cita) => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
      void qc.invalidateQueries({ queryKey: ['cita', cita.id] });
    },
  });
}
