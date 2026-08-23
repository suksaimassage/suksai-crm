/**
 * useScheduleViewportConfig.ts
 *
 * Picks a responsive (slotWidth, density) pair for the WorkScheduleCalendar Day
 * view based on the viewport width. The calendar's Day grid is a fixed-pixel
 * layout (`labelWidth + (endHour − startHour)·slotWidth`); with the default
 * 96px slot + 200px label it needs ~1352px and overflows the ~700px content
 * column at tablet landscape. Shrinking the slot/label per band keeps the grid
 * inside the panel (with light internal scroll) instead of 2× overflow.
 *
 * Bands (min-width):
 *   < sm  (<480px)       → slotWidth 48, density 'xs' (labelWidth 160)
 *   sm–xl (480–1279px)   → slotWidth 64, density 'sm' (labelWidth 180)  ← tablet
 *   ≥ xl  (≥1280px)      → slotWidth 96, density 'md' (labelWidth 200)
 *
 * The returned object is referentially STABLE across renders unless the band
 * actually changes — the calendar memoizes its Day view on these props, so a
 * fresh inline object every render would defeat that memoization. Container
 * queries are not available in this stack, so width is read via matchMedia
 * (mirrors the `useIsMobile` precedent in ClientesPage).
 */

import { useEffect, useMemo, useState } from 'react';
import type { ScheduleDensity } from '@infra/components/ui/shared/WorkScheduleCalendar';

export interface IScheduleViewportConfig {
  /** Pixels per hour in the Day-view time grid. */
  readonly slotWidth: number;
  /** Row density tier — also drives the sticky label-column width. */
  readonly density: ScheduleDensity;
}

type TScheduleBand = 'compact' | 'tablet' | 'wide';

// Theme breakpoints (min-width): sm 480 · xl 1280.
const SM_BREAKPOINT_PX = 480;
const XL_BREAKPOINT_PX = 1280;

const BAND_CONFIG: Record<TScheduleBand, IScheduleViewportConfig> = {
  compact: { slotWidth: 48, density: 'xs' },
  tablet: { slotWidth: 64, density: 'sm' },
  wide: { slotWidth: 96, density: 'md' },
};

const resolveBand = (atLeastSm: boolean, atLeastXl: boolean): TScheduleBand => {
  if (atLeastXl) return 'wide';
  if (atLeastSm) return 'tablet';
  return 'compact';
};

const readBand = (): TScheduleBand => {
  if (typeof window === 'undefined') return 'wide';
  const atLeastSm = window.matchMedia(`(min-width: ${SM_BREAKPOINT_PX}px)`).matches;
  const atLeastXl = window.matchMedia(`(min-width: ${XL_BREAKPOINT_PX}px)`).matches;
  return resolveBand(atLeastSm, atLeastXl);
};

export const useScheduleViewportConfig = (): IScheduleViewportConfig => {
  const [band, setBand] = useState<TScheduleBand>(readBand);

  useEffect(() => {
    const smMql = window.matchMedia(`(min-width: ${SM_BREAKPOINT_PX}px)`);
    const xlMql = window.matchMedia(`(min-width: ${XL_BREAKPOINT_PX}px)`);
    const sync = (): void => {
      setBand(resolveBand(smMql.matches, xlMql.matches));
    };
    sync();
    smMql.addEventListener('change', sync);
    xlMql.addEventListener('change', sync);
    return () => {
      smMql.removeEventListener('change', sync);
      xlMql.removeEventListener('change', sync);
    };
  }, []);

  // Stable per band: the same object identity is returned until the band flips,
  // preserving the calendar's Day-view memoization.
  return useMemo(() => BAND_CONFIG[band], [band]);
};
