/**
 * services/horarioSchedule.ts
 *
 * Pure, side-effect-free logic-layer refinement of `IHorarioTrabajo` for the
 * availability + overlap-prevention rules. No I/O, no repositories — fully
 * unit-testable in isolation (target 100%).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A DISCRIMINATED UNION (TS6, exhaustive, type-safe)
 * ─────────────────────────────────────────────────────────────────────────────
 * `IHorarioTrabajo` is the row/model shape: `diaSemana` and `fecha` are BOTH
 * nullable because a single interface must represent either tipo. That nullability
 * is correct for the DB row but forces `?.`/`!` noise everywhere the LOGIC layer
 * reasons about a schedule. `TTherapistSchedule` is the refinement used ONLY by
 * the availability/overlap logic: once narrowed, a recurrente schedule is KNOWN to
 * have a non-null `diaSemana` (and null `fecha`), and vice-versa — so the compiler
 * enforces exhaustive handling. `IHorarioTrabajo` stays the canonical shape; we do
 * NOT churn its many consumers.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OVERRIDE / EXCEPTION MODEL (owner-decided product rule)
 * ─────────────────────────────────────────────────────────────────────────────
 * For a given (therapist, date): if ANY active `especifico` matches the date, the
 * day's windows are EXACTLY those especifico rows (supports split shifts = multiple
 * especifico same date); recurrente is ignored. Only when NO especifico matches do
 * the recurrente rows for that weekday apply. Especifico REPLACES recurrente — it
 * is an exception, never additive.
 *
 * Consequently overlap-prevention only checks WITHIN the same tipo+key:
 *   - recurrente × recurrente on the same `diaSemana`
 *   - especifico × especifico on the same `fecha`
 * A recurrente and an especifico are NOT a write-time conflict (the especifico
 * simply wins at read/availability time).
 */

import type { IHorarioTrabajo } from '../models';
import type { THorarioId, TUserId, TCentroId, TDiaSemana } from '../types';
import { TimeRange } from '../value-objects/TimeRange';
import type { IWorkingWindow } from './availability.slots';

// ── Discriminated union — logic-layer refinement of IHorarioTrabajo ──────────

/** A recurrente schedule: `diaSemana` is guaranteed present, `fecha` is null. */
export interface IRecurrenteHorario {
  readonly id: THorarioId;
  readonly usuarioId: TUserId;
  readonly centroId: TCentroId;
  readonly tipo: 'recurrente';
  readonly diaSemana: TDiaSemana;
  readonly fecha: null;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly activo: boolean;
}

/** An especifico schedule: `fecha` is guaranteed present, `diaSemana` is null. */
export interface IEspecificoHorario {
  readonly id: THorarioId;
  readonly usuarioId: TUserId;
  readonly centroId: TCentroId;
  readonly tipo: 'especifico';
  readonly diaSemana: null;
  readonly fecha: Date;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly activo: boolean;
}

export type TTherapistSchedule = IRecurrenteHorario | IEspecificoHorario;

// ── Type guards ──────────────────────────────────────────────────────────────

/** Narrows a refined schedule to the recurrente arm. */
export function isRecurrente(schedule: TTherapistSchedule): schedule is IRecurrenteHorario {
  return schedule.tipo === 'recurrente';
}

/** Narrows a refined schedule to the especifico arm. */
export function isEspecifico(schedule: TTherapistSchedule): schedule is IEspecificoHorario {
  return schedule.tipo === 'especifico';
}

// ── Narrowing helper ───────────────────────────────────────────────────────

/**
 * Refines a row-shaped `IHorarioTrabajo` into the exhaustive `TTherapistSchedule`
 * union, or returns null when the row violates its own tipo invariant
 * (recurrente with no `diaSemana`, especifico with no `fecha`). Returning null
 * (rather than throwing) lets callers defensively skip a malformed row — a single
 * corrupt row must never break availability for the whole day.
 *
 * Immutability preserved: the returned object is a fresh shallow copy; the input
 * `Date` reference is carried as-is (callers treat schedules as read-only).
 */
export function toTherapistSchedule(h: IHorarioTrabajo): TTherapistSchedule | null {
  if (h.tipo === 'recurrente') {
    if (h.diaSemana === null) return null;
    return {
      id: h.id,
      usuarioId: h.usuarioId,
      centroId: h.centroId,
      tipo: 'recurrente',
      diaSemana: h.diaSemana,
      fecha: null,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      activo: h.activo,
    };
  }
  if (h.fecha === null) return null;
  return {
    id: h.id,
    usuarioId: h.usuarioId,
    centroId: h.centroId,
    tipo: 'especifico',
    diaSemana: null,
    fecha: h.fecha,
    horaInicio: h.horaInicio,
    horaFin: h.horaFin,
    activo: h.activo,
  };
}

// ── Working-window resolution (OVERRIDE model) ───────────────────────────────

/**
 * Resolves a therapist's working windows for a date under the OVERRIDE model.
 * This is the SINGLE source of truth shared by `AvailabilityService` (slot
 * generation) and `CitaService` (Rule 9 booking validation), so the two can never
 * disagree about which window applies to a date:
 *
 *   1. Collect ALL active `especifico` rows whose `fecha` matches `fecha`'s LOCAL
 *      calendar day. Multiple matches = split shifts — ALL count.
 *   2. If step 1 found any → those ARE the windows; recurrente is ignored (the
 *      especifico exception REPLACES it for this date — never additive).
 *   3. Otherwise → ALL active `recurrente` rows whose `diaSemana` matches the
 *      weekday.
 *
 * Returns the windows as `{ horaInicio, horaFin }` (HH:MM). An empty array means
 * "no active schedule that day" (callers decide the fallback: AvailabilityService
 * opens the full studio grid; CitaService rejects with NO_HORARIO).
 *
 * TZ: the weekday and the comparison day come from `fecha`'s LOCAL parts
 * (getDay/getFullYear/getMonth/getDate) — never `toISOString()`, which would roll
 * the calendar day across a UTC offset (e.g. Europe/Madrid) and match the wrong
 * row (or none). The stored `h.fecha` is a UTC-midnight Date (adapter
 * `new Date('YYYY-MM-DD')`), so its UTC date-part recovers the stored calendar
 * day; each side is rendered to `YYYY-MM-DD` via its own correct part and the two
 * strings are compared.
 */
export function resolveWorkingWindowsForDate(
  horarios: readonly IHorarioTrabajo[],
  fecha: Date,
): IWorkingWindow[] {
  const diaSemana = (fecha.getDay() === 0 ? 7 : fecha.getDay()) as TDiaSemana;
  const fechaStr = localDateKey(fecha);

  const toWindow = (h: IHorarioTrabajo): IWorkingWindow => ({
    horaInicio: h.horaInicio,
    horaFin: h.horaFin,
  });

  const especificos = horarios.filter((h) => {
    if (!h.activo) return false;
    const schedule = toTherapistSchedule(h);
    if (schedule === null || !isEspecifico(schedule)) return false;
    // Stored especifico fecha is UTC-midnight → its UTC date-part recovers the
    // stored calendar day; compare against the request's LOCAL date-part.
    return schedule.fecha.toISOString().split('T')[0] === fechaStr;
  });
  if (especificos.length > 0) return especificos.map(toWindow);

  const recurrentes = horarios.filter(
    (h) => h.activo && h.tipo === 'recurrente' && h.diaSemana === diaSemana,
  );
  return recurrentes.map(toWindow);
}

// ── Overlap primitives ─────────────────────────────────────────────────────

/**
 * HALF-OPEN overlap of two HH:MM intervals: touching endpoints do NOT overlap
 * (e.g. 09:00–11:00 and 11:00–13:00 are valid neighbours; 09:00–11:00 and
 * 10:30–12:00 conflict). Delegates to `TimeRange.overlaps`, which already uses
 * the strict `aStart < bEnd && bStart < aEnd` comparison, so the rule lives in
 * exactly one place. Malformed/inverted ranges throw `ValidationError` from
 * `TimeRange.create` — the write path validates ranges before reaching here.
 */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return TimeRange.create(aStart, aEnd).overlaps(TimeRange.create(bStart, bEnd));
}

/** Local "YYYY-MM-DD" for a Date (calendar-day granularity, no UTC shift). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * The same-key comparison key for a refined schedule: recurrente rows collide
 * only on the same weekday (`r:<diaSemana>`), especifico rows only on the same
 * calendar date (`e:<YYYY-MM-DD local>`).
 */
function scheduleKey(schedule: TTherapistSchedule): string {
  if (isRecurrente(schedule)) return `r:${String(schedule.diaSemana)}`;
  return `e:${localDateKey(schedule.fecha)}`;
}

export interface IScheduleConflictCandidate {
  /** Present in update mode — excluded from the scan so a row never conflicts with itself. */
  readonly id?: THorarioId;
  readonly usuarioId: TUserId;
  readonly tipo: 'recurrente' | 'especifico';
  /** Set when tipo = 'recurrente'. */
  readonly diaSemana?: TDiaSemana | null;
  /** Set when tipo = 'especifico'. */
  readonly fecha?: Date | null;
  readonly horaInicio: string;
  readonly horaFin: string;
}

/**
 * Finds the first existing active horario that conflicts with `candidate`, or
 * null when there is none. Per the OVERRIDE model a conflict requires:
 *   - SAME `usuarioId`, AND
 *   - SAME tipo + key: both recurrente on the same `diaSemana`, OR both
 *     especifico on the same `fecha` (local calendar day), AND
 *   - HALF-OPEN time overlap.
 *
 * Cross-tipo (recurrente vs especifico) is NEVER a conflict. The candidate's own
 * id (update mode) is excluded. Inactive rows are skipped. Rows that fail the
 * tipo invariant (malformed) are skipped via `toTherapistSchedule`.
 */
export function findScheduleConflict(
  existing: readonly IHorarioTrabajo[],
  candidate: IScheduleConflictCandidate,
): IHorarioTrabajo | null {
  // Compute the candidate's comparison key from its discriminant, without
  // constructing a full union object (only tipo + weekday/date matter for the
  // key). Returns null when the candidate violates its own tipo invariant.
  const candidateKey = candidateScheduleKey(candidate);
  if (candidateKey === null) return null; // malformed candidate → nothing to compare

  for (const row of existing) {
    if (!row.activo) continue;
    if (row.usuarioId !== candidate.usuarioId) continue;
    if (candidate.id !== undefined && row.id === candidate.id) continue; // self-exclusion

    const rowSchedule = toTherapistSchedule(row);
    if (rowSchedule === null) continue;
    if (rowSchedule.tipo !== candidate.tipo) continue; // cross-tipo never conflicts
    if (scheduleKey(rowSchedule) !== candidateKey) continue; // different weekday/date

    if (timeRangesOverlap(candidate.horaInicio, candidate.horaFin, row.horaInicio, row.horaFin)) {
      return row;
    }
  }
  return null;
}

/** The same-key string for a conflict candidate, or null if its tipo invariant is unmet. */
function candidateScheduleKey(candidate: IScheduleConflictCandidate): string | null {
  if (candidate.tipo === 'recurrente') {
    if (candidate.diaSemana === undefined || candidate.diaSemana === null) return null;
    return `r:${String(candidate.diaSemana)}`;
  }
  if (candidate.fecha === undefined || candidate.fecha === null) return null;
  return `e:${localDateKey(candidate.fecha)}`;
}
