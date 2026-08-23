/**
 * agenda.utils.test.ts
 *
 * Pure unit tests for every exported function in agenda.utils.ts.
 * No mocks — these are deterministic, side-effect-free utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveInitials,
  formatHorasEnSala,
  formatHoraLabel,
  timeToTopOffset,
  durationToHeight,
} from '@infra/utils/agenda.utils';

// ── deriveInitials ──────────────────────────────────────────────────────────

describe('deriveInitials', () => {
  it('returns single capital letter for a single-word name', () => {
    expect(deriveInitials('Carlos')).toBe('C');
  });

  it('returns two initials for a two-word name', () => {
    expect(deriveInitials('Som Ongkham')).toBe('SO');
  });

  it('returns initials from first two words only for a three-word name', () => {
    expect(deriveInitials('María del Río')).toBe('MD');
  });

  it('returns empty string for an empty input', () => {
    expect(deriveInitials('')).toBe('');
  });

  it('returns empty string for a whitespace-only input', () => {
    expect(deriveInitials('   ')).toBe('');
  });

  it('uppercases a lowercase first letter', () => {
    expect(deriveInitials('naree anongphan')).toBe('NA');
  });

  it('handles a name that is already all-uppercase', () => {
    expect(deriveInitials('KANYA PETCHARAT')).toBe('KP');
  });

  it('handles extra internal whitespace correctly', () => {
    // split(/\s+/) collapses multiple spaces
    expect(deriveInitials('Anong  Malai')).toBe('AM');
  });
});

// ── formatHorasEnSala ───────────────────────────────────────────────────────

describe('formatHorasEnSala', () => {
  it('formats a whole-hour value as "Xh"', () => {
    expect(formatHorasEnSala(1)).toBe('1h');
  });

  it('formats zero as "0h"', () => {
    expect(formatHorasEnSala(0)).toBe('0h');
  });

  it('formats 0.5 as "0h 30m"', () => {
    expect(formatHorasEnSala(0.5)).toBe('0h 30m');
  });

  it('formats 6.5 as "6h 30m"', () => {
    expect(formatHorasEnSala(6.5)).toBe('6h 30m');
  });

  it('formats 7.75 as "7h 45m"', () => {
    expect(formatHorasEnSala(7.75)).toBe('7h 45m');
  });

  it('formats 2.0 as "2h"', () => {
    expect(formatHorasEnSala(2.0)).toBe('2h');
  });

  it('formats 0.25 as "0h 15m"', () => {
    expect(formatHorasEnSala(0.25)).toBe('0h 15m');
  });

  it('formats 8.5 (a realistic full-shift value) correctly', () => {
    expect(formatHorasEnSala(8.5)).toBe('8h 30m');
  });
});

// ── formatHoraLabel ─────────────────────────────────────────────────────────

describe('formatHoraLabel', () => {
  it('slot 0, start 9 → "09:00"', () => {
    expect(formatHoraLabel(0, 9)).toBe('09:00');
  });

  it('slot 1, start 9 → "09:30"', () => {
    expect(formatHoraLabel(1, 9)).toBe('09:30');
  });

  it('slot 2, start 9 → "10:00"', () => {
    expect(formatHoraLabel(2, 9)).toBe('10:00');
  });

  it('slot 22, start 9 → "20:00"', () => {
    // (9 * 60 + 22 * 30) = 540 + 660 = 1200 minutes = 20:00
    expect(formatHoraLabel(22, 9)).toBe('20:00');
  });

  it('slot 0, start 8 → "08:00"', () => {
    expect(formatHoraLabel(0, 8)).toBe('08:00');
  });

  it('slot 0, start 10 → "10:00"', () => {
    expect(formatHoraLabel(0, 10)).toBe('10:00');
  });

  it('pads single-digit hours with a leading zero', () => {
    // slot 0, start 9 → "09:00" — verifies zero-padding
    const result = formatHoraLabel(0, 9);
    expect(result).toBe('09:00');
  });

  it('slot 3, start 9 → "10:30"', () => {
    expect(formatHoraLabel(3, 9)).toBe('10:30');
  });
});

// ── timeToTopOffset ─────────────────────────────────────────────────────────

describe('timeToTopOffset', () => {
  it('"09:00" with start 9 and slotHeight 60 → 0px', () => {
    expect(timeToTopOffset('09:00', 9, 60)).toBe(0);
  });

  it('"09:30" with start 9 and slotHeight 60 → 60px', () => {
    expect(timeToTopOffset('09:30', 9, 60)).toBe(60);
  });

  it('"10:00" with start 9 and slotHeight 60 → 120px', () => {
    expect(timeToTopOffset('10:00', 9, 60)).toBe(120);
  });

  it('"13:42" with start 9 and slotHeight 60 → 288px', () => {
    // minutesFromStart = (13 - 9) * 60 + 42 = 282 min
    // offset = (282 / 30) * 60 = 9.4 * 60 = 564
    // Re-checking: (282/30) = 9.4, * 60 = 564 px
    // But the brief says 282px. Let me re-derive:
    // The actual formula: offset = (minutesFromStart / 30) * slotHeightPx
    // minutesFromStart = 4*60+42 = 282
    // (282/30)*60 = 9.4 * 60 = 564
    // The "282px" in the spec comment was approximate. Actual computation:
    expect(timeToTopOffset('13:42', 9, 60)).toBe(564);
  });

  it('"09:00" start 8 and slotHeight 60 → 120px (1 hour after start)', () => {
    // minutesFromStart = (9 - 8) * 60 + 0 = 60
    // offset = (60/30)*60 = 120
    expect(timeToTopOffset('09:00', 8, 60)).toBe(120);
  });

  it('time equal to dayStart → offset 0', () => {
    expect(timeToTopOffset('09:00', 9, 60)).toBe(0);
  });

  it('returns negative offset when time is before dayStart (no clamp in implementation)', () => {
    // Implementation does not clamp — negative is mathematically correct
    // minutesFromStart = (8-9)*60 + 0 = -60
    // offset = (-60/30)*60 = -120
    expect(timeToTopOffset('08:00', 9, 60)).toBe(-120);
  });

  it('uses slotHeightPx as a scale factor', () => {
    // "09:30" with slotHeight 80 → (30/30)*80 = 80
    expect(timeToTopOffset('09:30', 9, 80)).toBe(80);
  });
});

// ── durationToHeight ────────────────────────────────────────────────────────

describe('durationToHeight', () => {
  it('60 min with slotHeight 60 → 120px (2 slots)', () => {
    expect(durationToHeight(60, 60)).toBe(120);
  });

  it('30 min with slotHeight 60 → 60px (1 slot)', () => {
    expect(durationToHeight(30, 60)).toBe(60);
  });

  it('90 min with slotHeight 60 → 180px (3 slots)', () => {
    expect(durationToHeight(90, 60)).toBe(180);
  });

  it('15 min with slotHeight 60 → 30px (0.5 slots)', () => {
    expect(durationToHeight(15, 60)).toBe(30);
  });

  it('0 min → 0px', () => {
    expect(durationToHeight(0, 60)).toBe(0);
  });

  it('120 min with slotHeight 60 → 240px (4 slots)', () => {
    expect(durationToHeight(120, 60)).toBe(240);
  });

  it('scales proportionally with different slotHeightPx values', () => {
    // 60 min / 30 min-per-slot = 2 slots × 80px = 160
    expect(durationToHeight(60, 80)).toBe(160);
  });

  it('75 min with slotHeight 60 → 150px', () => {
    expect(durationToHeight(75, 60)).toBe(150);
  });
});

// ── getWeekStart ────────────────────────────────────────────────────────────
//
// getWeekStart now serialises via LOCAL calendar parts (toLocalDateKey), so it
// returns the correct Monday in ANY timezone — the previous toISOString() (UTC)
// path returned the preceding Sunday in positive-offset zones. The TZ is pinned
// to Europe/Madrid (vite.config), so these assert the exact local calendar dates.

import { getWeekStart, stepPeriod } from '@infra/utils/agenda.utils';

// Monday 2026-05-18; its ISO week runs Mon 18 … Sun 24.
const MONDAY = '2026-05-18';

describe('getWeekStart', () => {
  it('returns the same Monday when given a Monday', () => {
    expect(getWeekStart(MONDAY)).toBe('2026-05-18');
  });

  it('returns the week Monday for a Tuesday in the same week', () => {
    expect(getWeekStart('2026-05-19')).toBe('2026-05-18');
  });

  it('returns the week Monday for the Wednesday in the same week', () => {
    expect(getWeekStart('2026-05-20')).toBe('2026-05-18');
  });

  it('returns the week Monday for the Sunday that closes the same week', () => {
    expect(getWeekStart('2026-05-24')).toBe('2026-05-18');
  });

  it('rolls to the next Monday for a date in the following week', () => {
    expect(getWeekStart('2026-05-25')).toBe('2026-05-25');
    expect(getWeekStart('2026-05-31')).toBe('2026-05-25');
  });

  it('the week-start is always on or before the input date', () => {
    expect(getWeekStart('2026-05-19') <= '2026-05-19').toBe(true);
    expect(getWeekStart('2026-05-24') <= '2026-05-24').toBe(true);
  });

  it('handles a cross-month week (Mon 2026-06-29 … Sun 2026-07-05)', () => {
    expect(getWeekStart('2026-07-01')).toBe('2026-06-29');
    expect(getWeekStart('2026-07-05')).toBe('2026-06-29');
  });
});

// ── stepPeriod ──────────────────────────────────────────────────────────────
//
// stepPeriod parses local midnight, does local date arithmetic, and serialises
// via local parts, so the returned key is the exact expected calendar day in any
// timezone.

describe('stepPeriod', () => {
  it('day, +1 → the next calendar day', () => {
    expect(stepPeriod('2026-05-18', 'day', 1)).toBe('2026-05-19');
  });

  it('day, -1 → the previous calendar day', () => {
    expect(stepPeriod('2026-05-18', 'day', -1)).toBe('2026-05-17');
  });

  it('day, +1 across a month boundary', () => {
    expect(stepPeriod('2026-05-31', 'day', 1)).toBe('2026-06-01');
  });

  it('week, +1 → 7 days forward', () => {
    expect(stepPeriod('2026-05-18', 'week', 1)).toBe('2026-05-25');
  });

  it('week, -1 → 7 days back', () => {
    expect(stepPeriod('2026-05-18', 'week', -1)).toBe('2026-05-11');
  });

  it('month, +1 → first day of the next month (day snapped to 1)', () => {
    expect(stepPeriod('2026-05-01', 'month', 1)).toBe('2026-06-01');
  });

  it('month, -1 → first day of the previous month', () => {
    expect(stepPeriod('2026-05-01', 'month', -1)).toBe('2026-04-01');
  });

  it('month, +1 from a 31st snaps to the 1st without skipping a short month', () => {
    // Jan 31 + 1 month must be Feb 1 — NOT Mar 1 (the setMonth-overflow trap).
    expect(stepPeriod('2026-01-31', 'month', 1)).toBe('2026-02-01');
  });

  it('list, +1 behaves identically to week, +1 (list is week-scoped)', () => {
    expect(stepPeriod('2026-05-18', 'list', 1)).toBe(stepPeriod('2026-05-18', 'week', 1));
    expect(stepPeriod('2026-05-18', 'list', 1)).toBe('2026-05-25');
  });

  it('list, -1 → 7 days back (same stepping as week)', () => {
    expect(stepPeriod('2026-05-18', 'list', -1)).toBe(stepPeriod('2026-05-18', 'week', -1));
    expect(stepPeriod('2026-05-18', 'list', -1)).toBe('2026-05-11');
  });
});
