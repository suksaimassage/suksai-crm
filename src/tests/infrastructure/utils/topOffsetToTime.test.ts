/**
 * topOffsetToTime.test.ts
 *
 * Exhaustive pure-unit coverage for `topOffsetToTime` — the inverse of
 * `timeToTopOffset` used by the admin week-grid drag & drop (Surface A) to
 * translate a vertical pixel offset back into a snapped "HH:MM" start time.
 *
 * No mocks, no DOM — a deterministic, side-effect-free helper. Target: 100% of
 * statements/branches (snap rounding, the [dayStart, dayEnd − duration] clamp,
 * and the round-trip with the forward helper).
 *
 * Geometry under test mirrors the agenda constants: slotHeightPx = 60 (a 30-min
 * slot), dayStartHour = 8, dayEndHour = 22, snapMin = 30.
 */

import { describe, it, expect } from 'vitest';
import { topOffsetToTime, timeToTopOffset } from '@infra/utils/agenda.utils';

// Agenda geometry (agenda.constants.ts) — the real call-site values.
const SLOT = 60; // AGENDA_SLOT_HEIGHT_PX
const START = 8; // AGENDA_DAY_START_HOUR
const END = 22; // AGENDA_DAY_END_HOUR
const SNAP = 30; // 30-min snap (Analyst OQ-A4)

// ── Identity / basic conversion ─────────────────────────────────────────────

describe('topOffsetToTime — basic conversion', () => {
  it('offset 0 maps to the day start hour', () => {
    expect(topOffsetToTime(0, START, SLOT, SNAP, END, 60)).toBe('08:00');
  });

  it('one slot height (60px) maps to start + 30 min', () => {
    expect(topOffsetToTime(60, START, SLOT, SNAP, END, 60)).toBe('08:30');
  });

  it('two slot heights (120px) maps to start + 60 min', () => {
    expect(topOffsetToTime(120, START, SLOT, SNAP, END, 60)).toBe('09:00');
  });

  it('a deep offset maps to the matching afternoon slot', () => {
    // 720px = 12 slots = 360 min after 08:00 → 14:00.
    expect(topOffsetToTime(720, START, SLOT, SNAP, END, 60)).toBe('14:00');
  });

  it('zero-padding: a single-digit hour is padded to two digits', () => {
    // 60px → 08:30 already covers the hour pad; assert minutes pad too at :00.
    expect(topOffsetToTime(120, START, SLOT, SNAP, END, 60)).toBe('09:00');
  });
});

// ── 30-minute snapping ──────────────────────────────────────────────────────

describe('topOffsetToTime — snaps to 30-minute grid', () => {
  it('snaps a sub-slot offset DOWN to the nearer slot (37.5 min → 30)', () => {
    // 75px → (75/60)*30 = 37.5 min → round(37.5/30)*30 = round(1.25)*30 = 30.
    expect(topOffsetToTime(75, START, SLOT, SNAP, END, 60)).toBe('08:30');
  });

  it('snaps the half-slot midpoint UP (45 min → 60, round-half-up)', () => {
    // 90px → 45 min → round(45/30)*30 = round(1.5)*30 = 2*30 = 60.
    expect(topOffsetToTime(90, START, SLOT, SNAP, END, 60)).toBe('09:00');
  });

  it('snaps a just-below-midpoint offset down (44 min → 30)', () => {
    // 88px → (88/60)*30 = 44 min → round(44/30)=round(1.466)=1 → 30.
    expect(topOffsetToTime(88, START, SLOT, SNAP, END, 60)).toBe('08:30');
  });

  it('snaps a just-above-midpoint offset up (46 min → 60)', () => {
    // 92px → (92/60)*30 = 46 min → round(46/30)=round(1.533)=2 → 60.
    expect(topOffsetToTime(92, START, SLOT, SNAP, END, 60)).toBe('09:00');
  });

  it('an offset already on a slot boundary is unchanged by snapping', () => {
    // 180px = exactly 90 min → 09:30, no rounding drift.
    expect(topOffsetToTime(180, START, SLOT, SNAP, END, 60)).toBe('09:30');
  });

  it('respects a custom snap granularity (15-min snap)', () => {
    // 75px → 37.5 min → round(37.5/15)*15 = round(2.5)*15 = 3*15 = 45 → 08:45.
    expect(topOffsetToTime(75, START, SLOT, 15, END, 60)).toBe('08:45');
  });
});

// ── Lower clamp: never before the day start ─────────────────────────────────

describe('topOffsetToTime — clamps at the day start (lower bound)', () => {
  it('a negative offset clamps to the day start', () => {
    expect(topOffsetToTime(-100, START, SLOT, SNAP, END, 60)).toBe('08:00');
  });

  it('a large negative offset still clamps to the day start', () => {
    expect(topOffsetToTime(-99999, START, SLOT, SNAP, END, 60)).toBe('08:00');
  });

  it('a tiny positive offset that snaps to 0 stays at the day start', () => {
    // 10px → (10/60)*30 = 5 min → round(5/30)=0 → 08:00.
    expect(topOffsetToTime(10, START, SLOT, SNAP, END, 60)).toBe('08:00');
  });
});

// ── Upper clamp: the whole block must fit before the day end ─────────────────

describe('topOffsetToTime — clamps at dayEnd − durationMin (upper bound)', () => {
  it('an offset past the day end clamps to the latest start that fits a 60-min block', () => {
    // latestStart = max(480, 22*60 − 60) = 1320 − 60 = 1260 min → 21:00.
    expect(topOffsetToTime(100000, START, SLOT, SNAP, END, 60)).toBe('21:00');
  });

  it('a longer (90-min) block clamps to an earlier latest start', () => {
    // latestStart = 1320 − 90 = 1230 min → 20:30.
    expect(topOffsetToTime(100000, START, SLOT, SNAP, END, 90)).toBe('20:30');
  });

  it('a zero-duration block clamps right up to the day end', () => {
    // latestStart = max(480, 1320 − 0) = 1320 min → 22:00.
    expect(topOffsetToTime(100000, START, SLOT, SNAP, END, 0)).toBe('22:00');
  });

  it('a block exactly filling the day clamps to the day start', () => {
    // duration = full window (14h = 840 min). latestStart = max(480, 1320 − 840)
    // = max(480, 480) = 480 → 08:00 — the only start that fits.
    expect(topOffsetToTime(100000, START, SLOT, SNAP, END, 840)).toBe('08:00');
  });

  it('a duration LONGER than the day still clamps to the day start (latestStart floors at start)', () => {
    // 1320 − 900 = 420 < 480 → Math.max(480, 420) = 480 → 08:00.
    expect(topOffsetToTime(100000, START, SLOT, SNAP, END, 900)).toBe('08:00');
  });

  it('a mid-grid offset that still fits is NOT clamped', () => {
    // 1200px = 20 slots = 600 min after 08:00 → 18:00, a 60-min block fits.
    expect(topOffsetToTime(1200, START, SLOT, SNAP, END, 60)).toBe('18:00');
  });
});

// ── Different geometry (slotHeight / dayStart) ──────────────────────────────

describe('topOffsetToTime — alternate slot heights and day starts', () => {
  it('scales with a larger slotHeightPx (80px per slot)', () => {
    // 80px → (80/80)*30 = 30 min → 08:30.
    expect(topOffsetToTime(80, START, 80, SNAP, END, 60)).toBe('08:30');
  });

  it('scales with a smaller slotHeightPx (40px per slot)', () => {
    // 80px → (80/40)*30 = 60 min → 09:00.
    expect(topOffsetToTime(80, START, 40, SNAP, END, 60)).toBe('09:00');
  });

  it('honours a 9:00 day start (therapist-grid geometry)', () => {
    // dayStart 9, 60px → +30 min → 09:30.
    expect(topOffsetToTime(60, 9, SLOT, SNAP, 21, 60)).toBe('09:30');
  });

  it('upper clamp follows the alternate dayEnd (21:00 grid, 60-min block)', () => {
    // dayEnd 21 → latestStart = 21*60 − 60 = 1200 min → 20:00.
    expect(topOffsetToTime(100000, 9, SLOT, SNAP, 21, 60)).toBe('20:00');
  });
});

// ── Round-trip with the forward helper (the two are inverses) ───────────────

describe('topOffsetToTime — round-trips with timeToTopOffset', () => {
  // Every value here is already on a 30-min boundary, so snapping is a no-op and
  // the inverse is exact: topOffsetToTime(timeToTopOffset(t)) === t.
  it.each(['08:00', '08:30', '09:00', '10:30', '12:00', '15:30', '18:00', '21:00', '21:30'])(
    'start %s survives a forward→inverse round-trip',
    (time) => {
      const offset = timeToTopOffset(time, START, SLOT);
      expect(topOffsetToTime(offset, START, SLOT, SNAP, END, 0)).toBe(time);
    },
  );

  it('round-trips with a non-zero duration when the start still fits', () => {
    // 13:00 with a 60-min block fits (ends 14:00 < 22:00) → exact inverse.
    const offset = timeToTopOffset('13:00', START, SLOT);
    expect(topOffsetToTime(offset, START, SLOT, SNAP, END, 60)).toBe('13:00');
  });

  it('round-trips at the latest-fitting start for a 60-min block (21:00)', () => {
    const offset = timeToTopOffset('21:00', START, SLOT);
    expect(topOffsetToTime(offset, START, SLOT, SNAP, END, 60)).toBe('21:00');
  });
});
