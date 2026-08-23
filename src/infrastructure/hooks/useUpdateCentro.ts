import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import type { IUpdateCentroDTO } from '@domain/models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseCentroAdapter();

export function useUpdateCentro() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: TCentroId; dto: IUpdateCentroDTO }) => adapter.update(id, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['centros-page', 'centros'] });
    },
  });
}
