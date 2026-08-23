/**
 * useThemeStore.test.ts
 *
 * Tests for the three exported selectors of useThemeStore:
 *   - useThemeActions  — wrapped with useShallow to stabilise object references
 *   - useIsDark        — primitive selector, re-renders only when isDark changes
 *   - useThemeMode     — primitive selector, re-renders only when mode changes
 *
 * The core regression being guarded is:
 *   useThemeActions WITHOUT useShallow returned a new object on every selector
 *   call → Zustand's Object.is comparison always failed → infinite re-render loop.
 *
 * Strategy for counting re-renders:
 *   renderHook returns a `result` whose current value updates on each render.
 *   We track calls to the hook body itself via a counter ref incremented inside
 *   a thin wrapper hook — giving us an exact render count.
 */

import { renderHook, act } from '@testing-library/react';
import { useThemeStore, useThemeActions, useIsDark, useThemeMode } from '@app/stores/useThemeStore';
import type { ThemeMode } from '@app/stores/useThemeStore';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Reset the Zustand store to a known baseline before each test.
 * Zustand stores are module singletons; state bleeds between tests without this.
 * Direct setState bypasses the persist middleware — no localStorage involvement needed.
 */
const resetStore = () => {
  useThemeStore.setState({
    mode: 'light',
    isDark: false,
  });
};

// ── useThemeActions ────────────────────────────────────────────────────────

describe('useThemeActions', () => {
  beforeEach(resetStore);

  it('returns toggleTheme and setTheme functions', () => {
    const { result } = renderHook(() => useThemeActions());

    expect(typeof result.current.toggleTheme).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
  });

  it('does NOT re-render on mount more than once', () => {
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useThemeActions();
    });

    expect(renderCount).toBe(1);
  });

  it('does NOT re-render when isDark changes in the store', () => {
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useThemeActions();
    });

    // Trigger a state change that modifies isDark and mode — useThemeActions
    // must NOT react to these because its selector only observes the action refs.
    act(() => {
      useThemeStore.setState({ mode: 'dark', isDark: true });
    });

    expect(renderCount).toBe(1);
  });

  it('does NOT re-render when mode changes in the store', () => {
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useThemeActions();
    });

    act(() => {
      useThemeStore.setState({ mode: 'system', isDark: false });
    });

    expect(renderCount).toBe(1);
  });
});

// ── toggleTheme ────────────────────────────────────────────────────────────

describe('useThemeActions — toggleTheme', () => {
  beforeEach(resetStore);

  it('toggles from light to dark after one call', () => {
    const { result } = renderHook(() => useThemeActions());

    act(() => {
      result.current.toggleTheme();
    });

    const { isDark, mode } = useThemeStore.getState();
    expect(isDark).toBe(true);
    expect(mode).toBe('dark');
  });

  it('causes exactly 1 re-render in a consumer that reads isDark', () => {
    // This component reads isDark — it SHOULD re-render once when toggleTheme fires.
    let isDarkRenderCount = 0;

    const { result: actionsResult } = renderHook(() => useThemeActions());

    renderHook(() => {
      isDarkRenderCount += 1;
      return useIsDark();
    });

    // Baseline after mount
    expect(isDarkRenderCount).toBe(1);

    act(() => {
      actionsResult.current.toggleTheme();
    });

    // Exactly one additional render — no cascade
    expect(isDarkRenderCount).toBe(2);
  });

  it('causes exactly 2 re-renders after two toggles (light → dark → light)', () => {
    let isDarkRenderCount = 0;

    const { result: actionsResult } = renderHook(() => useThemeActions());

    renderHook(() => {
      isDarkRenderCount += 1;
      return useIsDark();
    });

    // Baseline
    expect(isDarkRenderCount).toBe(1);

    act(() => {
      actionsResult.current.toggleTheme(); // → dark
    });
    act(() => {
      actionsResult.current.toggleTheme(); // → light
    });

    // 1 mount + 2 toggles = 3 total render calls, 2 additional renders — no cascade
    expect(isDarkRenderCount).toBe(3);
  });

  it('returns to light mode after two toggles (light → dark → light)', () => {
    const { result } = renderHook(() => useThemeActions());

    act(() => {
      result.current.toggleTheme();
    });
    act(() => {
      result.current.toggleTheme();
    });

    const { isDark, mode } = useThemeStore.getState();
    expect(isDark).toBe(false);
    expect(mode).toBe('light');
  });

  it('does NOT re-render the useThemeActions hook consumer after toggleTheme', () => {
    // The key regression guard: the actions hook must remain stable even after
    // the underlying state changes. useShallow keeps action refs stable.
    let actionsRenderCount = 0;

    const { result } = renderHook(() => {
      actionsRenderCount += 1;
      return useThemeActions();
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(actionsRenderCount).toBe(1);
  });
});

// ── setTheme ───────────────────────────────────────────────────────────────

describe('useThemeActions — setTheme', () => {
  beforeEach(resetStore);

  it('sets mode to dark and resolves isDark to true', () => {
    const { result } = renderHook(() => useThemeActions());

    act(() => {
      result.current.setTheme('dark');
    });

    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.isDark).toBe(true);
  });

  it('sets mode to light and resolves isDark to false', () => {
    const { result } = renderHook(() => useThemeActions());

    // Start from dark
    act(() => {
      useThemeStore.setState({ mode: 'dark', isDark: true });
    });

    act(() => {
      result.current.setTheme('light');
    });

    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.isDark).toBe(false);
  });

  it('sets mode to system and resolves isDark from window.matchMedia', () => {
    // jsdom does not implement matchMedia; it defaults to non-matching (false).
    const { result } = renderHook(() => useThemeActions());

    act(() => {
      result.current.setTheme('system');
    });

    const state = useThemeStore.getState();
    expect(state.mode).toBe('system');
    // In jsdom, matchMedia always returns false → isDark = false
    expect(state.isDark).toBe(false);
  });

  it('does NOT re-render the useThemeActions consumer after setTheme', () => {
    let actionsRenderCount = 0;

    const { result } = renderHook(() => {
      actionsRenderCount += 1;
      return useThemeActions();
    });

    act(() => {
      result.current.setTheme('dark');
    });
    act(() => {
      result.current.setTheme('light');
    });

    expect(actionsRenderCount).toBe(1);
  });

  it('accepts all valid ThemeMode values without TypeScript error', () => {
    const { result } = renderHook(() => useThemeActions());
    const modes: ThemeMode[] = ['light', 'dark', 'system'];

    modes.forEach((mode) => {
      act(() => {
        result.current.setTheme(mode);
      });
      expect(useThemeStore.getState().mode).toBe(mode);
    });
  });
});

// ── useIsDark ──────────────────────────────────────────────────────────────

describe('useIsDark', () => {
  beforeEach(resetStore);

  it('returns false when store is initialised to light mode', () => {
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(false);
  });

  it('returns true after store isDark is set to true', () => {
    const { result } = renderHook(() => useIsDark());

    act(() => {
      useThemeStore.setState({ mode: 'dark', isDark: true });
    });

    expect(result.current).toBe(true);
  });

  it('re-renders exactly once when isDark toggles', () => {
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useIsDark();
    });

    expect(renderCount).toBe(1);

    act(() => {
      useThemeStore.setState({ mode: 'dark', isDark: true });
    });

    expect(renderCount).toBe(2);
  });

  it('does NOT re-render when mode changes but isDark stays the same', () => {
    // Start dark, change mode from 'dark' to 'system' while keeping isDark true.
    act(() => {
      useThemeStore.setState({ mode: 'dark', isDark: true });
    });

    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useIsDark();
    });

    expect(renderCount).toBe(1);

    act(() => {
      // Mode changes but isDark remains true
      useThemeStore.setState({ mode: 'system', isDark: true });
    });

    expect(renderCount).toBe(1);
  });
});

// ── useThemeMode ───────────────────────────────────────────────────────────

describe('useThemeMode', () => {
  beforeEach(resetStore);

  it('returns "light" when store is initialised to light mode', () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current).toBe('light');
  });

  it('returns "dark" after setTheme("dark")', () => {
    const { result: actions } = renderHook(() => useThemeActions());
    const { result: mode } = renderHook(() => useThemeMode());

    act(() => {
      actions.current.setTheme('dark');
    });

    expect(mode.current).toBe('dark');
  });

  it('returns "system" after setTheme("system")', () => {
    const { result: actions } = renderHook(() => useThemeActions());
    const { result: mode } = renderHook(() => useThemeMode());

    act(() => {
      actions.current.setTheme('system');
    });

    expect(mode.current).toBe('system');
  });

  it('re-renders exactly once when mode changes', () => {
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useThemeMode();
    });

    expect(renderCount).toBe(1);

    act(() => {
      useThemeStore.setState({ mode: 'dark', isDark: true });
    });

    expect(renderCount).toBe(2);
  });

  it('does NOT re-render when only isDark changes but mode stays the same', () => {
    // This can happen if isDark is externally set to true while mode remains 'light'
    // (edge case, but the selector contract must hold).
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useThemeMode();
    });

    expect(renderCount).toBe(1);

    act(() => {
      // isDark flips but mode stays 'light'
      useThemeStore.setState({ isDark: true });
    });

    expect(renderCount).toBe(1);
  });
});
