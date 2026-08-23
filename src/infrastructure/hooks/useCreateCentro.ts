import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import type { ICreateCentroDTO } from '@domain/models';

const adapter = new SupabaseCentroAdapter();

export function useCreateCentro() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateCentroDTO) => adapter.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centros-page', 'centros'] });
    },
  });
}
