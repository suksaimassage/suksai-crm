import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseCentroAdapter();

export function useDeleteCentro() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: TCentroId) => adapter.deactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centros-page', 'centros'] });
    },
  });
}
