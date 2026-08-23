/**
 * useHeatmapScale.test.ts
 *
 * Tests for the useHeatmapScale hook.
 *
 * Covers:
 *   - getColor: transparent for intensity 0
 *   - getColor: rgb() string for intensity > 0
 *   - getTextColor: correct thresholds
 *   - gradientCss: structural validation
 *   - maxValue: passed through correctly
 */

import { describe, it, expect } from 'vitest';
import { useHeatmapScale } from './useHeatmapScale';

// useHeatmapScale is a pure function (no React state), call it directly.

describe('useHeatmapScale — getColor', () => {
  it('returns "transparent" for intensity === 0', () => {
    const { getColor } = useHeatmapScale(10);
    expect(getColor(0)).toBe('transparent');
  });

  it('returns "transparent" for intensity < 0 (clamped)', () => {
    const { getColor } = useHeatmapScale(10);
    expect(getColor(-0.5)).toBe('transparent');
  });

  it('returns an rgb() string for intensity > 0', () => {
    const { getColor } = useHeatmapScale(10);
    const color = getColor(0.5);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('returns an rgb() string for intensity === 1', () => {
    const { getColor } = useHeatmapScale(10);
    const color = getColor(1);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('returns an rgb() string for intensity === 0.01 (just above 0)', () => {
    const { getColor } = useHeatmapScale(10);
    const color = getColor(0.01);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('color at intensity 1 is darker than color at intensity 0.25 (deep > light)', () => {
    const { getColor } = useHeatmapScale(10);
    // The gradient goes near-white to deep ocean teal — high intensity is darker.
    // We parse red channel: at 1.0 it should be lower (0) than at 0.25 (178).
    const parse = (s: string) => {
      const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(s);
      return m ? { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) } : null;
    };
    const highIntensity = parse(getColor(1));
    const lowIntensity = parse(getColor(0.25));
    expect(highIntensity).not.toBeNull();
    expect(lowIntensity).not.toBeNull();
    // Deep teal (intensity 1) has r=0, light teal (0.25) has r=178
    expect(highIntensity!.r).toBeLessThan(lowIntensity!.r);
  });
});

describe('useHeatmapScale — getTextColor', () => {
  it('returns TEXT_LOW (dark color) for intensity < 0.45', () => {
    const { getTextColor } = useHeatmapScale(10);
    const color = getTextColor(0.44);
    // TEXT_LOW = 'oklch(0.11 0.03 204)' — dark
    expect(color).toContain('oklch');
    // The lightness value 0.11 indicates a dark color
    expect(color).toMatch(/oklch\(0\.11/);
  });

  it('returns TEXT_HIGH (light color) for intensity === 0.45 (threshold)', () => {
    const { getTextColor } = useHeatmapScale(10);
    const color = getTextColor(0.45);
    // TEXT_HIGH = 'oklch(0.97 0.01 67)' — near-white
    expect(color).toContain('oklch');
    expect(color).toMatch(/oklch\(0\.97/);
  });

  it('returns TEXT_HIGH for intensity > 0.45', () => {
    const { getTextColor } = useHeatmapScale(10);
    const color = getTextColor(0.9);
    expect(color).toMatch(/oklch\(0\.97/);
  });

  it('returns TEXT_LOW for intensity === 0', () => {
    const { getTextColor } = useHeatmapScale(10);
    const color = getTextColor(0);
    expect(color).toMatch(/oklch\(0\.11/);
  });
});

describe('useHeatmapScale — gradientCss', () => {
  it('is a linear-gradient string', () => {
    const { gradientCss } = useHeatmapScale(10);
    expect(gradientCss).toMatch(/^linear-gradient/);
  });

  it('contains "to right" direction', () => {
    const { gradientCss } = useHeatmapScale(10);
    expect(gradientCss).toContain('to right');
  });

  it('contains 5 color stops (rgb values with percentage positions)', () => {
    const { gradientCss } = useHeatmapScale(10);
    // Each stop is "rgb(...) XX%"
    const stops = gradientCss.match(/rgb\(\d+, \d+, \d+\) \d+%/g);
    expect(stops).toHaveLength(5);
  });

  it('first stop is at 0%', () => {
    const { gradientCss } = useHeatmapScale(10);
    expect(gradientCss).toContain('0%');
  });

  it('last stop is at 100%', () => {
    const { gradientCss } = useHeatmapScale(10);
    expect(gradientCss).toContain('100%');
  });
});

describe('useHeatmapScale — maxValue passthrough', () => {
  it('exposes the maxValue passed in', () => {
    const { maxValue } = useHeatmapScale(42);
    expect(maxValue).toBe(42);
  });

  it('exposes maxValue === 0 without error', () => {
    const { maxValue } = useHeatmapScale(0);
    expect(maxValue).toBe(0);
  });
});
