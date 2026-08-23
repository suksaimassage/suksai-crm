/**
 * useSalasActivas.ts — active treatment rooms for a centre.
 *
 * Feeds the CitaModal sala picker. Uses SupabaseSalaAdapter.findActivasByCentro
 * so inactive salas are excluded up-front (Analyst edge case #7); the domain
 * still rejects an inactive sala on submit as a safety net.
 *
 * Read-only.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import type { ISala } from '@domain/models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseSalaAdapter();

export interface IUseSalasActivasResult {
  readonly salas: readonly ISala[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useSalasActivas = (centroId: TCentroId | null): IUseSalasActivasResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'picker', 'salas', centroId] as const,
    queryFn: (): Promise<readonly ISala[]> => {
      if (centroId === null) return Promise.resolve([]);
      return adapter.findActivasByCentro(centroId);
    },
    enabled: centroId !== null,
    staleTime: 300_000,
  });

  return {
    salas: data ?? [],
    isLoading,
    isError,
  };
};
