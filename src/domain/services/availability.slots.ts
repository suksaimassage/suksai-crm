/**
 * services/availability.slots.ts
 *
 * Pure, side-effect-free availability computation for appointment start times.
 * No I/O, no repositories, no `Date.now()` — fully unit-testable in isolation.
 *
 * HYBRID semantics (product decision):
 *  - Base grid: candidate starts from AGENDA_OPEN_MIN to AGENDA_CLOSE_MIN, step
 *    SLOT_STEP_MIN. A start is valid only if `start + duración <= close`.
 *  - Multi-window union: when one or more active working windows apply to the
 *    date, a candidate `[start, start+dur]` is valid if it fits ENTIRELY within
 *    AT LEAST ONE window (the union of windows — supports split shifts). When NO
 *    window applies → fall back to the full [open, close] window (the field
 *    stays usable rather than empty). The midday gap between two split-shift
 *    windows yields no slots because no single window contains it.
 *  - Approved ausencias: candidates overlapping an approved absence are dropped.
 *  - Booking overlaps: candidates overlapping a sala booking or a therapist
 *    booking are dropped. The service filters cancelled citas and the edited
 *    cita (excludeCitaId) out of the ranges before calling this function.
 *
 * The service layer is responsible for resolving the working windows (via the
 * OVERRIDE model), ausencias and bookings and passing them in; this module only
 * does the deterministic math.
 */

import { DateRange } from '../value-objects/DateRange';
import { TimeRange } from '../value-objects/TimeRange';

/** Studio opening time as minutes-from-midnight (09:00). */
export const AGENDA_OPEN_MIN = 540;
/** Studio closing time as minutes-from-midnight (21:00). */
export const AGENDA_CLOSE_MIN = 1260;
/** Grid cadence between candidate start times, in minutes. */
export const SLOT_STEP_MIN = 30;

/**
 * A booked time interval that may block candidate starts. `salaId`/`usuarioId`
 * are unused here — the service pre-filters by id; only the interval matters.
 */
export interface IBookedRange {
  readonly start: Date;
  readonly end: Date;
}

/** An approved absence interval. */
export interface IAbsenceRange {
  readonly start: Date;
  readonly end: Date;
}

/** A therapist working window for the chosen date (HH:MM wall-clock). */
export interface IWorkingWindow {
  readonly horaInicio: string;
  readonly horaFin: string;
}

export interface IComputeAvailableStartTimesParams {
  /** The local date the slots are computed for (time component ignored). */
  readonly fecha: Date;
  /** Service duration in minutes (drives end time + closing-boundary check). */
  readonly duracionMinutos: number;
  /**
   * The therapist's working windows for that date (already resolved via the
   * OVERRIDE model by the service). A candidate must fit entirely within at
   * least one window. EMPTY → no active schedule applies → the full [open,
   * close] window is used so the field stays usable rather than empty.
   */
  readonly windows: readonly IWorkingWindow[];
  /** Approved absence ranges that exclude overlapping candidates. */
  readonly ausencias: readonly IAbsenceRange[];
  /** Non-cancelled bookings in the SELECTED sala (excludeCitaId already removed). */
  readonly salaBookedRanges: readonly IBookedRange[];
  /** Non-cancelled bookings for the therapist (excludeCitaId already removed). */
  readonly therapistBookedRanges: readonly IBookedRange[];
  /** Opening minute-from-midnight. Defaults to AGENDA_OPEN_MIN. */
  readonly openMin?: number;
  /** Closing minute-from-midnight. Defaults to AGENDA_CLOSE_MIN. */
  readonly closeMin?: number;
  /** Grid step in minutes. Defaults to SLOT_STEP_MIN. */
  readonly stepMin?: number;
}

/**
 * Combines a local date with a minute-from-midnight offset into a Date using
 * wall-clock `setHours` (NOT UTC arithmetic) so DST days do not shift by an
 * hour. Mirrors the legacy `#combineDateTime` behaviour.
 */
function combineDateAndMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  result.setHours(hh, mm, 0, 0);
  return result;
}

/** An absolute minute-from-midnight interval within the studio open/close grid. */
interface IMinuteBounds {
  readonly start: number;
  readonly end: number;
}

/**
 * Resolves the working windows into a list of [start, end] minute-bounds, each
 * intersected with the studio [open, close] grid. A malformed/inverted window is
 * skipped (not fatal). An empty input → a SINGLE full [open, close] window (the
 * "no active schedule → field stays usable" fallback). Windows that collapse to
 * empty after intersection are dropped. The result is NOT merged — overlapping
 * windows simply both appear; the union test (`fitsInAnyWindow`) handles overlap.
 */
function resolveWindowBoundsList(
  windows: readonly IWorkingWindow[],
  openMin: number,
  closeMin: number,
): IMinuteBounds[] {
  if (windows.length === 0) {
    return [{ start: openMin, end: closeMin }];
  }

  const bounds: IMinuteBounds[] = [];
  for (const window of windows) {
    let scheduleStart: number;
    let scheduleEnd: number;
    try {
      const range = TimeRange.create(window.horaInicio, window.horaFin);
      const [sh = '0', sm = '0'] = range.start.split(':');
      scheduleStart = parseInt(sh, 10) * 60 + parseInt(sm, 10);
      scheduleEnd = scheduleStart + range.durationMinutes;
    } catch {
      // Malformed/inverted window → skip this one rather than failing the whole
      // day; another window may still yield slots.
      continue;
    }
    const start = Math.max(openMin, scheduleStart);
    const end = Math.min(closeMin, scheduleEnd);
    if (start < end) bounds.push({ start, end });
  }
  return bounds;
}

/** True when [startMin, endMin] fits entirely within at least one window. */
function fitsInAnyWindow(
  startMin: number,
  endMin: number,
  windows: readonly IMinuteBounds[],
): boolean {
  return windows.some((w) => startMin >= w.start && endMin <= w.end);
}

/**
 * Computes the valid candidate start times for the given inputs. Returns an
 * array of `Date` instances (wall-clock on `fecha`). Empty when an approved
 * whole-day absence covers the window, the window is shorter than the duration,
 * or every grid start is saturated by bookings.
 */
export function computeAvailableStartTimes(params: IComputeAvailableStartTimesParams): Date[] {
  const {
    fecha,
    duracionMinutos,
    windows,
    ausencias,
    salaBookedRanges,
    therapistBookedRanges,
    openMin = AGENDA_OPEN_MIN,
    closeMin = AGENDA_CLOSE_MIN,
    stepMin = SLOT_STEP_MIN,
  } = params;

  if (duracionMinutos <= 0) return [];

  const windowBounds = resolveWindowBoundsList(windows, openMin, closeMin);
  // No usable window after intersection (e.g. every window shorter than 1 step,
  // or all malformed) → no slots.
  if (windowBounds.length === 0) return [];

  // Anchor the grid on the studio open time and walk to the latest window end so
  // the cadence is stable across split shifts; the union test filters the rest.
  const gridStart = openMin;
  const gridEnd = Math.min(closeMin, Math.max(...windowBounds.map((w) => w.end)));

  const absenceRanges = ausencias.map((a) => DateRange.create(a.start, a.end));
  const salaRanges = salaBookedRanges.map((r) => DateRange.create(r.start, r.end));
  const therapistRanges = therapistBookedRanges.map((r) => DateRange.create(r.start, r.end));

  const slots: Date[] = [];

  for (let startMin = gridStart; startMin + duracionMinutos <= gridEnd; startMin += stepMin) {
    const endMin = startMin + duracionMinutos;

    // Closing-boundary fit (defensive; gridEnd already <= closeMin).
    if (endMin > closeMin) continue;
    // The full [start, start+dur] block must fit entirely within ≥1 window.
    if (!fitsInAnyWindow(startMin, endMin, windowBounds)) continue;

    const start = combineDateAndMinutes(fecha, startMin);
    const end = combineDateAndMinutes(fecha, endMin);
    const slotRange = DateRange.create(start, end);

    if (absenceRanges.some((r) => r.overlaps(slotRange))) continue;
    if (salaRanges.some((r) => r.overlaps(slotRange))) continue;
    if (therapistRanges.some((r) => r.overlaps(slotRange))) continue;

    slots.push(start);
  }

  return slots;
}
