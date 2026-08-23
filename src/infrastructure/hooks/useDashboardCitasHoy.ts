/**
 * useDashboardCitasHoy.ts
 *
 * Fetches today's appointments for the AppointmentPanel.
 * - If user has role 'masajista': filters by usuario_id (own appointments only).
 * - Otherwise: fetches all centro appointments via embedded joins.
 *
 * Returns IDashboardAppointmentRow[] — the view-model shape for the panel.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseDashboardAdapter } from '@infra/adapters/SupabaseDashboardAdapter';
import { toLocalDateKey } from '@infra/utils/agenda.utils';
import type { ICitaConJoins } from '@infra/adapters/SupabaseDashboardAdapter';
import type { IDashboardAppointmentRow } from '@infra/pages/DashboardOverviewPage/DashboardOverviewPage.fixtures';
import type { TCentroId, TUserId, TEstadoCita, TNombreRol } from '@domain/types';

const dashboardAdapter = new SupabaseDashboardAdapter();

function mapJoinRowToAppointmentRow(row: ICitaConJoins): IDashboardAppointmentRow {
  return {
    id: row.id,
    fechaHoraInicio: row.fecha_inicio ?? new Date().toISOString(),
    clienteNombre: `${row.clientes?.nombre ?? '—'} ${row.clientes?.apellidos ?? ''}`.trim(),
    servicioNombre: row.servicios?.nombre ?? '—',
    terapeutaNombre: row.usuarios?.nombre ?? '—',
    salaNombre: row.salas?.nombre ?? '—',
    duracionMinutos: row.servicios?.duracion !== undefined ? `${row.servicios.duracion} min` : '—',
    estado: (row.estado ?? 'pendiente') as TEstadoCita,
  };
}

export interface IUseDashboardCitasHoyResult {
  readonly data: readonly IDashboardAppointmentRow[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useDashboardCitasHoy = (
  centroId: TCentroId | null,
  userId: TUserId | null,
  roles: readonly TNombreRol[],
): IUseDashboardCitasHoyResult => {
  const today = new Date();
  const todayISODate = toLocalDateKey(today);
  const isTerapeuta = roles.includes('masajista');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'citas-hoy', centroId, userId, isTerapeuta, todayISODate],
    queryFn: async () => {
      if (isTerapeuta) {
        if (userId === null) return [];
        const rows = await dashboardAdapter.fetchTerapeutaTodayAppointments(userId, today);
        return rows.map(mapJoinRowToAppointmentRow);
      }

      if (centroId === null) return [];
      const rows = await dashboardAdapter.fetchTodayAppointments(centroId, today);
      return rows.map(mapJoinRowToAppointmentRow);
    },
    enabled: isTerapeuta ? userId !== null : centroId !== null,
    staleTime: 60_000, // 1 min — appointments can change frequently
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
  };
};
