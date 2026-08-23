export function deriveInitials(nombre: string): string {
  const words = nombre.trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export function formatHorasEnSala(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatHoraLabel(slot: number, dayStartHour: number): string {
  const totalMinutes = dayStartHour * 60 + slot * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToTopOffset(time: string, dayStartHour: number, slotHeightPx: number): number {
  const parts = time.split(':');
  const hour = parseInt(parts[0] || '0', 10);
  const min = parseInt(parts[1] || '0', 10);
  const minutesFromStart = (hour - dayStartHour) * 60 + min;
  return (minutesFromStart / 30) * slotHeightPx;
}

export function durationToHeight(durationMin: number, slotHeightPx: number): number {
  return (durationMin / 30) * slotHeightPx;
}

/**
 * Inverse of `timeToTopOffset`: converts a vertical pixel offset inside a day
 * track back to a snapped "HH:MM" start time.
 *
 * Used by the week-grid drag & drop (Surface A) to translate where the user
 * dropped a cita block into a candidate start time.
 *
 * - `snapMin` (default 30) quantizes the result to the agenda's slot grid; the
 *   day grid only ever offers 30-min starts, so snapping to anything finer would
 *   produce starts the schedule engine rejects.
 * - The result is clamped to `[dayStartHour, dayEndHour − durationMin]` so a
 *   block whose duration would overflow the day end snaps to the latest start
 *   that still fits (Analyst E-A2). Pass `durationMin = 0` for a bare start clamp.
 *
 * Pure (no DOM): callers supply the already-computed offset (pointer Y relative
 * to the track, adjusted for the grab point) so this stays unit-testable.
 */
export function topOffsetToTime(
  offsetPx: number,
  dayStartHour: number,
  slotHeightPx: number,
  snapMin: number,
  dayEndHour: number,
  durationMin: number,
): string {
  const startMin = dayStartHour * 60;
  const endMin = dayEndHour * 60;
  // px → minutes from the start of the day grid.
  const rawMinutesFromStart = (offsetPx / slotHeightPx) * 30;
  // Snap to the slot grid (round to nearest snapMin).
  const snappedFromStart = Math.round(rawMinutesFromStart / snapMin) * snapMin;
  const absoluteMin = startMin + snappedFromStart;
  // Clamp so the whole block fits within the day window.
  const latestStart = Math.max(startMin, endMin - durationMin);
  const clamped = Math.max(startMin, Math.min(latestStart, absoluteMin));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Serializes a Date to a `YYYY-MM-DD` key from its LOCAL calendar parts — NEVER
 * `toISOString()`, which is UTC and rolls the day back across a positive UTC
 * offset (e.g. Europe/Madrid). Pairs with the `new Date(str + 'T00:00:00')` local
 * parsing used throughout so a date string round-trips to the SAME calendar day
 * in any timezone.
 */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's `YYYY-MM-DD` in the user's LOCAL timezone. */
export function getTodayKey(): string {
  return toLocalDateKey(new Date());
}

/**
 * Converts a "HH:MM" time string to a slot index and intra-slot fraction.
 *
 * - `slotIndex`     — 0-based slot index, clamped to [0, totalSlots - 1]
 * - `intraFraction` — 0.0..1.0 position within that slot (0 = :00, 0.5 = :15)
 *
 * Slots are 30-minute intervals starting at `startHour`.
 */
export function slotIndexFromTime(
  time: string,
  startHour: number,
  totalSlots: number,
): { slotIndex: number; intraFraction: number } {
  const safeInt = (s: string | undefined): number => {
    const n = parseInt(s ?? '0', 10);
    return isNaN(n) ? 0 : n;
  };
  const parts = time.split(':');
  const hour = safeInt(parts[0]);
  const min = safeInt(parts[1]);
  const minutesFromStart = (hour - startHour) * 60 + min;
  const rawSlot = minutesFromStart / 30;
  const slotIndex = Math.max(0, Math.min(Math.floor(rawSlot), totalSlots - 1));
  const intraFraction = rawSlot - Math.floor(rawSlot);
  return { slotIndex, intraFraction };
}

/**
 * Returns the number of 30-minute slots a given duration occupies.
 * Always at least 1, rounded up (ceil).
 */
export function slotSpanFromDuration(durationMin: number): number {
  return Math.max(1, Math.ceil(durationMin / 30));
}

/**
 * Returns the date string (YYYY-MM-DD) of the Monday of the week that contains
 * `dateStr`. Weeks start on Monday (ISO 8601). Serializes via LOCAL parts so the
 * Monday is correct in any timezone — UTC serialization previously returned the
 * preceding Sunday in positive-offset zones (the week-range off-by-one bug).
 */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toLocalDateKey(d);
}

/**
 * Advance `activeDate` by `delta` periods (+1 / -1) according to `dateMode`.
 * - day   → ±1 calendar day
 * - week  → ±7 days (always moves by full week from the current week-start)
 * - month → ±1 month (keeps day=1 to avoid 31→30 drift)
 * - list  → ±7 days (list view is week-scoped, same stepping as week)
 */
export function stepPeriod(
  activeDate: string,
  dateMode: 'day' | 'week' | 'month' | 'list',
  delta: -1 | 1,
): string {
  const d = new Date(activeDate + 'T00:00:00');
  if (dateMode === 'week' || dateMode === 'list') {
    d.setDate(d.getDate() + delta * 7);
  } else if (dateMode === 'month') {
    // Snap to day 1 BEFORE shifting the month: setMonth() on a 31st overflows into
    // the wrong month for short months (Jan 31 + 1 → Mar 3), and a later setDate(1)
    // would then land on Mar 1, silently skipping February.
    d.setDate(1);
    d.setMonth(d.getMonth() + delta);
  } else {
    d.setDate(d.getDate() + delta);
  }
  return toLocalDateKey(d);
}
