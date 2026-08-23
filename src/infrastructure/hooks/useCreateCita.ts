/**
 * useCreateCita.ts — schedule a new cita through the domain service.
 *
 * Routes through the composition-root `citaService` (Option A): all 10 schedule
 * rules + overlap prevention run in the domain, never inline here.
 *
 * Cache ownership: this hook invalidates the `['agenda']` query family on
 * success. Page handlers MUST NOT refetch (see feedback_react_query_cache).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citaService } from '@infra/services/agendaServices';
import type { ICita } from '@domain/models';
import type { TClienteId, TUserId, TCentroId, TSalaId, TServicioId } from '@domain/types';

export interface ICreateCitaInput {
  readonly clienteId?: TClienteId | null;
  readonly usuarioId?: TUserId | null;
  readonly centroId: TCentroId;
  readonly salaId?: TSalaId | null;
  readonly servicioId: TServicioId;
  readonly fechaHoraInicio: Date;
  readonly fechaHoraFin: Date;
  readonly notas?: string;
}

export function useCreateCita() {
  const qc = useQueryClient();

  return useMutation<ICita, Error, ICreateCitaInput>({
    mutationFn: async (input: ICreateCitaInput): Promise<ICita> => {
      // Price is sourced from the service (centro override + discount). It is
      // display-only downstream and not persisted (no price column on citas),
      // but ICreateCitaDTO requires it, so we resolve it honestly here.
      const precio = await citaService.calculateFinalPrice(input.servicioId, input.centroId);
      return citaService.schedule({
        clienteId: input.clienteId ?? null,
        usuarioId: input.usuarioId ?? null,
        centroId: input.centroId,
        salaId: input.salaId ?? null,
        servicioId: input.servicioId,
        fechaHoraInicio: input.fechaHoraInicio,
        fechaHoraFin: input.fechaHoraFin,
        precioFinal: precio.cents,
        notas: input.notas,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda'] });
    },
  });
}
