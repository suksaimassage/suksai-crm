/**
 * useAgendaTerapeutas
 *
 * Shared query for the roster of terapeutas assigned to a centro.
 * Consumed by useAdminAgendaData (day/list view) and useAdminWeekData (week view)
 * so a single React Query cache entry is shared between them instead of each
 * hook calling adapter.fetchDayTerapeutas() with its own date-scoped key.
 *
 * Cache strategy:
 *   staleTime: 5 min — therapist rosters change infrequently within a session.
 *   key: ['agenda', 'terapeutas', centroId] — no date component so navigating
 *   between days/weeks never re-downloads the same list.
 */
import { useQuery } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import type { IAgendaTerapeutaRow } from '@domain/models/agenda.models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseAgendaAdapter();

export interface IUseAgendaTerapeutasResult {
  readonly terapeutas: readonly IAgendaTerapeutaRow[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const TERAPEUTAS_QUERY_KEY = (centroId: TCentroId) =>
  ['agenda', 'terapeutas', centroId] as const;

export const useAgendaTerapeutas = (centroId: TCentroId | null): IUseAgendaTerapeutasResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey:
      centroId !== null
        ? TERAPEUTAS_QUERY_KEY(centroId)
        : (['agenda', 'terapeutas', null] as const),
    queryFn: async () => {
      if (centroId === null) return [] as IAgendaTerapeutaRow[];
      return adapter.fetchDayTerapeutas(centroId);
    },
    enabled: centroId !== null,
    // Roster changes at most when a therapist is added/removed from the centro —
    // 5 min stale time avoids redundant re-fetches during normal navigation.
    staleTime: 5 * 60_000,
  });

  return {
    terapeutas: data ?? [],
    isLoading,
    isError,
  };
};
