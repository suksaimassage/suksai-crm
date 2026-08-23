import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import { toLocalDateKey } from '@infra/utils/agenda.utils';
import { TERAPEUTAS_QUERY_KEY } from '@infra/hooks/useAgendaTerapeutas';
import type { TCentroId } from '@domain/types';
import type {
  IAgendaWeekDay,
  IAgendaTherapist,
  TTherapistColorMap,
  IAgendaTerapeutaRow,
} from '@domain/models/agenda.models';

const adapter = new SupabaseAgendaAdapter();

export interface IUseAdminWeekDataResult {
  readonly weekDays: readonly IAgendaWeekDay[];
  readonly therapists: readonly IAgendaTherapist[];
  readonly colorMap: TTherapistColorMap;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useAdminWeekData = (
  centroId: TCentroId | null,
  weekStartStr: string,
  /** Pass `false` to skip the fetch while this view is not active. */
  enabled = true,
): IUseAdminWeekDataResult => {
  // queryClient.ensureQueryData inside queryFn reads from/populates the shared
  // ['agenda','terapeutas',centroId] entry so this hook and useAdminAgendaData
  // share one cached result rather than each keeping a duplicate per-date entry.
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'admin', 'week', centroId, weekStartStr] as const,
    queryFn: async () => {
      if (centroId === null) return null;
      const weekStart = new Date(weekStartStr + 'T00:00:00');

      // Terapeutas: read from/populate the shared cache entry (staleTime 5 min).
      const [rawCitas, terapeutas] = await Promise.all([
        adapter.fetchWeekCitas(centroId, weekStart),
        queryClient.ensureQueryData<readonly IAgendaTerapeutaRow[]>({
          queryKey: TERAPEUTAS_QUERY_KEY(centroId),
          queryFn: () => adapter.fetchDayTerapeutas(centroId),
          staleTime: 5 * 60_000,
        }),
      ]);
      const now = new Date();
      const today = toLocalDateKey(now);
      const weekDays = AgendaEnrichmentService.buildWeekDays(weekStartStr, rawCitas, today, now);
      // Week view doesn't filter by availability — pass empty map so all therapists appear.
      const therapists = AgendaEnrichmentService.deriveTherapists(
        terapeutas,
        rawCitas,
        new Map(),
        weekStart,
      );
      const colorMap = AgendaEnrichmentService.deriveTherapistColorMap(therapists.map((t) => t.id));
      return { weekDays, therapists, colorMap };
    },
    enabled: enabled && centroId !== null,
    staleTime: 60_000,
  });

  return {
    weekDays: data?.weekDays ?? [],
    therapists: data?.therapists ?? [],
    colorMap: data?.colorMap ?? {},
    isLoading,
    isError,
  };
};
