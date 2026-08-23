/**
 * useCitaById.ts — load a single cita for the detail popover.
 *
 * Reads through the SupabaseCitaAdapter (read-only). The detail popover opens
 * optimistically and shows a loading state while this resolves; `null` data is
 * the "not-found" case (cita deleted / stale id).
 *
 * Query key `['cita', id]` is the one the cita mutation hooks invalidate after
 * an edit / estado change / cancel.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import type { ICita } from '@domain/models';
import type { TCitaId } from '@domain/types';

const adapter = new SupabaseCitaAdapter();

export interface IUseCitaByIdResult {
  readonly cita: ICita | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useCitaById = (citaId: TCitaId | null): IUseCitaByIdResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cita', citaId] as const,
    queryFn: (): Promise<ICita | null> => {
      if (citaId === null) return Promise.resolve(null);
      return adapter.findById(citaId);
    },
    enabled: citaId !== null,
    staleTime: 30_000,
  });

  return {
    cita: data ?? null,
    isLoading,
    isError,
  };
};
