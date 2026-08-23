/**
 * WorkScheduleCalendar.hooks.test.tsx
 *
 * Tests the STATE-LOSS BUG FIX (PART 1) in useWorkScheduleCalendar:
 *
 *   1. RESET re-sync — the reducer is re-seeded from canonical server state when
 *      the `initialShifts` CONTENT changes (a real React Query refetch). The
 *      optimistic temp-id shift created locally is replaced by the persisted
 *      `esp:<id>` row — no lingering duplicate (optimistic → reconciled).
 *   2. Content guard — an unrelated re-render that re-derives a content-equal
 *      `initialShifts` (NEW array identity, SAME content — the real
 *      WorkScheduleSection render pattern) does NOT clobber in-flight optimistic
 *      UX (no RESET fires). Keying on identity wiped it; keying on content fixes it.
 *   3. onVisibleRangeChange — emits the visible day-bounds on mount and on every
 *      view/date change, so the consumer can widen its read past the current month.
 *
 * The hook is pure state management (no DOM), so it is driven with renderHook +
 * act + rerender. No mocks beyond a vi.fn() for the callbacks the hook invokes —
 * matching the domain-philosophy of testing behaviour, not internals.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkScheduleCalendar } from '@infra/components/ui/shared/WorkScheduleCalendar/WorkScheduleCalendar.hooks';
import type {
  Employee,
  Shift,
  ShiftDraft,
} from '@infra/components/ui/shared/WorkScheduleCalendar/WorkScheduleCalendar.types';

const EMPLOYEES: Employee[] = [{ id: '1', name: 'Ana' }];

// A hoisted empty seed mirroring React Query's stable reference. Since the RESET
// re-sync keys on CONTENT (not identity), an inline `[]` would be safe too (same
// signature → no RESET), but the hoisted constant keeps the faithful server shape.
const EMPTY_SHIFTS: Shift[] = [];

/** A persisted especifico-origin shift (the canonical server shape). */
function espShift(id: number, date: string, startTime = '10:00', endTime = '12:00'): Shift {
  return {
    id: `esp:${String(id)}`,
    employeeId: '1',
    date,
    startTime,
    endTime,
    color: 'primary',
  };
}

const DRAFT: ShiftDraft = {
  employeeId: '1',
  date: '2026-05-18',
  startTime: '10:00',
  endTime: '12:00',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// RESET re-sync — the core state-loss fix
// ════════════════════════════════════════════════════════════════════════════

describe('useWorkScheduleCalendar — RESET re-sync to server state', () => {
  it('seeds the reducer from initialShifts on mount', () => {
    const seed = [espShift(1, '2026-05-18')];
    const { result } = renderHook(() =>
      useWorkScheduleCalendar(seed, new Date(2026, 4, 18), 'week', EMPLOYEES),
    );
    expect(result.current.shifts).toEqual(seed);
  });

  it('reconciles an optimistic temp-id create to the persisted esp: row on a refetch', () => {
    // Start with no shifts; render with a stable identity per props change.
    const onShiftCreate = vi.fn();
    const initialEmpty: Shift[] = [];

    const { result, rerender } = renderHook(
      ({ shifts }: { shifts: Shift[] }) =>
        useWorkScheduleCalendar(shifts, new Date(2026, 4, 18), 'week', EMPLOYEES, onShiftCreate),
      { initialProps: { shifts: initialEmpty } },
    );

    // 1. User creates a shift → optimistic temp-id row added locally + callback fired.
    act(() => {
      result.current.createShift(DRAFT);
    });
    expect(result.current.shifts).toHaveLength(1);
    const optimistic = result.current.shifts[0];
    expect(optimistic.id.startsWith('shift-')).toBe(true); // client temp id
    expect(onShiftCreate).toHaveBeenCalledWith(DRAFT);

    // 2. The mutation persists; React Query refetches and produces a NEW array
    //    reference containing the real persisted row (esp:<realId>).
    const serverRow = espShift(500, '2026-05-18');
    rerender({ shifts: [serverRow] });

    // 3. The reducer RESETs to server truth: the temp-id row is GONE (no duplicate),
    //    replaced by the persisted esp: row.
    expect(result.current.shifts).toHaveLength(1);
    expect(result.current.shifts[0].id).toBe('esp:500');
    expect(result.current.shifts.some((s) => s.id.startsWith('shift-'))).toBe(false);
  });

  it('adopts the server array wholesale on a refetch (edits/deletes reconcile too)', () => {
    const before = [espShift(1, '2026-05-18', '10:00', '12:00')];
    const { result, rerender } = renderHook(
      ({ shifts }: { shifts: Shift[] }) =>
        useWorkScheduleCalendar(shifts, new Date(2026, 4, 18), 'week', EMPLOYEES),
      { initialProps: { shifts: before } },
    );
    expect(result.current.shifts).toEqual(before);

    // A refetch returns the same row with edited times → reducer re-seeds to it.
    const after = [espShift(1, '2026-05-18', '14:00', '16:00')];
    rerender({ shifts: after });
    expect(result.current.shifts).toEqual(after);
    expect(result.current.shifts[0].startTime).toBe('14:00');
  });

  it('does NOT clobber an in-flight optimistic create on a re-render with the SAME array identity', () => {
    // A re-render that re-passes the SAME reference (e.g. an unrelated parent state
    // change) must not RESET — otherwise it would wipe the optimistic row mid-flight.
    const stableSeed: Shift[] = [];
    const { result, rerender } = renderHook(
      ({ shifts, tick }: { shifts: Shift[]; tick: number }) => {
        void tick; // force a re-render without changing the shifts reference
        return useWorkScheduleCalendar(shifts, new Date(2026, 4, 18), 'week', EMPLOYEES);
      },
      { initialProps: { shifts: stableSeed, tick: 0 } },
    );

    act(() => {
      result.current.createShift(DRAFT);
    });
    expect(result.current.shifts).toHaveLength(1); // optimistic row present

    // Re-render with the SAME shifts reference but a changed unrelated prop.
    rerender({ shifts: stableSeed, tick: 1 });

    // The optimistic row survives (content unchanged ⇒ no RESET).
    expect(result.current.shifts).toHaveLength(1);
    expect(result.current.shifts[0].id.startsWith('shift-')).toBe(true);
  });

  it('does NOT clobber an optimistic create on a NEW array identity with SAME content (real WorkScheduleSection render pattern — BUG-01 repro)', () => {
    // WorkScheduleSection re-derives `shifts` (mapHorariosToShifts → fresh Set/Date/
    // array) on EVERY render, so the prop has a new identity but identical content.
    // An identity-keyed RESET wiped the in-flight optimistic create here; the
    // content-keyed RESET must leave it untouched.
    const { result, rerender } = renderHook(
      ({ shifts }: { shifts: Shift[] }) =>
        useWorkScheduleCalendar(shifts, new Date(2026, 4, 18), 'week', EMPLOYEES),
      { initialProps: { shifts: [] as Shift[] } },
    );

    act(() => {
      result.current.createShift(DRAFT);
    });
    expect(result.current.shifts).toHaveLength(1);
    expect(result.current.shifts[0].id.startsWith('shift-')).toBe(true);

    // Brand-new empty array (new identity, same content) — as if a parent re-render
    // re-ran the mapper without any server change.
    rerender({ shifts: [] });

    // Optimistic row SURVIVES — content signature unchanged ⇒ no RESET fired.
    expect(result.current.shifts).toHaveLength(1);
    expect(result.current.shifts[0].id.startsWith('shift-')).toBe(true);

    // And a genuine content change (the refetch) still reconciles to server truth.
    rerender({ shifts: [espShift(700, '2026-05-18')] });
    expect(result.current.shifts).toHaveLength(1);
    expect(result.current.shifts[0].id).toBe('esp:700');
  });

  it('re-seeds to an EMPTY server array (all shifts removed server-side)', () => {
    const before = [espShift(1, '2026-05-18')];
    const { result, rerender } = renderHook(
      ({ shifts }: { shifts: Shift[] }) =>
        useWorkScheduleCalendar(shifts, new Date(2026, 4, 18), 'week', EMPLOYEES),
      { initialProps: { shifts: before } },
    );
    expect(result.current.shifts).toHaveLength(1);

    rerender({ shifts: [] }); // server now reports no shifts
    expect(result.current.shifts).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// onVisibleRangeChange — visible-range surfacing (read window follows calendar)
// ════════════════════════════════════════════════════════════════════════════

describe('useWorkScheduleCalendar — onVisibleRangeChange', () => {
  it('emits the visible range once on mount', () => {
    const onVisibleRangeChange = vi.fn();
    renderHook(() =>
      useWorkScheduleCalendar(
        EMPTY_SHIFTS,
        new Date(2026, 4, 18),
        'week',
        EMPLOYEES,
        undefined,
        undefined,
        undefined,
        onVisibleRangeChange,
      ),
    );
    expect(onVisibleRangeChange).toHaveBeenCalledTimes(1);
    const [start, end] = onVisibleRangeChange.mock.calls[0] as [Date, Date];
    // Week of Monday 2026-05-18 → Sun 2026-05-17 .. Sat 2026-05-23.
    expect(start.getDate()).toBe(17);
    expect(end.getDate()).toBe(23);
  });

  it('re-emits when the view changes (week → month widens the range)', () => {
    const onVisibleRangeChange = vi.fn();
    const { result } = renderHook(() =>
      useWorkScheduleCalendar(
        EMPTY_SHIFTS,
        new Date(2026, 4, 18),
        'week',
        EMPLOYEES,
        undefined,
        undefined,
        undefined,
        onVisibleRangeChange,
      ),
    );
    onVisibleRangeChange.mockClear();

    act(() => {
      result.current.setView('month');
    });

    expect(onVisibleRangeChange).toHaveBeenCalledTimes(1);
    const [start, end] = onVisibleRangeChange.mock.calls[0] as [Date, Date];
    // Month grid for May 2026 spans 2026-04-26 .. 2026-06-06.
    expect(start.getMonth()).toBe(3); // April (leading days)
    expect(end.getMonth()).toBe(5); // June (trailing days)
  });

  it('re-emits when navigating to the next period', () => {
    const onVisibleRangeChange = vi.fn();
    const { result } = renderHook(() =>
      useWorkScheduleCalendar(
        EMPTY_SHIFTS,
        new Date(2026, 4, 18),
        'week',
        EMPLOYEES,
        undefined,
        undefined,
        undefined,
        onVisibleRangeChange,
      ),
    );
    onVisibleRangeChange.mockClear();

    act(() => {
      result.current.goToNext(); // +7 days in week view
    });

    expect(onVisibleRangeChange).toHaveBeenCalledTimes(1);
    const [start] = onVisibleRangeChange.mock.calls[0] as [Date, Date];
    // Next week's Sunday is 2026-05-24.
    expect(start.getDate()).toBe(24);
  });

  it('is a no-op safety path when no onVisibleRangeChange handler is supplied', () => {
    // Must not throw when the optional callback is omitted (the prop is optional).
    expect(() =>
      renderHook(() =>
        useWorkScheduleCalendar(EMPTY_SHIFTS, new Date(2026, 4, 18), 'week', EMPLOYEES),
      ),
    ).not.toThrow();
  });
});
