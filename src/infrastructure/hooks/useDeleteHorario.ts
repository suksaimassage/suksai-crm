/**
 * useDeleteHorario.ts
 *
 * Mutation hook: soft-delete a horario_trabajo via
 * SupabaseHorarioAdapter.deactivate (UPDATE activo = false — never a hard
 * DELETE; horarios_trabajo has no DELETE policy).
 *
 * Cache ownership: this hook OWNS invalidation (page/component handlers must
 * NOT refetch manually). On success it invalidates the centre schedule read
 * and the terapeutas aggregate.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseHorarioAdapter } from '@infra/adapters/SupabaseHorarioAdapter';
import type { THorarioId } from '@domain/types';

const adapter = new SupabaseHorarioAdapter();

export function useDeleteHorario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: THorarioId) => adapter.deactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centro-horarios'] });
      void qc.invalidateQueries({ queryKey: ['terapeutas'] });
    },
  });
}
