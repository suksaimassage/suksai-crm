/**
 * useCreateHorario.ts
 *
 * Mutation hook: create a horario_trabajo via SupabaseHorarioAdapter.create.
 *
 * Cache ownership: this hook OWNS invalidation (page/component handlers must
 * NOT refetch manually). On success it invalidates the centre schedule read
 * and the terapeutas aggregate (whose week-bar derives from horarios).
 *
 * Schema guards (DB CHECK check_tipo_logica): for the calendar's write path the
 * DTO is always tipo:'especifico' with `fecha` set and `diaSemana` omitted; for
 * tipo:'recurrente' the caller must set `diaSemana` and omit `fecha`. `centroId`
 * is always required (NOT NULL).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseHorarioAdapter } from '@infra/adapters/SupabaseHorarioAdapter';
import type { ICreateHorarioDTO, IHorarioTrabajo } from '@domain/models';

const adapter = new SupabaseHorarioAdapter();

export function useCreateHorario() {
  const qc = useQueryClient();

  return useMutation<IHorarioTrabajo, Error, ICreateHorarioDTO>({
    mutationFn: (dto: ICreateHorarioDTO) => adapter.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centro-horarios'] });
      void qc.invalidateQueries({ queryKey: ['terapeutas'] });
    },
  });
}
