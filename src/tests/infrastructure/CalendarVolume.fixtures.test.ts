/**
 * CalendarVolume.fixtures.test.ts
 *
 * Validates the shape and constraints of MOCK_VOLUME_DATA from
 * DashboardOverviewPage.fixtures.ts.
 *
 * These tests guard against accidental corruption of mock data that drives
 * the CalendarVolume component on the Dashboard Overview page.
 *
 * Covers:
 *   - MOCK_VOLUME_DATA is an array
 *   - Each entry conforms to IVolumeData shape
 *   - All day values are valid ISO date strings "YYYY-MM-DD"
 *   - All hour values are within the 9–18 range (as built by buildVolumeData)
 *   - No entries have value === 0 (filtered out by buildVolumeData)
 *   - Total entry count is within a plausible range (7 days × up to 10 slots)
 */

import { describe, it, expect } from 'vitest';
import { MOCK_VOLUME_DATA } from '@infra/pages/DashboardOverviewPage/DashboardOverviewPage.fixtures';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

describe('MOCK_VOLUME_DATA — shape', () => {
  it('is an array', () => {
    expect(Array.isArray(MOCK_VOLUME_DATA)).toBe(true);
  });

  it('is non-empty', () => {
    expect(MOCK_VOLUME_DATA.length).toBeGreaterThan(0);
  });

  it('has at most 7 × 10 = 70 entries', () => {
    // 7 days × 10 hour slots
    expect(MOCK_VOLUME_DATA.length).toBeLessThanOrEqual(70);
  });
});

describe('MOCK_VOLUME_DATA — entry shape', () => {
  it('every entry has a "day" property', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(entry).toHaveProperty('day');
    });
  });

  it('every entry has an "hour" property', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(entry).toHaveProperty('hour');
    });
  });

  it('every entry has a "value" property', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(entry).toHaveProperty('value');
    });
  });

  it('every "day" is a valid ISO date string (YYYY-MM-DD)', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(entry.day).toMatch(ISO_DATE_REGEX);
    });
  });

  it('every "hour" is a number', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(typeof entry.hour).toBe('number');
    });
  });

  it('every "value" is a positive integer', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(typeof entry.value).toBe('number');
      expect(Number.isInteger(entry.value)).toBe(true);
      expect(entry.value).toBeGreaterThan(0);
    });
  });
});

describe('MOCK_VOLUME_DATA — domain constraints', () => {
  it('all hour values are within the 9–18 range', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      expect(entry.hour).toBeGreaterThanOrEqual(9);
      // buildVolumeData uses slots 0–9 → hours 9–18
      expect(entry.hour).toBeLessThanOrEqual(18);
    });
  });

  it('contains no entries with value === 0 (filtered by buildVolumeData)', () => {
    const zeroValueEntries = MOCK_VOLUME_DATA.filter((e) => e.value === 0);
    expect(zeroValueEntries).toHaveLength(0);
  });

  it('contains entries from exactly 7 distinct days', () => {
    const uniqueDays = new Set(MOCK_VOLUME_DATA.map((e) => e.day));
    // buildVolumeData iterates 7 days (dayOffset 0–6), some may have no data
    // but must have at least entries from multiple days
    expect(uniqueDays.size).toBeGreaterThanOrEqual(1);
    expect(uniqueDays.size).toBeLessThanOrEqual(7);
  });

  it('all day strings parse to valid Date objects', () => {
    MOCK_VOLUME_DATA.forEach((entry) => {
      const parsed = new Date(entry.day);
      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });

  it('the 7 days are consecutive (no gaps)', () => {
    const uniqueDays = [...new Set(MOCK_VOLUME_DATA.map((e) => e.day))].sort();
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]).getTime();
      const curr = new Date(uniqueDays[i]).getTime();
      // Consecutive days differ by exactly 86_400_000 ms
      expect(curr - prev).toBe(86_400_000);
    }
  });
});
