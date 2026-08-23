import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import type { TClienteId } from '@domain/types';

const adapter = new SupabaseClienteAdapter();

export function useDeleteCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: TClienteId) => adapter.deactivate(id),
    onSuccess: (_data, variables) => {
      // ['clientes'] prefix covers both list rows and kpi
      void qc.invalidateQueries({ queryKey: ['clientes'] });
      void qc.invalidateQueries({ queryKey: ['cliente-detalle', variables] });
      void qc.invalidateQueries({ queryKey: ['cliente', variables] });
    },
  });
}
