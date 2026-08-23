import { useQuery } from '@tanstack/react-query';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import type { IServicio } from '@domain/models';
import type { TCentroId } from '@domain/types';

// Adapter singleton — module scope avoids re-instantiation on every render
const servicioAdapter = new SupabaseServicioAdapter();

export interface IUseServiciosResult {
  readonly servicios: readonly IServicio[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

const QUERY_KEYS = {
  serviciosByCentro: (centroId: TCentroId) => ['rituales', 'servicios', centroId] as const,
  serviciosActivos: ['rituales', 'servicios', null] as const,
} as const;

/**
 * Fetches services for a specific centre (or all active services when centroId is null).
 * Uses SupabaseServicioAdapter — never calls Supabase directly.
 */
export const useServicios = (centroId: TCentroId | null): IUseServiciosResult => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:
      centroId !== null ? QUERY_KEYS.serviciosByCentro(centroId) : QUERY_KEYS.serviciosActivos,
    queryFn: () =>
      centroId !== null ? servicioAdapter.findByCentro(centroId) : servicioAdapter.findActivos(),
    staleTime: 1000 * 60 * 5, // 5 min — service catalogue changes infrequently
  });

  return {
    servicios: data ?? [],
    isLoading,
    isError,
    refetch,
  };
};
