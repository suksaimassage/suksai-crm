import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import type { TClienteId } from '@domain/types';

const clienteAdapter = new SupabaseClienteAdapter();
const citaAdapter = new SupabaseCitaAdapter();

export interface IUseDeactivateClienteResult {
  readonly futureCitasCount: number | null;
  readonly isCountLoading: boolean;
  readonly isCountError: boolean;
  readonly deactivate: () => Promise<void>;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
}

export function useDeactivateCliente(clienteId: TClienteId | null): IUseDeactivateClienteResult {
  const qc = useQueryClient();

  const countQuery = useQuery({
    queryKey: ['citas-futuras-count', clienteId] as const,
    enabled: clienteId !== null,
    staleTime: 0,
    queryFn: () => {
      if (clienteId === null) throw new Error('clienteId is null');
      return citaAdapter.countFutureCitas(clienteId, new Date());
    },
  });

  const mutation = useMutation({
    mutationFn: (id: TClienteId) => clienteAdapter.deactivateWithCancellation(id),
    onSuccess: () => {
      // ['clientes'] prefix covers both list rows and kpi via prefix matching
      void qc.refetchQueries({ queryKey: ['clientes'], type: 'active' });
      void qc.invalidateQueries({ queryKey: ['clientes'] });
      if (clienteId !== null) {
        void qc.invalidateQueries({ queryKey: ['cliente-detalle', clienteId] });
        void qc.invalidateQueries({ queryKey: ['citas-futuras-count', clienteId] });
        void qc.invalidateQueries({ queryKey: ['cliente', clienteId] });
      }
    },
  });

  const deactivate = async () => {
    if (clienteId === null) return;
    await mutation.mutateAsync(clienteId);
  };

  return {
    futureCitasCount: countQuery.data ?? null,
    isCountLoading: countQuery.isLoading,
    isCountError: countQuery.isError,
    deactivate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error instanceof Error ? mutation.error : null,
    reset: mutation.reset,
  };
}
