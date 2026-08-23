/**
 * useClientesActivos.ts — active clientes for the CitaModal client picker.
 *
 * The ClientesPage `useClientes` hook returns stats-enriched, paginated table
 * rows tailored to that screen; for a bounded picker we want plain active
 * ICliente entities, so this reads `findAll` and filters to `activo`. A
 * searchable Select consumes this list (no async typeahead needed — Designer
 * §0 verdict).
 *
 * Read-only.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import type { ICliente } from '@domain/models';

const adapter = new SupabaseClienteAdapter();

// Bounded picker list — large enough to cover a single centre's active clients.
const PICKER_PAGE_SIZE = 500;

export interface IUseClientesActivosResult {
  readonly clientes: readonly ICliente[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useClientesActivos = (enabled = true): IUseClientesActivosResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', 'activos', 'picker'] as const,
    queryFn: async (): Promise<readonly ICliente[]> => {
      const result = await adapter.findAll({ page: 1, perPage: PICKER_PAGE_SIZE });
      return result.data.filter((c) => c.activo);
    },
    enabled,
    staleTime: 300_000,
  });

  return {
    clientes: data ?? [],
    isLoading,
    isError,
  };
};
