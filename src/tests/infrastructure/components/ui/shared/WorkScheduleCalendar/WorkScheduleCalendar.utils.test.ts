/**
 * WorkScheduleCalendar.utils.test.ts
 *
 * Unit tests for the PURE getVisibleDateRange helper added for the state-loss bug
 * fix (#2 — read window follows the calendar's shown period instead of being
 * pinned to the current month). Zero React, zero side-effects — just call & assert.
 *
 * The range is INCLUSIVE local-midnight day bounds; for month view it must mirror
 * buildMonthGrid's cell span (leading/trailing adjacent-month days included) so a
 * shift rendered in a trailing cell is inside the range and never disappears.
 *
 * Local-time fixtures: all assertions read getFullYear/getMonth/getDate to stay
 * timezone-independent.
 */

import { describe, it, expect } from 'vitest';
import { getVisibleDateRange } from '@infra/components/ui/shared/WorkScheduleCalendar/WorkScheduleCalendar.utils';

/** "YYYY-MM-DD" local key for terse assertions. */
function key(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 2026-05-18 is a Monday. May 2026: 1st = Friday, 31st = Sunday.
const MONDAY_2026_05_18 = new Date(2026, 4, 18);

describe('getVisibleDateRange — day view', () => {
  it('returns the selected day as both start and end', () => {
    const { start, end } = getVisibleDateRange('day', MONDAY_2026_05_18);
    expect(key(start)).toBe('2026-05-18');
    expect(key(end)).toBe('2026-05-18');
  });

  it('normalises to local midnight (no time component leaks in)', () => {
    const withTime = new Date(2026, 4, 18, 15, 42, 30, 500);
    const { start, end } = getVisibleDateRange('day', withTime);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(0);
  });
});

describe('getVisibleDateRange — week view', () => {
  it('covers Sun–Sat of the selected week (matches getWeekDays)', () => {
    // Week containing Monday 2026-05-18 → Sun 2026-05-17 .. Sat 2026-05-23.
    const { start, end } = getVisibleDateRange('week', MONDAY_2026_05_18);
    expect(key(start)).toBe('2026-05-17'); // Sunday
    expect(key(end)).toBe('2026-05-23'); // Saturday
  });

  it('is stable for any day within the same week (Sunday anchor)', () => {
    const fromSunday = getVisibleDateRange('week', new Date(2026, 4, 17));
    const fromSaturday = getVisibleDateRange('week', new Date(2026, 4, 23));
    expect(key(fromSunday.start)).toBe(key(fromSaturday.start));
    expect(key(fromSunday.end)).toBe(key(fromSaturday.end));
  });
});

describe('getVisibleDateRange — month view (grid span incl. adjacent-month days)', () => {
  it('starts on the Sunday on/before the 1st and ends on the Saturday completing the last week', () => {
    // May 2026: 1st is Friday → grid starts Sun 2026-04-26.
    // 31st is Sunday → that Sunday begins a new grid row, so the grid runs through
    // Sat 2026-06-06 (the month grid is whole weeks of 7).
    const { start, end } = getVisibleDateRange('month', new Date(2026, 4, 15));
    expect(key(start)).toBe('2026-04-26'); // leading days from April
    expect(key(end)).toBe('2026-06-06'); // trailing days into June
    // The range is wide enough to include an especifico shift shown in a trailing
    // cell of the previous/next month (the disappearing-shift bug fix).
    expect(start.getMonth()).toBe(3); // April
    expect(end.getMonth()).toBe(5); // June
  });

  it('includes the whole target month between the grid bounds', () => {
    const { start, end } = getVisibleDateRange('month', new Date(2026, 4, 1));
    const may1 = new Date(2026, 4, 1).getTime();
    const may31 = new Date(2026, 4, 31).getTime();
    expect(start.getTime()).toBeLessThanOrEqual(may1);
    expect(end.getTime()).toBeGreaterThanOrEqual(may31);
  });

  it('handles a month whose 1st is a Sunday (no leading days)', () => {
    // 2026-03-01 is a Sunday → the grid starts exactly on the 1st.
    const { start } = getVisibleDateRange('month', new Date(2026, 2, 10));
    expect(key(start)).toBe('2026-03-01');
  });
});
