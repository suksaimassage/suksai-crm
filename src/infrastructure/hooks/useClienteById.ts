/**
 * useClienteById — React Query hook for fetching a single cliente by ID.
 *
 * Used by ClienteModal to pre-fill the edit form. Query is enabled only
 * when `clienteId` is defined.
 *
 * Query key: ['cliente', clienteId]
 * Stale time: 30 s — form data does not need aggressive freshness
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import type { TClienteId } from '@domain/types';
import type { ICliente } from '@domain/models';

const clienteAdapter = new SupabaseClienteAdapter();

export interface IUseClienteByIdResult {
  readonly data: ICliente | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useClienteById(clienteId: TClienteId | undefined): IUseClienteByIdResult {
  const query = useQuery({
    queryKey: ['cliente', clienteId] as const,
    enabled: clienteId !== undefined,
    staleTime: 30_000,
    queryFn: async (): Promise<ICliente | null> => {
      if (clienteId === undefined) return null;
      return clienteAdapter.findById(clienteId);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
