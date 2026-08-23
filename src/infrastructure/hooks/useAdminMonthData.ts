import { useQuery } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import { toLocalDateKey } from '@infra/utils/agenda.utils';
import type { TCentroId } from '@domain/types';
import type {
  IAgendaMonthCell,
  IAgendaMonthFooterKpis,
  TTherapistColorMap,
} from '@domain/models/agenda.models';

const adapter = new SupabaseAgendaAdapter();

export interface IUseAdminMonthDataResult {
  readonly cells: readonly IAgendaMonthCell[];
  readonly footerKpis: IAgendaMonthFooterKpis;
  readonly colorMap: TTherapistColorMap;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const EMPTY_FOOTER: IAgendaMonthFooterKpis = {
  totalCitas: 0,
  monthLabel: '',
  ocupacionPct: null,
  peakDays: [],
};

export const useAdminMonthData = (
  centroId: TCentroId | null,
  year: number,
  month: number,
  /** Pass `false` to skip the fetch while this view is not active. */
  enabled = true,
): IUseAdminMonthDataResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'admin', 'month', centroId, year, month] as const,
    queryFn: async () => {
      if (centroId === null) return null;
      const rawCitas = await adapter.fetchMonthCitas(centroId, year, month);
      const today = toLocalDateKey(new Date());
      const cells = AgendaEnrichmentService.buildMonthCells(year, month, rawCitas, today);
      const footerKpis = AgendaEnrichmentService.computeMonthFooterKpis(rawCitas, year, month);
      // Filter out null (sin_asignar citas have no therapist) before building the color map
      const therapistIds = [
        ...new Set(rawCitas.map((c) => c.therapistId).filter((id): id is number => id !== null)),
      ];
      const colorMap = AgendaEnrichmentService.deriveTherapistColorMap(therapistIds);
      return { cells, footerKpis, colorMap };
    },
    enabled: enabled && centroId !== null,
    staleTime: 60_000,
  });

  return {
    cells: data?.cells ?? [],
    footerKpis: data?.footerKpis ?? EMPTY_FOOTER,
    colorMap: data?.colorMap ?? {},
    isLoading,
    isError,
  };
};
