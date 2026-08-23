import { useQuery } from '@tanstack/react-query';
import { SupabaseTipoServicioAdapter } from '@infra/adapters/SupabaseTipoServicioAdapter';
import type { ITipoServicio } from '@domain/models';

// Adapter singleton — module scope avoids re-instantiation on every render
const tipoServicioAdapter = new SupabaseTipoServicioAdapter();

export interface IUseTipoServiciosResult {
  readonly tipoServicios: readonly ITipoServicio[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const QUERY_KEYS = {
  tipoServicios: ['rituales', 'tipo-servicios'] as const,
} as const;

/**
 * Fetches all service categories (tipo_servicios).
 * staleTime is long — categories rarely change.
 */
export const useTipoServicios = (): IUseTipoServiciosResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.tipoServicios,
    queryFn: () => tipoServicioAdapter.findAll(),
    staleTime: 1000 * 60 * 30, // 30 min — category list is near-static
  });

  return {
    tipoServicios: data ?? [],
    isLoading,
    isError,
  };
};
