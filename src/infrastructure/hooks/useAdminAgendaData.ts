import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SupabaseAgendaAdapter } from '@infra/adapters/SupabaseAgendaAdapter';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import { TERAPEUTAS_QUERY_KEY } from '@infra/hooks/useAgendaTerapeutas';
import type { TCentroId } from '@domain/types';
import type {
  IAgendaAppointment,
  IAgendaTherapist,
  IAgendaKpi,
  IAgendaAlert,
  IAgendaLegendItem,
  IAgendaTerapeutaRow,
} from '@domain/models/agenda.models';

const adapter = new SupabaseAgendaAdapter();

export interface IUseAdminAgendaDataResult {
  readonly therapists: readonly IAgendaTherapist[];
  readonly appointments: readonly IAgendaAppointment[];
  /**
   * Citas for the active date with no therapist assigned yet (estado
   * 'sin_asignar'). Excluded from `appointments` (the therapist-column grid) —
   * rendered in the day grid's leading "Sin asignación" column so they are never
   * invisible for the day.
   */
  readonly unassignedAppointments: readonly IAgendaAppointment[];
  readonly kpis: readonly IAgendaKpi[];
  readonly alerts: readonly IAgendaAlert[];
  readonly legendItems: readonly IAgendaLegendItem[];
  /** Today's total (real) citas for the active centro — drives the admin role-toggle badge. */
  readonly adminCount: number;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useAdminAgendaData = (
  centroId: TCentroId | null,
  date: string,
): IUseAdminAgendaDataResult => {
  // queryClient.ensureQueryData inside the queryFn below writes/reads from the
  // shared ['agenda','terapeutas',centroId] entry so this hook and useAdminWeekData
  // share one cached result instead of each maintaining a duplicate per-date entry.
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', 'admin', centroId, date] as const,
    queryFn: async () => {
      if (centroId === null) return null;
      const parsedDate = new Date(date + 'T00:00:00');

      // Terapeutas: read from/populate the shared cache entry (staleTime 5 min).
      // ensureQueryData returns the cached value if fresh, otherwise fetches once.
      const terapeutas = await queryClient.ensureQueryData<readonly IAgendaTerapeutaRow[]>({
        queryKey: TERAPEUTAS_QUERY_KEY(centroId),
        queryFn: () => adapter.fetchDayTerapeutas(centroId),
        staleTime: 5 * 60_000,
      });

      const [rawCitas, cancelledCitas, unassignedRaw, horarios] = await Promise.all([
        adapter.fetchDayCitas(centroId, parsedDate),
        adapter.fetchDayCancelledCitas(centroId, parsedDate),
        adapter.fetchDayUnassignedCitas(centroId, parsedDate),
        adapter.fetchDayHorarios(centroId, parsedDate),
      ]);

      // Build a Map<userId, horarios[]> for O(1) lookup per therapist.
      const horariosMap = new Map<number, (typeof horarios)[number][]>();
      for (const h of horarios) {
        const list = horariosMap.get(h.usuarioId) ?? [];
        list.push(h);
        horariosMap.set(h.usuarioId, list);
      }

      const now = new Date();
      const appointments = AgendaEnrichmentService.enrichAppointments(rawCitas, now);
      const unassignedAppointments = AgendaEnrichmentService.enrichAppointments(unassignedRaw, now);
      const therapists = AgendaEnrichmentService.deriveTherapists(
        terapeutas,
        rawCitas,
        horariosMap,
        parsedDate,
      );
      const kpis = AgendaEnrichmentService.computeKpis(rawCitas, terapeutas, now);
      const baseAlerts = AgendaEnrichmentService.computeAlerts(rawCitas, cancelledCitas);

      // Produce a missing_schedule alert for each therapist who has citas but
      // no active horario_trabajo for the queried date (schedule deleted after booking).
      const missingScheduleAlerts = therapists
        .filter((th) => !th.isAvailableOnDate && th.appointmentCount > 0)
        .map((th) => ({
          id: `missing-sched-${th.id}`,
          type: 'missing_schedule' as const,
          title: 'Horario no encontrado',
          message: `${th.nombre}${th.apellidos ? ' ' + th.apellidos : ''} tiene citas asignadas pero sin horario activo para este día.`,
        }));

      const alerts = [...baseAlerts, ...missingScheduleAlerts];
      // adminCount mirrors the "Reservas · Hoy" KPI (real citas only) so the
      // role-toggle badge and the KPI never disagree.
      const adminCount = kpis.find((k) => k.id === 'reservas-hoy')?.value ?? 0;
      return { appointments, unassignedAppointments, therapists, kpis, alerts, adminCount };
    },
    enabled: centroId !== null,
    staleTime: 60_000,
  });

  return {
    therapists: data?.therapists ?? [],
    appointments: data?.appointments ?? [],
    unassignedAppointments: data?.unassignedAppointments ?? [],
    kpis: data?.kpis ?? [],
    alerts: data?.alerts ?? [],
    legendItems: AgendaEnrichmentService.legendItems,
    adminCount: data?.adminCount ?? 0,
    isLoading,
    isError,
  };
};
