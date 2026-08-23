/**
 * useCalendarVolume.test.ts
 *
 * Tests for the useCalendarVolume hook and the formatDateLabel helper.
 *
 * Covers:
 *   - Internal state: starts with defaultView and defaultDate
 *   - Controlled view: external view prop does not mutate internal state
 *   - handleNavigate (day view): advances selectedDate by 1 day
 *   - handleNavigate (week view): advances selectedDate by 7 days
 *   - handleViewChange: fires onViewChange callback
 *   - deriveBusySlots: returns top-N slots by value, sorted descending
 *   - deriveBusySlots: returns empty array when all values are 0
 *   - deriveBusySlots: respects insightsCount limit
 *   - formatDateLabel: day view format
 *   - formatDateLabel: week view format
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarVolume, formatDateLabel } from './useCalendarVolume';
import { toISODateKey } from './useTimeGrid';
import type { IGridCell } from './CalendarVolume.types';

// ─── formatDateLabel ──────────────────────────────────────────────────────────

describe('formatDateLabel — day view', () => {
  it('returns "MMM D, YYYY" format', () => {
    const date = new Date(2024, 2, 15); // March 15 2024 (local)
    const label = formatDateLabel(date, 'day');
    expect(label).toBe('Mar 15, 2024');
  });

  it('handles January 1st', () => {
    const date = new Date(2024, 0, 1);
    const label = formatDateLabel(date, 'day');
    expect(label).toBe('Jan 1, 2024');
  });

  it('handles December 31st', () => {
    const date = new Date(2024, 11, 31);
    const label = formatDateLabel(date, 'day');
    expect(label).toBe('Dec 31, 2024');
  });
});

describe('formatDateLabel — week view', () => {
  it('returns "Week N (MMM D – MMM D, YYYY)" format', () => {
    // March 13 2024 is a Wednesday in Week 11; week spans Mar 10–16
    const date = new Date(2024, 2, 13);
    const label = formatDateLabel(date, 'week');
    expect(label).toMatch(/^Week \d+ \(Mar \d+ – Mar \d+, \d{4}\)$/);
  });

  it('contains week number', () => {
    const date = new Date(2024, 2, 13);
    const label = formatDateLabel(date, 'week');
    expect(label).toContain('Week');
  });

  it('contains the year', () => {
    const date = new Date(2024, 2, 13);
    const label = formatDateLabel(date, 'week');
    expect(label).toContain('2024');
  });
});

// ─── useCalendarVolume: initial state ────────────────────────────────────────

describe('useCalendarVolume — initial state', () => {
  it('starts with defaultView="week" when no defaultView provided', () => {
    const { result } = renderHook(() => useCalendarVolume({}));
    expect(result.current.view).toBe('week');
  });

  it('starts with the specified defaultView', () => {
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'day' }));
    expect(result.current.view).toBe('day');
  });

  it('starts with defaultDate when provided', () => {
    const defaultDate = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarVolume({ defaultDate }));
    expect(toISODateKey(result.current.selectedDate)).toBe(toISODateKey(defaultDate));
  });

  it('todayKey is in YYYY-MM-DD format', () => {
    const { result } = renderHook(() => useCalendarVolume({}));
    expect(result.current.todayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dateLabel is a non-empty string', () => {
    const { result } = renderHook(() => useCalendarVolume({}));
    expect(result.current.dateLabel.length).toBeGreaterThan(0);
  });
});

// ─── useCalendarVolume: controlled view ───────────────────────────────────────

describe('useCalendarVolume — controlled view', () => {
  it('uses the externally controlled view', () => {
    const { result } = renderHook(() => useCalendarVolume({ view: 'day', defaultView: 'week' }));
    expect(result.current.view).toBe('day');
  });

  it('does not update internal view state when controlled view prop changes', () => {
    const { result, rerender } = renderHook(
      ({ view }: { view: 'day' | 'week' }) => useCalendarVolume({ view, defaultView: 'week' }),
      { initialProps: { view: 'week' as 'day' | 'week' } },
    );
    expect(result.current.view).toBe('week');

    // Re-render with a different controlled view
    rerender({ view: 'day' });
    expect(result.current.view).toBe('day');

    // Calling handleViewChange should still not override the controlled view
    act(() => {
      result.current.handleViewChange('week');
    });
    // view stays at 'day' because it is externally controlled
    expect(result.current.view).toBe('day');
  });
});

// ─── useCalendarVolume: handleViewChange ──────────────────────────────────────

describe('useCalendarVolume — handleViewChange (uncontrolled)', () => {
  it('updates internal view when uncontrolled', () => {
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'week' }));
    act(() => {
      result.current.handleViewChange('day');
    });
    expect(result.current.view).toBe('day');
  });

  it('fires onViewChange callback', () => {
    const onViewChange = vi.fn();
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'week', onViewChange }));
    act(() => {
      result.current.handleViewChange('day');
    });
    expect(onViewChange).toHaveBeenCalledWith('day');
  });
});

// ─── useCalendarVolume: handleNavigate (day view) ────────────────────────────

describe('useCalendarVolume — handleNavigate (day view)', () => {
  it('advances selectedDate by 1 day in day view (forward)', () => {
    const defaultDate = new Date(2024, 2, 15); // March 15
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'day', defaultDate }));
    act(() => {
      result.current.handleNavigate(1);
    });
    const expected = toISODateKey(new Date(2024, 2, 16)); // March 16
    expect(toISODateKey(result.current.selectedDate)).toBe(expected);
  });

  it('moves selectedDate back by 1 day in day view (backward)', () => {
    const defaultDate = new Date(2024, 2, 15); // March 15
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'day', defaultDate }));
    act(() => {
      result.current.handleNavigate(-1);
    });
    const expected = toISODateKey(new Date(2024, 2, 14)); // March 14
    expect(toISODateKey(result.current.selectedDate)).toBe(expected);
  });

  it('fires onDayChange callback with new date', () => {
    const onDayChange = vi.fn();
    const defaultDate = new Date(2024, 2, 15);
    const { result } = renderHook(() =>
      useCalendarVolume({ defaultView: 'day', defaultDate, onDayChange }),
    );
    act(() => {
      result.current.handleNavigate(1);
    });
    expect(onDayChange).toHaveBeenCalledTimes(1);
    const calledWith = onDayChange.mock.calls[0][0] as unknown as Date;
    expect(toISODateKey(calledWith)).toBe(toISODateKey(new Date(2024, 2, 16)));
  });
});

// ─── useCalendarVolume: handleNavigate (week view) ───────────────────────────

describe('useCalendarVolume — handleNavigate (week view)', () => {
  it('advances selectedDate by 7 days in week view (forward)', () => {
    const defaultDate = new Date(2024, 2, 13); // March 13
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'week', defaultDate }));
    act(() => {
      result.current.handleNavigate(1);
    });
    const expected = toISODateKey(new Date(2024, 2, 20)); // March 20
    expect(toISODateKey(result.current.selectedDate)).toBe(expected);
  });

  it('moves selectedDate back by 7 days in week view (backward)', () => {
    const defaultDate = new Date(2024, 2, 13); // March 13
    const { result } = renderHook(() => useCalendarVolume({ defaultView: 'week', defaultDate }));
    act(() => {
      result.current.handleNavigate(-1);
    });
    const expected = toISODateKey(new Date(2024, 2, 6)); // March 6
    expect(toISODateKey(result.current.selectedDate)).toBe(expected);
  });

  it('fires onWeekChange callback with the Monday of the new week (Monday-first calendar)', () => {
    const onWeekChange = vi.fn();
    const defaultDate = new Date(2024, 2, 13); // Wednesday March 13
    const { result } = renderHook(() =>
      useCalendarVolume({ defaultView: 'week', defaultDate, onWeekChange }),
    );
    act(() => {
      result.current.handleNavigate(1);
    });
    expect(onWeekChange).toHaveBeenCalledTimes(1);
    const calledWith = onWeekChange.mock.calls[0][0] as unknown as Date;
    // Calendar is Monday-first: getWeekDays()[0] is always Monday (getDay() === 1)
    expect(calledWith.getDay()).toBe(1); // Monday
  });
});

// ─── useCalendarVolume: deriveBusySlots ───────────────────────────────────────

const makeCell = (dayLabel: string, hour: number, value: number): IGridCell => ({
  day: '2024-03-13',
  dayLabel,
  hour,
  value,
  intensity: value / 10,
});

describe('useCalendarVolume — deriveBusySlots', () => {
  it('returns empty array when all cell values are 0', () => {
    const { result } = renderHook(() => useCalendarVolume({}));
    const cells = new Map([
      ['a', makeCell('Monday', 9, 0)],
      ['b', makeCell('Monday', 10, 0)],
    ]);
    const busy = result.current.deriveBusySlots(cells);
    expect(busy).toHaveLength(0);
  });

  it('returns slots sorted by value descending', () => {
    const { result } = renderHook(() => useCalendarVolume({ insightsCount: 5 }));
    const cells = new Map([
      ['a', makeCell('Monday', 9, 3)],
      ['b', makeCell('Tuesday', 10, 8)],
      ['c', makeCell('Wednesday', 11, 5)],
    ]);
    const busy = result.current.deriveBusySlots(cells);
    expect(busy[0].count).toBe(8);
    expect(busy[1].count).toBe(5);
    expect(busy[2].count).toBe(3);
  });

  it('respects insightsCount limit', () => {
    const { result } = renderHook(() => useCalendarVolume({ insightsCount: 2 }));
    const cells = new Map([
      ['a', makeCell('Monday', 9, 3)],
      ['b', makeCell('Tuesday', 10, 8)],
      ['c', makeCell('Wednesday', 11, 5)],
    ]);
    const busy = result.current.deriveBusySlots(cells);
    expect(busy).toHaveLength(2);
  });

  it('returns correct label format "Weekday, HH:MM–HH:MM" (24-hour, locale-neutral)', () => {
    const { result } = renderHook(() => useCalendarVolume({ insightsCount: 1 }));
    const cells = new Map([['a', makeCell('Monday', 9, 5)]]);
    const busy = result.current.deriveBusySlots(cells);
    // formatHourLabel produces 24-hour zero-padded strings: hour 9 → "09:00"
    expect(busy[0].label).toMatch(/Mon, 09:00/);
  });

  it('returns correct count value', () => {
    const { result } = renderHook(() => useCalendarVolume({ insightsCount: 1 }));
    const cells = new Map([['a', makeCell('Friday', 14, 7)]]);
    const busy = result.current.deriveBusySlots(cells);
    expect(busy[0].count).toBe(7);
  });

  it('defaults insightsCount to 3 when not specified', () => {
    const { result } = renderHook(() => useCalendarVolume({}));
    const cells = new Map(
      Array.from({ length: 5 }, (_, i) => [String(i), makeCell('Monday', 9 + i, i + 1)]),
    );
    const busy = result.current.deriveBusySlots(cells);
    expect(busy).toHaveLength(3);
  });
});
