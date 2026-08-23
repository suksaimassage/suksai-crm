/**
 * horarioShiftMapper.ts
 *
 * Pure mapping between domain `IHorarioTrabajo` rows and the
 * WorkScheduleCalendar's `Shift` view model. No React, no side-effects —
 * unit-testable in isolation (target 100%).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RECURRENTE READ-ONLY WRITE CONTRACT  (Analyst RESOLVED DECISION §8)
 * ─────────────────────────────────────────────────────────────────────────────
 * The calendar is the editing surface for `especifico` horarios ONLY.
 * `recurrente` horarios are a WEEKLY TEMPLATE (dia_semana + times) with no single
 * date; dragging "the Tuesday occurrence" cannot be mapped back onto the template
 * without either rewriting every future week or silently creating an exception.
 * Both are surprising and destructive, so recurrente shifts render READ-ONLY.
 *
 * The `Shift` type carries no domain link beyond `id: string`, so origin is
 * encoded in the id (and the color) to make a calendar write safely classifiable:
 *   - especifico → id = `esp:<horarioId>`            , color = 'primary'   (editable)
 *   - recurrente → id = `rec:<horarioId>:<YYYY-MM-DD>`, color = 'secondary' (read-only)
 *
 * Write handlers MUST call `isRecurrenteShiftId(shift.id)` and no-op for recurrente
 * shifts. `parseEspecificoHorarioId` recovers the domain id for especifico writes.
 */

import type { IHorarioTrabajo } from '@domain/models';
import type { TDiaSemana, TUserId } from '@domain/types';
import type { Shift } from '@infra/components/ui/shared/WorkScheduleCalendar';

// ── Shift id encoding ───────────────────────────────────────────────────────

const ESPECIFICO_PREFIX = 'esp:';
const RECURRENTE_PREFIX = 'rec:';

/** id for an especifico-origin (editable) shift. */
export function buildEspecificoShiftId(horarioId: number): string {
  return `${ESPECIFICO_PREFIX}${String(horarioId)}`;
}

/** id for a recurrente-origin (read-only) synthetic shift on a given date. */
export function buildRecurrenteShiftId(horarioId: number, dateKey: string): string {
  return `${RECURRENTE_PREFIX}${String(horarioId)}:${dateKey}`;
}

/** True when the shift originates from a recurrente template → NOT editable via calendar. */
export function isRecurrenteShiftId(shiftId: string): boolean {
  return shiftId.startsWith(RECURRENTE_PREFIX);
}

/**
 * Recovers the domain horario id from an especifico shift id, or null when the
 * id is not especifico-origin (e.g. it is recurrente). Used by update/delete.
 */
export function parseEspecificoHorarioId(shiftId: string): number | null {
  if (!shiftId.startsWith(ESPECIFICO_PREFIX)) return null;
  const raw = shiftId.slice(ESPECIFICO_PREFIX.length);
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ── Date helpers (local-time, calendar-range bounded) ───────────────────────

/** "YYYY-MM-DD" in local time (matches the calendar's Shift.date convention). */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO weekday for a JS Date: Mon=1 … Sun=7 (JS getDay returns 0 for Sun). */
function isoWeekday(date: Date): TDiaSemana {
  const raw = date.getDay();
  return (raw === 0 ? 7 : raw) as TDiaSemana;
}

// ── Mapper ──────────────────────────────────────────────────────────────────

export interface IMapHorariosParams {
  readonly horarios: readonly IHorarioTrabajo[];
  /** Employee ids the calendar will render columns for (string form). */
  readonly employeeIds: ReadonlySet<string>;
  /** Inclusive start of the calendar window to expand recurrente into. */
  readonly rangeStart: Date;
  /** Inclusive end of the calendar window to expand recurrente into. */
  readonly rangeEnd: Date;
  /**
   * Optional localized marker shown as the recurrente shift's `label` (Day block
   * + DetailPanel title + Week card). A NON-COLOR cue that the shift is a
   * read-only recurring template, so the recurrente/especifico distinction is
   * not conveyed by color alone (WCAG 1.4.1). The integration caller supplies it;
   * omitting it (e.g. in unit tests) simply yields no marker.
   */
  readonly recurrenteLabel?: string;
  /** Optional localized note shown in the DetailPanel explaining read-only status. */
  readonly recurrenteNote?: string;
}

/**
 * Maps active horarios to calendar Shifts within [rangeStart, rangeEnd].
 *   - especifico → one Shift on its `fecha` (if inside the range).
 *   - recurrente → one synthetic READ-ONLY Shift per matching weekday in range.
 * Shifts whose therapist is not in `employeeIds` (deactivated/unassigned, or a
 * null usuarioId row) are dropped so the calendar never renders orphan rows.
 */
export function mapHorariosToShifts({
  horarios,
  employeeIds,
  rangeStart,
  rangeEnd,
  recurrenteLabel,
  recurrenteNote,
}: IMapHorariosParams): Shift[] {
  const shifts: Shift[] = [];

  // Normalize range bounds to day granularity for deterministic comparisons.
  const startKey = toDateKey(rangeStart);
  const endKey = toDateKey(rangeEnd);

  for (const horario of horarios) {
    const employeeId = String(horario.usuarioId);
    // Drop rows for therapists not currently in the centre's employee set,
    // and rows with no attributable user (usuarioId 0 = null in the adapter).
    if (horario.usuarioId === (0 as TUserId) || !employeeIds.has(employeeId)) continue;

    if (horario.tipo === 'especifico') {
      if (horario.fecha === null) continue;
      const dateKey = toDateKey(horario.fecha);
      if (dateKey < startKey || dateKey > endKey) continue;
      shifts.push({
        id: buildEspecificoShiftId(horario.id),
        employeeId,
        date: dateKey,
        startTime: horario.horaInicio,
        endTime: horario.horaFin,
        color: 'primary',
      });
      continue;
    }

    // recurrente — expand across matching weekdays inside the range (READ-ONLY).
    if (horario.diaSemana === null) continue;
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
    while (cursor.getTime() <= last.getTime()) {
      if (isoWeekday(cursor) === horario.diaSemana) {
        const dateKey = toDateKey(cursor);
        shifts.push({
          id: buildRecurrenteShiftId(horario.id, dateKey),
          employeeId,
          date: dateKey,
          startTime: horario.horaInicio,
          endTime: horario.horaFin,
          color: 'secondary',
          // Non-color cue (WCAG 1.4.1): a textual marker + explanatory note so a
          // recurrente (read-only) shift is distinguishable from an especifico
          // (editable) one without relying on the secondary/primary hue.
          label: recurrenteLabel,
          note: recurrenteNote,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return shifts;
}
