import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import type { TSalaId, TCentroId } from '@domain/types';

const adapter = new SupabaseSalaAdapter();

export function useDeleteSala(centroId: TCentroId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: TSalaId) => adapter.deactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centro-detail', centroId, 'salas'] });
    },
  });
}
