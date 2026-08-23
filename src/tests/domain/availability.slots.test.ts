/**
 * availability.slots.test.ts
 *
 * Unit tests for the PURE availability computation `computeAvailableStartTimes`.
 * This module has zero I/O, no repositories and no `Date.now()` — it is the
 * deterministic heart of the HYBRID + multi-window slot semantics, so it is
 * driven entirely by plain inputs with NO mocks (per .claude/rules/testing.md
 * domain philosophy).
 *
 * Coverage target: 100% (statements/branches/functions/lines).
 *
 * ── API NOTE (migrated from the single-window shape) ───────────────────────────
 * The slot engine moved from `horario: IWorkingWindow | null` to a multi-window
 * `windows: readonly IWorkingWindow[]` parameter (override model — the SERVICE
 * resolves which windows apply and passes them in; split shifts = >1 window).
 *   - `[]`        ≡ the old `null` → no active schedule → full open–close fallback.
 *   - `[w]`       ≡ the old single window → narrowed to that window.
 *   - `[w1, w2]`  → the UNION of both windows; a candidate is valid if it fits
 *     ENTIRELY within AT LEAST ONE window. The gap between two split-shift
 *     windows yields no slots (no single window contains it).
 *
 * Studio grid (defaults, from the exported constants):
 *   AGENDA_OPEN_MIN  = 540  → 09:00
 *   AGENDA_CLOSE_MIN = 1260 → 21:00
 *   SLOT_STEP_MIN    = 30
 * A start is valid only if `start + duración <= close` AND it fits ≥1 window.
 *
 * ── Overlap convention (load-bearing) ──────────────────────────────────────────
 * The function reuses `DateRange.overlaps`, whose boundaries are INCLUSIVE
 * (`thisStart <= otherEnd && thisEnd >= otherStart`). Consequently a candidate
 * whose interval merely *touches* a booking at an endpoint counts as overlapping
 * (back-to-back is treated as a clash). This intentionally mirrors
 * `CitaService.#validateScheduleRules` (which also uses DateRange.overlaps), so
 * the offered grid and the authoritative submit-time re-validation agree. Every
 * "boundary" test below asserts this inclusive behaviour deliberately.
 *
 * NOTE on window endpoints vs booking endpoints: the WINDOW-fit test is
 * half-open-ish in that a slot whose end == windowEnd is VALID (it fits), whereas
 * a slot that merely touches a BOOKING endpoint is INVALID (DateRange.overlaps is
 * inclusive). The two rules are independent and both are asserted below.
 *
 * Time handling: candidate Dates are built via wall-clock `setHours`, so all
 * fixtures use the local-time Date constructor (`new Date(y, m, d, h, min)`) and
 * assertions read `.getHours()/.getMinutes()` — timezone-independent (DST-safe).
 */

import { describe, it, expect } from 'vitest';
import {
  computeAvailableStartTimes,
  AGENDA_OPEN_MIN,
  AGENDA_CLOSE_MIN,
  SLOT_STEP_MIN,
} from '@domain/services/availability.slots';
import type {
  IBookedRange,
  IAbsenceRange,
  IWorkingWindow,
} from '@domain/services/availability.slots';

// 2026-05-18 is a Monday. Time component is ignored by the function (it uses the
// date part + minute offset), but we pin everything to local time for clarity.
const Y = 2026;
const MO = 4; // May (0-indexed)
const D = 18;

/** Local Date on the fixture day at HH:MM. */
function at(h: number, m = 0): Date {
  return new Date(Y, MO, D, h, m, 0, 0);
}

/** Convenience: a booked range from two HH:MM pairs on the fixture day. */
function booking(startH: number, startM: number, endH: number, endM: number): IBookedRange {
  return { start: at(startH, startM), end: at(endH, endM) };
}

/** A working window (HH:MM wall-clock). */
function win(horaInicio: string, horaFin: string): IWorkingWindow {
  return { horaInicio, horaFin };
}

/** All produced starts as "HH:MM" strings (wall-clock). */
function asHHMM(dates: Date[]): string[] {
  return dates.map(
    (d) =>
      `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
  );
}

const FECHA = at(0, 0);

interface IBaseOverrides {
  readonly duracionMinutos?: number;
  readonly windows?: readonly IWorkingWindow[];
  readonly ausencias?: readonly IAbsenceRange[];
  readonly salaBookedRanges?: readonly IBookedRange[];
  readonly therapistBookedRanges?: readonly IBookedRange[];
  readonly openMin?: number;
  readonly closeMin?: number;
  readonly stepMin?: number;
}

/** Builds params with sensible "wide open, no conflicts" defaults (no schedule). */
function run(overrides: IBaseOverrides = {}): Date[] {
  return computeAvailableStartTimes({
    fecha: FECHA,
    duracionMinutos: overrides.duracionMinutos ?? 60,
    windows: overrides.windows ?? [],
    ausencias: overrides.ausencias ?? [],
    salaBookedRanges: overrides.salaBookedRanges ?? [],
    therapistBookedRanges: overrides.therapistBookedRanges ?? [],
    openMin: overrides.openMin,
    closeMin: overrides.closeMin,
    stepMin: overrides.stepMin,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Exported constants
// ════════════════════════════════════════════════════════════════════════════

describe('availability constants', () => {
  it('expose the studio grid as minutes-from-midnight', () => {
    expect(AGENDA_OPEN_MIN).toBe(540); // 09:00
    expect(AGENDA_CLOSE_MIN).toBe(1260); // 21:00
    expect(SLOT_STEP_MIN).toBe(30);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// full-window fallback (no windows)  — Functional Goal #8, Edge "empty → fallback"
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — full-window fallback (windows = [])', () => {
  it('produces the full 09:00–20:00 grid (23 starts) for a 60-min service when no window applies', () => {
    const starts = run({ windows: [], duracionMinutos: 60 });
    // 540,570,…,1200 inclusive → 23 candidates; last start finishes exactly at close.
    expect(starts).toHaveLength(23);
    expect(asHHMM(starts)[0]).toBe('09:00');
    expect(asHHMM(starts).at(-1)).toBe('20:00');
  });

  it('builds wall-clock Dates on the supplied fecha (date part preserved, DST-safe)', () => {
    const [first] = run({ windows: [], duracionMinutos: 60 });
    expect(first.getFullYear()).toBe(Y);
    expect(first.getMonth()).toBe(MO);
    expect(first.getDate()).toBe(D);
    expect(first.getHours()).toBe(9);
    expect(first.getMinutes()).toBe(0);
    expect(first.getSeconds()).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// narrowed single window  — Functional Goal #6, narrowed-window state
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — single narrowed window', () => {
  it('intersects the grid with the working window', () => {
    // Window 10:00–13:00, 60-min service → starts 10:00,10:30,11:00,11:30,12:00.
    // 12:30 invalid (12:30+60=13:30 > 13:00 windowEnd).
    const starts = run({ windows: [win('10:00', '13:00')], duracionMinutos: 60 });
    expect(asHHMM(starts)).toEqual(['10:00', '10:30', '11:00', '11:30', '12:00']);
  });

  it('clamps a window wider than the studio hours back to [open, close]', () => {
    // Window 06:00–23:00 is wider than 09:00–21:00 → behaves like the full window.
    const wide = run({ windows: [win('06:00', '23:00')], duracionMinutos: 60 });
    const full = run({ windows: [], duracionMinutos: 60 });
    expect(asHHMM(wide)).toEqual(asHHMM(full));
  });

  it('respects the window end as the upper bound — last slot finishes exactly at horaFin', () => {
    // Window 09:00–10:00, 60-min service → exactly one start at 09:00 (ends 10:00 = windowEnd).
    const starts = run({ windows: [win('09:00', '10:00')], duracionMinutos: 60 });
    expect(asHHMM(starts)).toEqual(['09:00']);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// MULTI-WINDOW UNION + split shifts  — Functional Goal #6, Edge "split shifts"
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — multi-window union (split shifts)', () => {
  it('offers the UNION of two split-shift windows and EXCLUDES the midday gap', () => {
    // 09:00–13:00 and 16:00–20:00, 60-min service.
    // Morning starts: 09:00,09:30,…,12:00 (12:00+60=13:00 = windowEnd ✓; 12:30 ✗).
    // Gap 13:00–16:00: 12:30..15:00 starts cannot fit either window → excluded.
    // Evening starts: 16:00,16:30,…,19:00 (19:00+60=20:00 = windowEnd ✓; 19:30 ✗).
    const hhmm = asHHMM(
      run({ windows: [win('09:00', '13:00'), win('16:00', '20:00')], duracionMinutos: 60 }),
    );
    expect(hhmm).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
      '19:00',
    ]);
    // Explicit gap assertions (the 13:00–16:00 hole yields no slots).
    for (const blocked of ['12:30', '13:00', '13:30', '14:00', '15:00', '15:30']) {
      expect(hhmm).not.toContain(blocked);
    }
  });

  it('window order does not matter — the union is the same when windows are reversed', () => {
    const forward = asHHMM(
      run({ windows: [win('09:00', '11:00'), win('15:00', '17:00')], duracionMinutos: 60 }),
    );
    const reversed = asHHMM(
      run({ windows: [win('15:00', '17:00'), win('09:00', '11:00')], duracionMinutos: 60 }),
    );
    expect(forward).toEqual(reversed);
  });

  it('a candidate must fit ENTIRELY within ONE window — it may not straddle two adjacent windows', () => {
    // Two touching windows 09:00–11:00 and 11:00–13:00 with a 60-min service.
    // 10:30 would end 11:30 — that straddles the 11:00 seam, fitting NEITHER window
    // entirely → excluded. 10:00 (→11:00, fits first) and 11:00 (→12:00, fits
    // second) are valid. This proves union-fit is per-window, not merged.
    const hhmm = asHHMM(
      run({ windows: [win('09:00', '11:00'), win('11:00', '13:00')], duracionMinutos: 60 }),
    );
    expect(hhmm).toContain('10:00');
    expect(hhmm).toContain('11:00');
    expect(hhmm).not.toContain('10:30'); // straddles the seam → fits neither window
  });

  it('overlapping windows behave as their union (no double-counting of starts)', () => {
    // 09:00–12:00 and 11:00–14:00 overlap. The union is effectively 09:00–14:00.
    // A 60-min service → 09:00,09:30,…,13:00 with NO duplicate entries.
    const hhmm = asHHMM(
      run({ windows: [win('09:00', '12:00'), win('11:00', '14:00')], duracionMinutos: 60 }),
    );
    expect(hhmm).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
    ]);
    // No duplicates around the overlap seam.
    expect(hhmm.filter((t) => t === '11:00')).toHaveLength(1);
  });

  it('drops only the malformed window in a split-shift pair, keeping the valid one', () => {
    // First window inverted (TimeRange.create throws → skipped); second is valid.
    // Result = slots of the valid 16:00–18:00 window ONLY (not a full-grid fallback).
    const hhmm = asHHMM(
      run({ windows: [win('18:00', '09:00'), win('16:00', '18:00')], duracionMinutos: 60 }),
    );
    expect(hhmm).toEqual(['16:00', '16:30', '17:00']);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// empty-by-window  — full-block fit, window shorter than duration
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — window shorter than duration / out of grid', () => {
  it('returns [] when the only working window is shorter than the service duration', () => {
    // Window 09:00–09:20 (20 min) with a 60-min service → no start fits.
    const starts = run({ windows: [win('09:00', '09:20')], duracionMinutos: 60 });
    expect(starts).toEqual([]);
  });

  it('returns [] when the intersection of grid and window is empty (window entirely after close)', () => {
    // Window 22:00–23:00 is entirely past close (21:00) → windowStart >= windowEnd → [].
    const starts = run({ windows: [win('22:00', '23:00')], duracionMinutos: 60 });
    expect(starts).toEqual([]);
  });

  it('returns [] when the window sits entirely before open', () => {
    // Window 06:00–08:00 is entirely before open (09:00) → intersection empty → [].
    const starts = run({ windows: [win('06:00', '08:00')], duracionMinutos: 60 });
    expect(starts).toEqual([]);
  });

  it('returns [] when EVERY window in a split pair is too short for the duration', () => {
    // 09:00–09:20 and 12:00–12:20 — both shorter than a 60-min service.
    const starts = run({
      windows: [win('09:00', '09:20'), win('12:00', '12:20')],
      duracionMinutos: 60,
    });
    expect(starts).toEqual([]);
  });

  it('still offers the longer window when one of two split windows is too short', () => {
    // 09:00–09:20 (too short) + 16:00–18:00 (fits 60-min) → only the evening slots.
    const hhmm = asHHMM(
      run({ windows: [win('09:00', '09:20'), win('16:00', '18:00')], duracionMinutos: 60 }),
    );
    expect(hhmm).toEqual(['16:00', '16:30', '17:00']);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// closing boundary  — the inclusive `start + dur <= close` rule
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — closing boundary', () => {
  it('offers 20:00 but NOT 20:30 for a 60-min service (start + dur <= close, inclusive)', () => {
    const hhmm = asHHMM(run({ windows: [], duracionMinutos: 60 }));
    expect(hhmm).toContain('20:00'); // 20:00 + 60 = 21:00 == close → valid
    expect(hhmm).not.toContain('20:30'); // 20:30 + 60 = 21:30 > close → invalid
  });

  it('a 90-min service ends its grid at 19:30 (last start that finishes by 21:00)', () => {
    const hhmm = asHHMM(run({ windows: [], duracionMinutos: 90 }));
    expect(hhmm.at(-1)).toBe('19:30'); // 19:30 + 90 = 21:00 == close
    expect(hhmm).not.toContain('20:00'); // 20:00 + 90 = 21:30 > close
  });
});

// ════════════════════════════════════════════════════════════════════════════
// approved absences  — Functional Goal (absence minus), whole-day & partial
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — absences', () => {
  it('whole-day approved absence removes every candidate → [] (even with a window)', () => {
    const wholeDay: IAbsenceRange = { start: at(0, 0), end: at(23, 59) };
    expect(run({ windows: [], ausencias: [wholeDay] })).toEqual([]);
  });

  it('partial-day absence removes only the candidates whose interval overlaps it', () => {
    // Absence 12:00–14:00. With inclusive overlap, a 60-min slot is dropped when
    // it touches that range: starts 11:00 (11:00–12:00 touches 12:00) through
    // 14:00 (14:00–15:00 touches 14:00) are removed.
    const absence: IAbsenceRange = { start: at(12, 0), end: at(14, 0) };
    const hhmm = asHHMM(run({ windows: [], duracionMinutos: 60, ausencias: [absence] }));
    // Survivors before the gap:
    expect(hhmm).toContain('10:00');
    expect(hhmm).toContain('10:30');
    // Touching / inside the absence → removed:
    for (const blocked of ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00']) {
      expect(hhmm).not.toContain(blocked);
    }
    // Resumes cleanly after the absence:
    expect(hhmm).toContain('14:30'); // 14:30–15:30 no longer touches 14:00
  });

  it('handles multiple absence ranges independently', () => {
    const morning: IAbsenceRange = { start: at(9, 0), end: at(10, 0) };
    const evening: IAbsenceRange = { start: at(19, 0), end: at(21, 0) };
    const hhmm = asHHMM(run({ windows: [], duracionMinutos: 60, ausencias: [morning, evening] }));
    expect(hhmm).not.toContain('09:00');
    expect(hhmm).not.toContain('19:00');
    expect(hhmm).not.toContain('20:00');
    expect(hhmm).toContain('11:00'); // mid-day survives
  });

  it('drops slots in a split-shift window covered by an absence, keeping the other window', () => {
    // Windows 09:00–12:00 + 16:00–19:00; absence covers the whole morning window.
    // Morning slots all removed; evening slots survive.
    const absence: IAbsenceRange = { start: at(9, 0), end: at(12, 0) };
    const hhmm = asHHMM(
      run({
        windows: [win('09:00', '12:00'), win('16:00', '19:00')],
        duracionMinutos: 60,
        ausencias: [absence],
      }),
    );
    expect(hhmm).not.toContain('09:00');
    expect(hhmm).not.toContain('10:00');
    expect(hhmm).toContain('16:00');
    expect(hhmm).toContain('17:00');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// sala overlap  — sala booking minus
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — sala bookings', () => {
  it('removes candidates overlapping a sala booking', () => {
    // Sala busy 10:00–11:00. Inclusive overlap blocks 09:00 (ends 10:00, touch),
    // 09:30, 10:00, 10:30, and 11:00 (starts 11:00, touch).
    const hhmm = asHHMM(
      run({ windows: [], duracionMinutos: 60, salaBookedRanges: [booking(10, 0, 11, 0)] }),
    );
    for (const blocked of ['09:00', '09:30', '10:00', '10:30', '11:00']) {
      expect(hhmm).not.toContain(blocked);
    }
    expect(hhmm).toContain('11:30'); // first clean start after the booking
  });
});

// ════════════════════════════════════════════════════════════════════════════
// therapist overlap  — therapist booking minus
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — therapist bookings', () => {
  it('removes candidates overlapping a therapist booking (independent of sala)', () => {
    const hhmm = asHHMM(
      run({
        windows: [],
        duracionMinutos: 60,
        therapistBookedRanges: [booking(15, 0, 16, 0)],
      }),
    );
    expect(hhmm).not.toContain('15:00');
    expect(hhmm).not.toContain('15:30');
    expect(hhmm).not.toContain('16:00'); // 16:00 touches the booking end → removed (inclusive)
    expect(hhmm).toContain('16:30');
  });

  it('removes the union of sala AND therapist conflicts', () => {
    const hhmm = asHHMM(
      run({
        windows: [],
        duracionMinutos: 60,
        salaBookedRanges: [booking(10, 0, 11, 0)],
        therapistBookedRanges: [booking(17, 0, 18, 0)],
      }),
    );
    expect(hhmm).not.toContain('10:00'); // blocked by sala
    expect(hhmm).not.toContain('17:00'); // blocked by therapist
    expect(hhmm).toContain('13:00'); // free in both
  });
});

// ════════════════════════════════════════════════════════════════════════════
// empty-by-saturation  — window present but fully booked (≠ no-schedule)
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — saturation', () => {
  it('returns [] when one booking spans the entire working window', () => {
    // Window 09:00–11:00 and a booking that covers it → every start touches/overlaps.
    const starts = run({
      windows: [win('09:00', '11:00')],
      duracionMinutos: 60,
      salaBookedRanges: [booking(9, 0, 11, 0)],
    });
    expect(starts).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// malformed / inverted windows  — graceful skip (Edge "malformed row")
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — malformed windows', () => {
  it('returns [] when the SOLE window is inverted (horaFin before horaInicio)', () => {
    // Inverted window 18:00–09:00 → TimeRange.create throws → that window is
    // skipped. With NO other window, resolveWindowBoundsList yields an empty
    // bounds list → no slots. (This differs from the old single-window contract
    // which fell back to the full grid; with the array API a present-but-invalid
    // window is NOT the "no schedule" signal — an empty array is.)
    const inverted = run({ windows: [win('18:00', '09:00')] });
    expect(inverted).toEqual([]);
  });

  it('returns [] when the sole window has a non-HH:MM time string', () => {
    const malformed = run({ windows: [win('nonsense', '99:99')] });
    expect(malformed).toEqual([]);
  });

  it('an EMPTY windows array (not a malformed one) is the no-schedule full-grid fallback', () => {
    // Contrast with the cases above: [] means "no schedule" → full grid.
    const fallback = asHHMM(run({ windows: [] }));
    expect(fallback[0]).toBe('09:00');
    expect(fallback.at(-1)).toBe('20:00');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// duration guards & non-multiple durations
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — duration handling', () => {
  it('returns [] for a zero duration', () => {
    expect(run({ windows: [], duracionMinutos: 0 })).toEqual([]);
  });

  it('returns [] for a negative duration', () => {
    expect(run({ windows: [], duracionMinutos: -30 })).toEqual([]);
  });

  it('steps every 30 min even when duration is not a multiple of the step (45 min)', () => {
    const hhmm = asHHMM(run({ windows: [], duracionMinutos: 45 }));
    // Grid cadence is unchanged (every 30 min); only the closing-fit check uses 45.
    expect(hhmm.slice(0, 3)).toEqual(['09:00', '09:30', '10:00']);
    // Last start: 20:00+45=20:45 ≤ 21:00 ✓, 20:30+45=21:15 > 21:00 ✗ → last is 20:00.
    expect(hhmm.at(-1)).toBe('20:00');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// custom open/close/step overrides  — covers the default-parameter branches
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — custom grid bounds', () => {
  it('honours explicit openMin/closeMin/stepMin overrides', () => {
    // 10:00–12:00 (600–720), 60-min step, 60-min service → starts 10:00, 11:00.
    const hhmm = asHHMM(
      run({ windows: [], duracionMinutos: 60, openMin: 600, closeMin: 720, stepMin: 60 }),
    );
    expect(hhmm).toEqual(['10:00', '11:00']);
  });

  it('clamps each window to the custom [open, close] bounds, not the defaults', () => {
    // Custom grid 10:00–18:00; a 09:00–20:00 window is clamped to 10:00–18:00.
    const hhmm = asHHMM(
      run({
        windows: [win('09:00', '20:00')],
        duracionMinutos: 60,
        openMin: 600, // 10:00
        closeMin: 1080, // 18:00
        stepMin: 60,
      }),
    );
    expect(hhmm[0]).toBe('10:00');
    expect(hhmm.at(-1)).toBe('17:00'); // 17:00+60 = 18:00 == custom close
  });
});

// ════════════════════════════════════════════════════════════════════════════
// edit-mode parity note  — excludeCitaId is a SERVICE concern. The pure function
// only sees pre-filtered ranges; passing EMPTY booking sets is the post-exclusion
// shape and must yield the full grid.
// ════════════════════════════════════════════════════════════════════════════

describe('computeAvailableStartTimes — post-exclusion (empty ranges) parity', () => {
  it('with no bookings (the edit-mode self-excluded shape) the slot is offered', () => {
    const hhmm = asHHMM(
      run({ windows: [], duracionMinutos: 60, salaBookedRanges: [], therapistBookedRanges: [] }),
    );
    expect(hhmm).toContain('10:00');
  });
});
