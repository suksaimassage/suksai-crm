/**
 * useUpdateHorario.ts
 *
 * Mutation hook: update a horario_trabajo via SupabaseHorarioAdapter.update.
 *
 * Cache ownership: this hook OWNS invalidation (page/component handlers must
 * NOT refetch manually). On success it invalidates the centre schedule read
 * and the terapeutas aggregate.
 *
 * Used by the calendar's especifico edit/drag/resize path only — recurrente
 * shifts are read-only and never reach this hook (guarded at the call site).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseHorarioAdapter } from '@infra/adapters/SupabaseHorarioAdapter';
import type { ICreateHorarioDTO, IHorarioTrabajo } from '@domain/models';
import type { THorarioId } from '@domain/types';

const adapter = new SupabaseHorarioAdapter();

export interface IUpdateHorarioInput {
  readonly id: THorarioId;
  readonly data: Partial<ICreateHorarioDTO>;
}

export function useUpdateHorario() {
  const qc = useQueryClient();

  return useMutation<IHorarioTrabajo, Error, IUpdateHorarioInput>({
    mutationFn: ({ id, data }: IUpdateHorarioInput) => adapter.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centro-horarios'] });
      void qc.invalidateQueries({ queryKey: ['terapeutas'] });
    },
  });
}
