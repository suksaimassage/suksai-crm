/**
 * useCentroMasajistas.ts — masajistas assigned to a centre.
 *
 * Single source for both (a) the CitaModal therapist picker and (b) the admin
 * therapist selector in the therapist view. Reuses the existing
 * SupabaseAgendaAdapter.fetchDayTerapeutas, which already returns centre
 * masajistas (filtered by the 'masajista' role) — no new adapter needed.
 *
 * Read-only.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import type { IAgendaTerapeutaRow } from '@domain/models/agenda.models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseAgendaAdapter();

export interface IUseCentroMasajistasResult {
  readonly masajistas: readonly IAgendaTerapeutaRow[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useCentroMasajistas = (centroId: TCentroId | null): IUseCentroMasajistasResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'picker', 'masajistas', centroId] as const,
    queryFn: (): Promise<readonly IAgendaTerapeutaRow[]> => {
      if (centroId === null) return Promise.resolve([]);
      return adapter.fetchDayTerapeutas(centroId);
    },
    enabled: centroId !== null,
    staleTime: 300_000,
  });

  return {
    masajistas: data ?? [],
    isLoading,
    isError,
  };
};
