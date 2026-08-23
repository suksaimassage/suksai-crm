/**
 * useTimeGrid.test.ts
 *
 * Pure-function tests for useTimeGrid hook and its exported helpers.
 * These are called as plain functions (no renderHook needed) because
 * the hook has no React state — it is deterministic on each call.
 *
 * Covers:
 *   - formatHourLabel
 *   - toISODateKey
 *   - getWeekDays
 *   - useTimeGrid: timeSlots generation
 *   - useTimeGrid: day columns (day view / week view)
 *   - useTimeGrid: maxValue
 *   - useTimeGrid: cellMap
 *   - Edge cases: startHour >= endHour, data outside visible range
 */

import { describe, it, expect } from 'vitest';
import { formatHourLabel, toISODateKey, getWeekDays, useTimeGrid } from './useTimeGrid';
import type { IVolumeData } from './CalendarVolume.types';

// ─── formatHourLabel ─────────────────────────────────────────────────────────

describe('formatHourLabel', () => {
  it('formats midnight as "00:00"', () => {
    expect(formatHourLabel(0)).toBe('00:00');
  });

  it('zero-pads single-digit hours ("09:00")', () => {
    expect(formatHourLabel(9)).toBe('09:00');
  });

  it('formats noon as "12:00"', () => {
    expect(formatHourLabel(12)).toBe('12:00');
  });

  it('formats afternoon hours in 24h ("13:00")', () => {
    expect(formatHourLabel(13)).toBe('13:00');
  });

  it('formats the late evening as "21:00"', () => {
    expect(formatHourLabel(21)).toBe('21:00');
  });

  it('formats 23 as "23:00"', () => {
    expect(formatHourLabel(23)).toBe('23:00');
  });
});

// ─── toISODateKey ─────────────────────────────────────────────────────────────

describe('toISODateKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const date = new Date('2024-03-15T12:00:00Z');
    expect(toISODateKey(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('strips time portion', () => {
    const date = new Date('2024-01-05T23:59:59Z');
    // The ISO split on 'T' always gives the date part
    const result = toISODateKey(date);
    expect(result).not.toContain('T');
    expect(result.length).toBe(10);
  });
});

// ─── getWeekDays ──────────────────────────────────────────────────────────────

describe('getWeekDays', () => {
  it('returns 7 days', () => {
    const days = getWeekDays(new Date('2024-03-13')); // Wednesday
    expect(days).toHaveLength(7);
  });

  it('first day is Monday when reference is mid-week', () => {
    // March 13 2024 is a Wednesday; the Monday-first week starts on Monday March 11
    const days = getWeekDays(new Date('2024-03-13T12:00:00'));
    expect(days[0].getDay()).toBe(1); // Monday
  });

  it('last day is Sunday', () => {
    const days = getWeekDays(new Date('2024-03-13T12:00:00'));
    expect(days[6].getDay()).toBe(0); // Sunday
  });

  it('starts on Monday when reference date is already Monday', () => {
    // March 11 2024 is a Monday — use local date constructor to avoid timezone shifts
    const monday = new Date(2024, 2, 11); // month is 0-indexed → March
    const days = getWeekDays(monday);
    expect(days[0].getDay()).toBe(1);
    // The week starting from a Monday should still start on that same Monday
    expect(days[0].getFullYear()).toBe(2024);
    expect(days[0].getMonth()).toBe(2); // March
    expect(days[0].getDate()).toBe(11);
  });

  it('places a Sunday reference in the prior Monday-led week', () => {
    // March 10 2024 is a Sunday → belongs to the week starting Monday March 4
    const sunday = new Date(2024, 2, 10);
    const days = getWeekDays(sunday);
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days[0].getDate()).toBe(4);
    expect(days[6].getDate()).toBe(10); // the reference Sunday closes the week
  });

  it('covers exactly 7 consecutive days', () => {
    const days = getWeekDays(new Date('2024-03-13'));
    for (let i = 1; i < days.length; i++) {
      const diffMs = days[i].getTime() - days[i - 1].getTime();
      expect(diffMs).toBe(86400000); // exactly 1 day in ms
    }
  });
});

// ─── useTimeGrid: timeSlots ───────────────────────────────────────────────────

describe('useTimeGrid — timeSlots', () => {
  const baseParams = {
    view: 'week' as const,
    selectedDate: new Date('2024-03-13'),
    data: [] as IVolumeData[],
  };

  it('generates correct number of slots for startHour=9, endHour=18', () => {
    const { timeSlots } = useTimeGrid({ ...baseParams, startHour: 9, endHour: 18 });
    expect(timeSlots).toHaveLength(9);
  });

  it('first slot hour equals startHour', () => {
    const { timeSlots } = useTimeGrid({ ...baseParams, startHour: 9, endHour: 18 });
    expect(timeSlots[0].hour).toBe(9);
  });

  it('last slot hour equals endHour - 1', () => {
    const { timeSlots } = useTimeGrid({ ...baseParams, startHour: 9, endHour: 18 });
    expect(timeSlots[timeSlots.length - 1].hour).toBe(17);
  });

  it('each slot has a 24h formatted label', () => {
    const { timeSlots } = useTimeGrid({ ...baseParams, startHour: 9, endHour: 11 });
    expect(timeSlots[0].label).toBe('09:00');
    expect(timeSlots[1].label).toBe('10:00');
  });

  it('returns 0 time slots when startHour equals endHour (edge case)', () => {
    const { timeSlots } = useTimeGrid({ ...baseParams, startHour: 9, endHour: 9 });
    expect(timeSlots).toHaveLength(0);
  });

  it('returns 0 time slots when startHour > endHour (edge case)', () => {
    const { timeSlots } = useTimeGrid({ ...baseParams, startHour: 18, endHour: 9 });
    expect(timeSlots).toHaveLength(0);
  });
});

// ─── useTimeGrid: days (week view) ────────────────────────────────────────────

describe('useTimeGrid — day columns (week view)', () => {
  it('returns 7 day columns', () => {
    const { days } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'),
      data: [],
    });
    expect(days).toHaveLength(7);
  });

  it('first day column is a Monday (day index 1)', () => {
    const { days } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'), // Wednesday
      data: [],
    });
    expect(days[0].date.getDay()).toBe(1);
  });

  it('each day column has a key in YYYY-MM-DD format', () => {
    const { days } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'),
      data: [],
    });
    days.forEach((d) => {
      expect(d.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('day columns have correct short and full labels (Monday-first, default English)', () => {
    const { days } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date(2024, 2, 11), // Monday March 11 2024
      data: [],
    });
    // First day is Monday
    expect(days[0].label).toBe('M');
    expect(days[0].fullLabel).toBe('Monday');
    // Second day is Tuesday
    expect(days[1].label).toBe('T');
    expect(days[1].fullLabel).toBe('Tuesday');
  });

  it('uses injected localized day labels when provided', () => {
    const { days } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date(2024, 2, 11), // Monday
      data: [],
      dayShortLabels: { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' },
      dayFullLabels: {
        0: 'Domingo',
        1: 'Lunes',
        2: 'Martes',
        3: 'Miércoles',
        4: 'Jueves',
        5: 'Viernes',
        6: 'Sábado',
      },
    });
    expect(days[0].label).toBe('Lun');
    expect(days[0].fullLabel).toBe('Lunes');
  });
});

// ─── useTimeGrid: days (day view) ─────────────────────────────────────────────

describe('useTimeGrid — day columns (day view)', () => {
  it('returns exactly 1 day column', () => {
    const { days } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'),
      data: [],
    });
    expect(days).toHaveLength(1);
  });

  it('day column key matches the selectedDate ISO date', () => {
    const selectedDate = new Date('2024-03-13T00:00:00');
    const { days } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 18,
      selectedDate,
      data: [],
    });
    expect(days[0].key).toBe(toISODateKey(selectedDate));
  });

  it('day column fullLabel matches the weekday name', () => {
    // March 13 2024 is a Wednesday
    const { days } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13T00:00:00'),
      data: [],
    });
    expect(days[0].fullLabel).toBe('Wednesday');
  });
});

// ─── useTimeGrid: maxValue ────────────────────────────────────────────────────

describe('useTimeGrid — maxValue', () => {
  it('returns 12 as fallback when data is empty', () => {
    const { maxValue } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'),
      data: [],
    });
    expect(maxValue).toBe(12);
  });

  it('returns correct max from data entries', () => {
    const data: IVolumeData[] = [
      { day: '2024-03-11', hour: 9, value: 3 },
      { day: '2024-03-11', hour: 10, value: 8 },
      { day: '2024-03-11', hour: 11, value: 5 },
    ];
    const { maxValue } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'),
      data,
    });
    expect(maxValue).toBe(8);
  });

  it('returns 1 as minimum when data has only 1-value entries', () => {
    const data: IVolumeData[] = [{ day: '2024-03-11', hour: 9, value: 1 }];
    const { maxValue } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 18,
      selectedDate: new Date('2024-03-13'),
      data,
    });
    expect(maxValue).toBe(1);
  });
});

// ─── useTimeGrid: cellMap ─────────────────────────────────────────────────────

describe('useTimeGrid — cellMap', () => {
  it('indexes cells by "day__hour" key', () => {
    const selectedDate = new Date('2024-03-13T00:00:00'); // Wednesday
    const dayKey = toISODateKey(selectedDate);
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 11,
      selectedDate,
      data: [{ day: dayKey, hour: 9, value: 4 }],
    });
    expect(cellMap.has(`${dayKey}__9`)).toBe(true);
  });

  it('cell value matches data entry', () => {
    const selectedDate = new Date('2024-03-13T00:00:00');
    const dayKey = toISODateKey(selectedDate);
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 11,
      selectedDate,
      data: [{ day: dayKey, hour: 9, value: 7 }],
    });
    expect(cellMap.get(`${dayKey}__9`)?.value).toBe(7);
  });

  it('cell with no data entry has value 0', () => {
    const selectedDate = new Date('2024-03-13T00:00:00');
    const dayKey = toISODateKey(selectedDate);
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 11,
      selectedDate,
      data: [],
    });
    expect(cellMap.get(`${dayKey}__9`)?.value).toBe(0);
  });

  it('computes intensity as value / maxValue', () => {
    const selectedDate = new Date('2024-03-13T00:00:00');
    const dayKey = toISODateKey(selectedDate);
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 11,
      selectedDate,
      data: [{ day: dayKey, hour: 9, value: 5 }],
    });
    // maxValue = 5, value = 5 → intensity = 1.0
    expect(cellMap.get(`${dayKey}__9`)?.intensity).toBeCloseTo(1.0);
  });

  it('data entries outside visible time range are not in cellMap', () => {
    const selectedDate = new Date('2024-03-13T00:00:00');
    const dayKey = toISODateKey(selectedDate);
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 11,
      selectedDate,
      // hour 22 is outside startHour..endHour range
      data: [{ day: dayKey, hour: 22, value: 10 }],
    });
    expect(cellMap.has(`${dayKey}__22`)).toBe(false);
  });

  it('data entries for days outside visible columns are not in cellMap', () => {
    const selectedDate = new Date('2024-03-13T00:00:00');
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 11,
      selectedDate,
      // a different day entirely
      data: [{ day: '2024-01-01', hour: 9, value: 5 }],
    });
    expect(cellMap.has('2024-01-01__9')).toBe(false);
  });

  it('cellMap has no entries when startHour >= endHour', () => {
    const { cellMap } = useTimeGrid({
      view: 'day',
      startHour: 9,
      endHour: 9,
      selectedDate: new Date('2024-03-13'),
      data: [{ day: '2024-03-13', hour: 9, value: 3 }],
    });
    expect(cellMap.size).toBe(0);
  });

  it('week view cellMap contains entries for all 7 days × visible hours', () => {
    const { cellMap, days, timeSlots } = useTimeGrid({
      view: 'week',
      startHour: 9,
      endHour: 11,
      selectedDate: new Date('2024-03-13'),
      data: [],
    });
    expect(cellMap.size).toBe(days.length * timeSlots.length);
  });
});
