import { useQuery } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import type { TUserId } from '@domain/types';
import type {
  IAgendaAppointment,
  IAgendaDayNotes,
  IAgendaReview,
  IAgendaShiftStats,
} from '@domain/models/agenda.models';

const adapter = new SupabaseAgendaAdapter();

export interface IUseTherapistAgendaDataResult {
  readonly appointments: readonly IAgendaAppointment[];
  readonly stats: IAgendaShiftStats;
  readonly notes: IAgendaDayNotes | null;
  readonly reviews: readonly IAgendaReview[];
  readonly sala: string;
  /** Today's real cita count for the shown therapist — drives the therapist role-toggle badge. */
  readonly therapistCount: number;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const EMPTY_STATS: IAgendaShiftStats = {
  citasTotal: 0,
  citasCompletadas: 0,
  horasEnSala: 0,
  propinas: 0,
  valoracionMedia: 0,
};

/**
 * Therapist day agenda. `userId` is the therapist whose agenda to show: it is
 * the signed-in masajista's own id by default, OR a therapist id chosen by an
 * admin via the therapist selector (Pass 2). The hook is identity-agnostic — any
 * valid therapist id works; passing `null` disables the query.
 */
export const useTherapistAgendaData = (
  userId: TUserId | null,
  date: string,
): IUseTherapistAgendaDataResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'therapist', userId, date] as const,
    queryFn: async () => {
      if (userId === null) return null;
      const parsedDate = new Date(date + 'T00:00:00');
      const rawCitas = await adapter.fetchTherapistDayCitas(userId, parsedDate);
      const now = new Date();
      const appointments = AgendaEnrichmentService.enrichAppointments(rawCitas, now);
      const stats = AgendaEnrichmentService.computeShiftStats(rawCitas);
      const sortedCitas = [...rawCitas].sort((a, b) => a.startIso.localeCompare(b.startIso));
      const sala = sortedCitas[0]?.sala ?? '—';
      // therapistCount = real citas for the day (matches computeShiftStats.citasTotal).
      const therapistCount = stats.citasTotal;
      return { appointments, stats, sala, therapistCount };
    },
    enabled: userId !== null,
    staleTime: 60_000,
  });

  return {
    appointments: data?.appointments ?? [],
    stats: data?.stats ?? EMPTY_STATS,
    notes: null,
    reviews: [],
    sala: data?.sala ?? '—',
    therapistCount: data?.therapistCount ?? 0,
    isLoading,
    isError,
  };
};
