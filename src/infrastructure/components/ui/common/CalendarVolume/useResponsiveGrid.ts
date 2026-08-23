/**
 * useResponsiveGrid — Reactive breakpoint detection
 *
 * Uses ResizeObserver on a container ref for container-query semantics
 * (avoids window-level listeners; works inside panels, modals, sidebars).
 *
 * Breakpoints:
 *  mobile  < 640px
 *  tablet  640px – 1023px
 *  desktop ≥ 1024px
 */

import { useState, useEffect, useRef, type RefObject } from 'react';
import type { IResponsiveState, TBreakpoint } from './CalendarVolume.types';

const MOBILE_MAX = 640;
const TABLET_MAX = 1024;

const classify = (width: number): TBreakpoint => {
  if (width < MOBILE_MAX) return 'mobile';
  if (width < TABLET_MAX) return 'tablet';
  return 'desktop';
};

const toState = (bp: TBreakpoint): IResponsiveState => ({
  breakpoint: bp,
  isMobile: bp === 'mobile',
  isTablet: bp === 'tablet',
  isDesktop: bp === 'desktop',
});

interface UseResponsiveGridResult extends IResponsiveState {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useResponsiveGrid = (): UseResponsiveGridResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<IResponsiveState>(() => toState('mobile'));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial measurement
    setState(toState(classify(el.getBoundingClientRect().width)));

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setState((prev) => {
        const next = classify(width);
        // Bail out if breakpoint unchanged — avoids re-render churn
        return prev.breakpoint === next ? prev : toState(next);
      });
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  return { ...state, containerRef };
};
