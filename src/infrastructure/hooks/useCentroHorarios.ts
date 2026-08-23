/**
 * useCentroHorarios.ts
 *
 * Read hook: all active horarios_trabajo for a centre (both tipos, every
 * therapist) in a single query, via SupabaseHorarioAdapter.findByCentro.
 *
 * Query key: ['centro-horarios', centroId]
 * Stale time: 60s — consistent with useTerapeutas; schedules change infrequently.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseHorarioAdapter } from '@infra/adapters/SupabaseHorarioAdapter';
import type { TCentroId } from '@domain/types';
import type { IHorarioTrabajo } from '@domain/models';

const adapter = new SupabaseHorarioAdapter();

export interface IUseCentroHorariosResult {
  readonly data: readonly IHorarioTrabajo[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

export const useCentroHorarios = (centroId: TCentroId | null): IUseCentroHorariosResult => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['centro-horarios', centroId],
    queryFn: async (): Promise<readonly IHorarioTrabajo[]> => {
      if (centroId === null) return [];
      return adapter.findByCentro(centroId);
    },
    enabled: centroId !== null,
    staleTime: 60_000,
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
    refetch,
  };
};
