import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import type { IUpdateSalaDTO } from '@domain/models';
import type { TSalaId, TCentroId } from '@domain/types';

const adapter = new SupabaseSalaAdapter();

export function useUpdateSala(centroId: TCentroId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: TSalaId; dto: IUpdateSalaDTO }) => adapter.update(id, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centro-detail', centroId, 'salas'] });
    },
  });
}
