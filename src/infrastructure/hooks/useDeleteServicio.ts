import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import type { TServicioId } from '@domain/types';

const adapter = new SupabaseServicioAdapter();

export function useDeleteServicio() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: TServicioId) => adapter.deactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servicios'] });
    },
  });
}
