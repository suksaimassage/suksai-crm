import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import type { ICreateSalaDTO } from '@domain/models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseSalaAdapter();

export function useCreateSala(centroId: TCentroId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateSalaDTO) => adapter.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centro-detail', centroId, 'salas'] });
    },
  });
}
