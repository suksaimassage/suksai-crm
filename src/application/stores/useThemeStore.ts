/**
 * application/stores/useThemeStore.ts — Theme state
 *
 * Application layer: owns the business decision of which theme is active.
 *
 * Features:
 *   - Persisted to localStorage (survives page refresh)
 *   - System preference detection on first visit
 *   - Zero-cost subscribers via Zustand selectors
 *   - React 19 Compiler compatible (no manual memoization)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// ── Theme mode type ────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';

// ── Store shape ────────────────────────────────────────────────────────────
interface ThemeState {
  // The explicit user preference ('system' means follow OS)
  mode: ThemeMode;

  // Resolved boolean — what is ACTUALLY rendered right now
  isDark: boolean;

  // Actions
  readonly toggleTheme: () => void;
  readonly setTheme: (mode: ThemeMode) => void;
}

// ── System preference helper ───────────────────────────────────────────────
const getSystemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') return getSystemPrefersDark();
  return mode === 'dark';
};

// ── Store ──────────────────────────────────────────────────────────────────
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: getSystemPrefersDark(), // resolved at boot from OS

      toggleTheme: () => {
        const next: ThemeMode = get().isDark ? 'light' : 'dark';
        set({ mode: next, isDark: resolveIsDark(next) });
      },

      setTheme: (mode: ThemeMode) => {
        set({ mode, isDark: resolveIsDark(mode) });
      },
    }),
    {
      name: 'app_theme', // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Only persist the explicit user choice, not the resolved value.
      // isDark is re-derived on hydration (handles OS changes between sessions).
      partialize: (state) => ({ mode: state.mode }),

      // After rehydration, re-derive isDark from the persisted mode
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDark = resolveIsDark(state.mode);
        }
      },
    },
  ),
);

// ── Granular selectors (prevent unnecessary re-renders) ───────────────────
// Use these instead of destructuring the full store in components.

/** Returns current resolved dark state — re-renders only when isDark changes */
export const useIsDark = () => useThemeStore((s) => s.isDark);

/** Returns the explicit theme mode */
export const useThemeMode = () => useThemeStore((s) => s.mode);

/** Returns only actions — never triggers re-renders */
export const useThemeActions = () =>
  useThemeStore(
    useShallow((s) => ({
      toggleTheme: s.toggleTheme,
      setTheme: s.setTheme,
    })),
  );
