/**
 * useServiciosActivosCentro.ts — active servicios offered at a centre.
 *
 * Feeds the CitaModal servicio picker. Reuses the existing
 * SupabaseServicioAdapter (`findByCentro`) and filters to estado 'activo' so
 * inactive services never appear as bookable options (Analyst edge case #7).
 *
 * Read-only.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import type { IServicio } from '@domain/models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseServicioAdapter();

export interface IUseServiciosActivosCentroResult {
  readonly servicios: readonly IServicio[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useServiciosActivosCentro = (
  centroId: TCentroId | null,
): IUseServiciosActivosCentroResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'picker', 'servicios', centroId] as const,
    queryFn: async (): Promise<readonly IServicio[]> => {
      if (centroId === null) return [];
      const servicios = await adapter.findByCentro(centroId);
      return servicios.filter((s) => s.estado === 'activo');
    },
    enabled: centroId !== null,
    staleTime: 300_000,
  });

  return {
    servicios: data ?? [],
    isLoading,
    isError,
  };
};
