/**
 * useChangeCitaEstado.ts — move a cita along the estado lifecycle graph.
 *
 * General-purpose estado control (the detail panel's "Cambiar estado" menu).
 * Routes through `citaService.changeEstado`, which enforces legal transitions
 * (citaEstadoTransitions) and throws BusinessRuleViolation on illegal ones.
 *
 * Cache ownership: invalidates `['agenda']` on success. Page handlers MUST NOT
 * refetch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { ICita } from '@domain/models';
import type { TCitaId, TEstadoCita } from '@domain/types';

export interface IChangeCitaEstadoInput {
  readonly citaId: TCitaId;
  readonly estado: TEstadoCita;
}

export function useChangeCitaEstado() {
  const qc = useQueryClient();

  return useMutation<ICita, Error, IChangeCitaEstadoInput>({
    mutationFn: ({ citaId, estado }: IChangeCitaEstadoInput): Promise<ICita> =>
      citaService.changeEstado(citaId, estado),
    onSuccess: (cita) => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
      void qc.invalidateQueries({ queryKey: ['cita', cita.id] });
    },
  });
}
