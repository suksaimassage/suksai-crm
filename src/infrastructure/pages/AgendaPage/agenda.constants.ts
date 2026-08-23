export const AGENDA_SLOT_HEIGHT_PX = 60;
// Admin Day + Week grids visible time range: 10:00–21:00.
export const AGENDA_DAY_START_HOUR = 10;
export const AGENDA_DAY_END_HOUR = 21;
export const AGENDA_TOTAL_SLOTS = (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * 2;
export const THERAPIST_WEEK_START_HOUR = 9;
export const THERAPIST_WEEK_END_HOUR = 21;
export const THERAPIST_WEEK_TOTAL_SLOTS = (THERAPIST_WEEK_END_HOUR - THERAPIST_WEEK_START_HOUR) * 2;

/**
 * Kanban columns for the AgendaCalendarOverlay — partitioned by therapist
 * ASSIGNMENT, not by estado. Exactly two columns:
 *   - sinAsignar: citas with `therapistId === null` (no masajista yet)
 *   - asignadas:  citas with `therapistId !== null` (a masajista is assigned)
 *
 * `as const` tuple (enum is forbidden by `erasableSyntaxOnly`). The order here is
 * the render order in `CalendarDayKanban` and the partition order in
 * `partitionCitasByKanbanColumn`.
 */
export const KANBAN_COLUMN_IDS = ['sinAsignar', 'asignadas'] as const;

export type TKanbanColumnId = (typeof KANBAN_COLUMN_IDS)[number];
