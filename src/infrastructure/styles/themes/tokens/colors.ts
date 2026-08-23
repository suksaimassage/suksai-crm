/**
 * tokens/colors.ts — Color design tokens (OKLCH)
 *
 * SRP: defines raw color values only.
 *      Semantic meaning is applied in light/dark theme files.
 *
 * All values use OKLCH color space (CSS Color Level 4).
 * Hex values are provided as comments only — OKLCH is authoritative.
 *
 * Naming: palette name + shade (50 lightest → 900 darkest)
 */

// ── Brand palettes ─────────────────────────────────────────────────────────

export const primary = {
  50: 'oklch(0.98 0.01 67)', // #fdf9f4
  100: 'oklch(0.95 0.02 67)', // #f6ede0
  200: 'oklch(0.90 0.04 67)', // #eedcca
  300: 'oklch(0.84 0.06 67)', // #e3c8ac
  400: 'oklch(0.76 0.07 67)', // #d4aa7d — base
  500: 'oklch(0.68 0.08 67)', // #c0915a
  600: 'oklch(0.59 0.08 67)', // #a67343
  700: 'oklch(0.49 0.07 67)', // #875730
  800: 'oklch(0.38 0.06 67)', // #653d1e
  900: 'oklch(0.26 0.04 67)', // #3f2410
} as const;

export const secondary = {
  50: 'oklch(0.98 0.02 79)', // #fdfaee
  100: 'oklch(0.95 0.04 79)', // #f7f0cc
  200: 'oklch(0.90 0.07 79)', // #ede39a
  300: 'oklch(0.84 0.11 79)', // #ded470
  400: 'oklch(0.79 0.13 79)', // #d4c44d
  500: 'oklch(0.76 0.14 79)', // #d4af37 — base
  600: 'oklch(0.65 0.13 79)', // #b0932a
  700: 'oklch(0.54 0.11 79)', // #8f7520
  800: 'oklch(0.42 0.09 79)', // #6a5616
  900: 'oklch(0.30 0.06 79)', // #45380d
} as const;

export const tertiary = {
  50: 'oklch(0.97 0.03 332)', // #fdeef8
  100: 'oklch(0.93 0.06 332)', // #fad5ef
  200: 'oklch(0.86 0.11 332)', // #f5aad9
  300: 'oklch(0.76 0.17 332)', // #ee79c2
  400: 'oklch(0.65 0.23 332)', // #e244ad
  500: 'oklch(0.56 0.28 332)', // #e817a9 — base
  600: 'oklch(0.47 0.25 332)', // #bc128a
  700: 'oklch(0.38 0.20 332)', // #920e6b
  800: 'oklch(0.29 0.15 332)', // #680950
  900: 'oklch(0.20 0.09 332)', // #3e0530
} as const;

// ── Neutral (warm cream) ── backward-compat alias = neutralWarm ────────────

export const neutral = {
  50: 'oklch(0.97 0.01 67)', // #faf5f0
  100: 'oklch(0.94 0.01 67)', // #f2ebe2
  200: 'oklch(0.89 0.02 67)', // #e5d9cc
  300: 'oklch(0.82 0.02 67)', // #d3c3b3
  400: 'oklch(0.72 0.03 67)', // #baa899
  500: 'oklch(0.62 0.03 67)', // #9c8c7e
  600: 'oklch(0.52 0.03 67)', // #7e6e63
  700: 'oklch(0.42 0.02 67)', // #60524a
  800: 'oklch(0.32 0.02 67)', // #433832
  900: 'oklch(0.22 0.01 67)', // #28201c
} as const;

// ── Semantic palettes ──────────────────────────────────────────────────────

export const success = {
  50: 'oklch(0.97 0.02 132)', // #f2faea
  100: 'oklch(0.93 0.04 132)', // #e3f5d0
  200: 'oklch(0.86 0.07 132)', // #c8eba5
  300: 'oklch(0.76 0.10 132)', // #a4db72
  400: 'oklch(0.68 0.12 132)', // #84c952
  500: 'oklch(0.58 0.13 132)', // #679436 — base
  600: 'oklch(0.49 0.12 132)', // #527a2a
  700: 'oklch(0.39 0.10 132)', // #3e6020
  800: 'oklch(0.28 0.07 132)', // #2a4415
  900: 'oklch(0.18 0.04 132)', // #19290c
} as const;

export const info = {
  50: 'oklch(0.97 0.02 252)', // #eef4fc
  100: 'oklch(0.93 0.05 252)', // #d5e7f8
  200: 'oklch(0.86 0.09 252)', // #aecff2
  300: 'oklch(0.73 0.11 252)', // #7fafe2
  400: 'oklch(0.63 0.15 252)', // #4f8dd2
  500: 'oklch(0.50 0.15 252)', // #1e73be — base
  600: 'oklch(0.42 0.14 252)', // #185da0
  700: 'oklch(0.33 0.12 252)', // #11477e
  800: 'oklch(0.24 0.08 252)', // #0b2f56
  900: 'oklch(0.15 0.05 252)', // #061a33
} as const;

export const warning = {
  50: 'oklch(0.98 0.02 56)', // #fef8ee
  100: 'oklch(0.95 0.05 56)', // #fdedd0
  200: 'oklch(0.90 0.09 56)', // #fad8a0
  300: 'oklch(0.84 0.13 56)', // #f7c06a
  400: 'oklch(0.73 0.16 56)', // #f3950c — base
  500: 'oklch(0.65 0.17 56)', // #d47a08
  600: 'oklch(0.55 0.16 56)', // #b06105
  700: 'oklch(0.44 0.14 56)', // #8a4a03
  800: 'oklch(0.32 0.10 56)', // #623301
  900: 'oklch(0.21 0.07 56)', // #3d1e00
} as const;

export const error = {
  50: 'oklch(0.97 0.02 24)', // #fef4f2
  100: 'oklch(0.93 0.05 24)', // #fde0da
  200: 'oklch(0.86 0.10 24)', // #f9bfb4
  300: 'oklch(0.74 0.15 24)', // #f09082
  400: 'oklch(0.61 0.18 24)', // #e0604e
  500: 'oklch(0.51 0.22 24)', // #c43520
  600: 'oklch(0.41 0.18 24)', // #9e2815
  700: 'oklch(0.31 0.14 24)', // #75160d
  800: 'oklch(0.22 0.10 24)', // #510c07
  900: 'oklch(0.18 0.07 24)', // #360a00 — base (very dark maroon)
} as const;

// ── Extended neutral palettes ──────────────────────────────────────────────

// Explicit warm-cream alias — same as neutral for backward compatibility
export const neutralWarm = {
  50: 'oklch(0.97 0.01 67)', // #faf5f0
  100: 'oklch(0.94 0.01 67)', // #f2ebe2
  200: 'oklch(0.89 0.02 67)', // #e5d9cc
  300: 'oklch(0.82 0.02 67)', // #d3c3b3
  400: 'oklch(0.72 0.03 67)', // #baa899
  500: 'oklch(0.62 0.03 67)', // #9c8c7e
  600: 'oklch(0.52 0.03 67)', // #7e6e63
  700: 'oklch(0.42 0.02 67)', // #60524a
  800: 'oklch(0.32 0.02 67)', // #433832
  900: 'oklch(0.22 0.01 67)', // #28201c
} as const;

// Deep teal-dark — dark mode background scale (base at 900 = #052026)
export const neutralDark = {
  50: 'oklch(0.97 0.01 204)', // #eef5f6
  100: 'oklch(0.92 0.02 204)', // #d6e8ea
  200: 'oklch(0.83 0.03 204)', // #b3d0d4
  300: 'oklch(0.70 0.04 204)', // #84afb5
  400: 'oklch(0.56 0.05 204)', // #558b93
  500: 'oklch(0.43 0.05 204)', // #376b73
  600: 'oklch(0.32 0.05 204)', // #244f56
  700: 'oklch(0.23 0.04 204)', // #163840
  800: 'oklch(0.16 0.03 204)', // #0c272e
  900: 'oklch(0.11 0.03 204)', // #052026 — base
} as const;

// ── Token type helpers ─────────────────────────────────────────────────────
export type ColorScale = typeof primary;
export type ColorShade = keyof ColorScale;
export type NeutralWarmScale = typeof neutralWarm;
export type NeutralDarkScale = typeof neutralDark;
