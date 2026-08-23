/**
 * calendarOverlay.utils.ts — pure helpers for the AgendaCalendarOverlay.
 *
 * SRP: assignment→column partition, day-source fusion and therapist-name
 * resolution. No React, no data access, no i18n — the localisation of
 * placeholders is the caller's responsibility. Testable in isolation.
 */
import type { IAgendaAppointment, IAgendaTherapist } from '@domain/models/agenda.models';
import type { TUserId } from '@domain/types';

import type { TKanbanColumnId } from '../../agenda.constants';

/** Kanban partition keyed by column id; each bucket is a plain mutable array. */
export type TKanbanPartition = Record<TKanbanColumnId, IAgendaAppointment[]>;

/**
 * Partitions citas into the two Kanban columns by therapist ASSIGNMENT:
 *   - `sinAsignar`: `therapistId === null` (no masajista assigned)
 *   - `asignadas`:  `therapistId !== null` (a masajista is assigned)
 *
 * The distribution is disjoint (each cita lands in a single column) and
 * exhaustive (every cita is assigned or not). Nullable fields (clientName /
 * sala / therapistId) are carried through untouched — the placeholder
 * localisation happens in the view.
 */
export const partitionCitasByKanbanColumn = (
  citas: readonly IAgendaAppointment[],
): TKanbanPartition => {
  const partition: TKanbanPartition = { sinAsignar: [], asignadas: [] };

  for (const cita of citas) {
    const columnId: TKanbanColumnId = cita.therapistId === null ? 'sinAsignar' : 'asignadas';
    partition[columnId].push(cita);
  }

  return partition;
};

/**
 * Merges the two day sources returned by `useAdminAgendaData` into a single
 * list. `unassignedAppointments` (therapistId = null) are appended so they
 * surface in the "Sin asignar" column — reading only `appointments` would leave
 * that column incomplete.
 */
export const mergeDayCitas = (
  appointments: readonly IAgendaAppointment[],
  unassignedAppointments: readonly IAgendaAppointment[],
): readonly IAgendaAppointment[] => [...appointments, ...unassignedAppointments];

/**
 * Resolves a therapist's display name (nombre + apellidos) from its id. Returns
 * `null` when the id is `null` (unassigned cita) or no therapist matches — the
 * caller renders the localised placeholder, never the literal "null".
 */
export const resolveTherapistName = (
  therapistId: TUserId | null,
  therapists: readonly IAgendaTherapist[],
): string | null => {
  if (therapistId === null) return null;

  const therapist = therapists.find((t) => t.id === therapistId);
  if (therapist === undefined) return null;

  return `${therapist.nombre} ${therapist.apellidos}`.trim();
};
