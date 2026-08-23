import { useQuery } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import { toLocalDateKey } from '@infra/utils/agenda.utils';
import type { TUserId } from '@domain/types';
import type { IAgendaTherapistWeekDay, IAgendaWeekBalance } from '@domain/models/agenda.models';

const adapter = new SupabaseAgendaAdapter();

export interface IUseTherapistWeekDataResult {
  readonly weekDays: readonly IAgendaTherapistWeekDay[];
  readonly balance: IAgendaWeekBalance;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const EMPTY_BALANCE: IAgendaWeekBalance = {
  citasTotal: 0,
  citasCompletadas: 0,
  horasEnSala: 0,
  propinas: 0,
  valoracionMedia: 0,
  weekLabel: '',
};

export const useTherapistWeekData = (
  therapistId: TUserId | null,
  weekStartStr: string,
): IUseTherapistWeekDataResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'therapist', 'week', therapistId, weekStartStr] as const,
    queryFn: async () => {
      if (therapistId === null) return null;
      const weekStart = new Date(weekStartStr + 'T00:00:00');
      const rawCitas = await adapter.fetchTherapistWeekCitas(therapistId, weekStart);
      const now = new Date();
      const today = toLocalDateKey(now);
      const weekDays = AgendaEnrichmentService.buildTherapistWeekDays(
        weekStartStr,
        rawCitas,
        today,
        now,
      );
      const balance = AgendaEnrichmentService.computeWeekBalance(weekDays, weekStartStr);
      return { weekDays, balance };
    },
    enabled: therapistId !== null,
    staleTime: 60_000,
  });

  return {
    weekDays: data?.weekDays ?? [],
    balance: data?.balance ?? EMPTY_BALANCE,
    isLoading,
    isError,
  };
};
