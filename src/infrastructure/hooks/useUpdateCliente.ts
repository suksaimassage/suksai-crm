import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import type { IUpdateClienteDTO } from '@domain/models';
import type { TClienteId } from '@domain/types';

const adapter = new SupabaseClienteAdapter();

export function useUpdateCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: TClienteId; dto: IUpdateClienteDTO }) =>
      adapter.update(id, dto),
    onSuccess: (_data, variables) => {
      // ['clientes'] prefix covers both list rows and kpi
      void qc.invalidateQueries({ queryKey: ['clientes'] });
      void qc.invalidateQueries({ queryKey: ['cliente-detalle', variables.id] });
      void qc.invalidateQueries({ queryKey: ['cliente', variables.id] });
    },
  });
}
