/**
 * useCancelCita.ts — cancel a cita (* → cancelada) with optional motivo.
 *
 * Routes through `citaService.cancel`, which blocks cancelling an already
 * completed or already cancelled cita (BusinessRuleViolation). Normal
 * pending→invalidate flow (not optimistic — it runs behind a confirm dialog).
 *
 * Cache ownership: invalidates `['agenda']` on success. Page handlers MUST NOT
 * refetch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { TCitaId } from '@domain/types';

export interface ICancelCitaInput {
  readonly citaId: TCitaId;
  readonly motivo?: string;
}

export function useCancelCita() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, motivo }: ICancelCitaInput): Promise<void> =>
      citaService.cancel(citaId, motivo),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
      void qc.invalidateQueries({ queryKey: ['cita', variables.citaId] });
    },
  });
}
