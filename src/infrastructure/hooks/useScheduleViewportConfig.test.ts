/**
 * useScheduleViewportConfig.test.ts
 *
 * Unit tests for the matchMedia-driven responsive-config hook that picks the
 * WorkScheduleCalendar Day-view (slotWidth, density) pair per viewport band:
 *
 *   < sm  (< 480px)        → { slotWidth: 48, density: 'xs' }   ('compact')
 *   sm–xl (480–1279px)     → { slotWidth: 64, density: 'sm' }   ('tablet')
 *   ≥ xl  (≥ 1280px)       → { slotWidth: 96, density: 'md' }   ('wide')
 *
 * The hook reads width via TWO matchMedia queries — `(min-width: 480px)` and
 * `(min-width: 1280px)` — never `window.innerWidth`. jsdom has no real
 * matchMedia (the global setup mock is a static matches:false stub), so each
 * test installs a width-driven mock that:
 *   - resolves `matches` from the parsed `min-width` against a settable width, and
 *   - records every `change` listener so we can (a) simulate band crossings and
 *     (b) assert subscribe-on-mount / cleanup-on-unmount.
 *
 * Coverage focus (high-value target, aim ~100%):
 *   - each band + exact threshold behaviour at 480 and 1280
 *   - referential stability of the returned object within a band (memoization)
 *   - listener lifecycle: subscribe on mount, update on `change`, remove on unmount
 *
 * No React Testing Library wrapper / providers needed — the hook has no context
 * dependency, so renderHook from @testing-library/react drives it directly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScheduleViewportConfig } from './useScheduleViewportConfig';

// ── Controllable, width-driven matchMedia mock ───────────────────────────────
// Mirrors the MediaQueryList surface the hook touches: `.matches`, and
// addEventListener/removeEventListener('change', …). Each created MQL parses its
// own `(min-width: Npx)` threshold and re-evaluates `.matches` against the shared
// `currentWidth`. `setViewportWidth` updates the width and fires `change` on every
// live listener (what a real browser does when the viewport crosses a breakpoint).

interface IMockMediaQueryList extends MediaQueryList {
  readonly _threshold: number;
}

let currentWidth = 1280;
let mqlRegistry: IMockMediaQueryList[] = [];
const removeSpies: ReturnType<typeof vi.fn>[] = [];

function parseMinWidth(query: string): number {
  const match = /min-width:\s*(\d+)px/.exec(query);
  // The hook only ever passes min-width queries; default keeps the mock honest.
  return match ? Number(match[1]) : 0;
}

function createMatchMedia(): (query: string) => MediaQueryList {
  return (query: string): MediaQueryList => {
    const threshold = parseMinWidth(query);
    const listeners = new Set<(ev: MediaQueryListEvent) => void>();
    const removeSpy = vi.fn();
    removeSpies.push(removeSpy);

    const mql: IMockMediaQueryList = {
      _threshold: threshold,
      get matches() {
        return currentWidth >= threshold;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, cb: EventListenerOrEventListenerObject) => {
        listeners.add(cb as (ev: MediaQueryListEvent) => void);
      },
      removeEventListener: (_type: string, cb: EventListenerOrEventListenerObject) => {
        listeners.delete(cb as (ev: MediaQueryListEvent) => void);
        removeSpy();
      },
      // Legacy API — present for shape parity; the hook does not use it.
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };

    // Stash the live listener set so the harness can fire change events.
    (mql as unknown as { _fire: () => void })._fire = () => {
      listeners.forEach((cb) => {
        cb({ matches: mql.matches, media: query } as MediaQueryListEvent);
      });
    };

    mqlRegistry.push(mql);
    return mql;
  };
}

/** Set the simulated viewport width and notify all live `change` listeners. */
function setViewportWidth(width: number): void {
  currentWidth = width;
  act(() => {
    mqlRegistry.forEach((mql) => {
      (mql as unknown as { _fire: () => void })._fire();
    });
  });
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  currentWidth = 1280;
  mqlRegistry = [];
  removeSpies.length = 0;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: createMatchMedia(),
  });
});

afterEach(() => {
  // Restore the global static mock so neighbouring suites see the original stub.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
  vi.clearAllMocks();
});

// ── Band resolution ──────────────────────────────────────────────────────────

describe('useScheduleViewportConfig — band resolution', () => {
  it('returns the compact config (48 / xs) below the sm breakpoint', () => {
    currentWidth = 320; // < 480
    const { result } = renderHook(() => useScheduleViewportConfig());
    expect(result.current).toEqual({ slotWidth: 48, density: 'xs' });
  });

  it('returns compact at 479px — one pixel below the sm threshold', () => {
    currentWidth = 479;
    const { result } = renderHook(() => useScheduleViewportConfig());
    expect(result.current).toEqual({ slotWidth: 48, density: 'xs' });
  });

  it('returns the tablet config (64 / sm) exactly at the sm threshold (480px)', () => {
    currentWidth = 480; // min-width:480px matches → tablet
    const { result } = renderHook(() => useScheduleViewportConfig());
    expect(result.current).toEqual({ slotWidth: 64, density: 'sm' });
  });

  it.each([768, 1024, 1180, 1279])(
    'returns the tablet config (64 / sm) at landscape-tablet width %ipx',
    (width) => {
      currentWidth = width;
      const { result } = renderHook(() => useScheduleViewportConfig());
      expect(result.current).toEqual({ slotWidth: 64, density: 'sm' });
    },
  );

  it('returns the wide config (96 / md) exactly at the xl threshold (1280px)', () => {
    currentWidth = 1280; // min-width:1280px matches → wide
    const { result } = renderHook(() => useScheduleViewportConfig());
    expect(result.current).toEqual({ slotWidth: 96, density: 'md' });
  });

  it.each([1280, 1440, 1920])(
    'returns the wide config (96 / md) at desktop width %ipx',
    (width) => {
      currentWidth = width;
      const { result } = renderHook(() => useScheduleViewportConfig());
      expect(result.current).toEqual({ slotWidth: 96, density: 'md' });
    },
  );

  it('subscribes via two min-width queries (480 and 1280) on mount', () => {
    currentWidth = 1024;
    renderHook(() => useScheduleViewportConfig());
    // Both the initial read and the effect create the same two MQLs; assert the
    // distinct thresholds the hook depends on are present.
    const thresholds = new Set(mqlRegistry.map((m) => m._threshold));
    expect(thresholds.has(480)).toBe(true);
    expect(thresholds.has(1280)).toBe(true);
  });
});

// ── Referential stability (preserves calendar Day-view memoization) ──────────

describe('useScheduleViewportConfig — referential stability', () => {
  it('returns the SAME object reference across a rerender that stays in the band', () => {
    currentWidth = 1024; // tablet
    const { result, rerender } = renderHook(() => useScheduleViewportConfig());
    const first = result.current;

    rerender();

    // useMemo([band]) → identity is preserved when the band does not change. This
    // is what keeps the memoized calendar Day view from re-rendering every frame.
    expect(result.current).toBe(first);
  });

  it('keeps the same reference after a width change that does NOT cross a band', () => {
    currentWidth = 768; // tablet
    const { result } = renderHook(() => useScheduleViewportConfig());
    const first = result.current;

    setViewportWidth(1100); // still tablet (480 ≤ w < 1280)

    expect(result.current).toBe(first);
  });

  it('returns a NEW reference (and value) when a width change crosses into another band', () => {
    currentWidth = 1024; // tablet
    const { result } = renderHook(() => useScheduleViewportConfig());
    const tabletConfig = result.current;
    expect(tabletConfig).toEqual({ slotWidth: 64, density: 'sm' });

    setViewportWidth(1440); // → wide

    expect(result.current).not.toBe(tabletConfig);
    expect(result.current).toEqual({ slotWidth: 96, density: 'md' });
  });
});

// ── Listener lifecycle ───────────────────────────────────────────────────────

describe('useScheduleViewportConfig — matchMedia listener lifecycle', () => {
  it('updates the returned config when the sm→xl boundary is crossed downward', () => {
    currentWidth = 1440; // wide
    const { result } = renderHook(() => useScheduleViewportConfig());
    expect(result.current).toEqual({ slotWidth: 96, density: 'md' });

    setViewportWidth(800); // wide → tablet
    expect(result.current).toEqual({ slotWidth: 64, density: 'sm' });

    setViewportWidth(360); // tablet → compact
    expect(result.current).toEqual({ slotWidth: 48, density: 'xs' });
  });

  it('removes both change listeners on unmount (no leak)', () => {
    currentWidth = 1024;
    const { unmount } = renderHook(() => useScheduleViewportConfig());

    // Nothing removed while mounted.
    const removedBefore = removeSpies.filter((s) => s.mock.calls.length > 0).length;
    expect(removedBefore).toBe(0);

    unmount();

    // The effect cleanup calls removeEventListener on BOTH the sm and xl MQLs.
    const removedAfter = removeSpies.filter((s) => s.mock.calls.length > 0).length;
    expect(removedAfter).toBe(2);
  });

  it('stops reacting to viewport changes after unmount', () => {
    currentWidth = 1024; // tablet
    const { result, unmount } = renderHook(() => useScheduleViewportConfig());
    const lastValue = result.current;

    unmount();
    setViewportWidth(1920); // would be 'wide' if still subscribed

    // The detached hook keeps its final value — no post-unmount state update.
    expect(result.current).toBe(lastValue);
    expect(result.current).toEqual({ slotWidth: 64, density: 'sm' });
  });
});
