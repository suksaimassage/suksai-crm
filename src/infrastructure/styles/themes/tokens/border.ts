/**
 * tokens/border.ts — Border design tokens
 *
 * Exports:
 *   borderWidth       — stroke thickness scale
 *   borderColorLight  — per-palette color stops (light mode)
 *   borderColorDark   — neutral override for dark mode
 *   borderStyle       — solid / dashed / dotted
 *   borderRadius      — corner-radius scale
 *
 * All color values use OKLCH (CSS Color Level 4).
 * Hex values appear in comments only.
 */

// ── Width ───────────────────────────────────────────────────────────────────

export const borderWidth = {
  none: '0',
  xs: '1px',
  sm: '2px',
  md: '3px',
  lg: '4px',
  xl: '6px',
} as const;

// ── Color — light mode ───────────────────────────────────────────────────────

export const borderColorLight = {
  primary: {
    subtle: 'oklch(0.95 0.02 67)', // primary.100
    light: 'oklch(0.90 0.04 67)', // primary.200
    medium: 'oklch(0.84 0.06 67)', // primary.300
    strong: 'oklch(0.76 0.07 67)', // primary.400
    dark: 'oklch(0.49 0.07 67)', // primary.700
    divider: 'oklch(0.95 0.02 67)', // primary.100
  },
  secondary: {
    subtle: 'oklch(0.95 0.04 79)', // secondary.100
    light: 'oklch(0.90 0.07 79)', // secondary.200
    medium: 'oklch(0.84 0.11 79)', // secondary.300
    strong: 'oklch(0.76 0.14 79)', // secondary.500
    dark: 'oklch(0.54 0.11 79)', // secondary.700
    divider: 'oklch(0.95 0.04 79)', // secondary.100
  },
  tertiary: {
    subtle: 'oklch(0.93 0.06 332)', // tertiary.100
    light: 'oklch(0.86 0.11 332)', // tertiary.200
    medium: 'oklch(0.76 0.17 332)', // tertiary.300
    strong: 'oklch(0.56 0.28 332)', // tertiary.500
    dark: 'oklch(0.38 0.20 332)', // tertiary.700
    divider: 'oklch(0.93 0.06 332)', // tertiary.100
  },
  neutral: {
    inverse: 'oklch(0.94 0.01 67 / 0.20)',
    subtle: 'oklch(0.94 0.01 67)', // neutral.100
    light: 'oklch(0.89 0.02 67)', // neutral.200
    medium: 'oklch(0.82 0.02 67)', // neutral.300
    strong: 'oklch(0.62 0.03 67)', // neutral.500
    dark: 'oklch(0.52 0.03 67)', // neutral.600
    divider: 'oklch(0.94 0.01 67)', // neutral.100
  },
  neutralWarm: {
    inverse: 'oklch(0.94 0.01 67 / 0.20)',
    subtle: 'oklch(0.94 0.01 67)', // neutral.100
    light: 'oklch(0.89 0.02 67)', // neutral.200
    medium: 'oklch(0.82 0.02 67)', // neutral.300
    strong: 'oklch(0.62 0.03 67)', // neutral.500
    dark: 'oklch(0.52 0.03 67)', // neutral.600
    divider: 'oklch(0.94 0.01 67)', // neutral.100
  },
  neutralDark: {
    inverse: 'oklch(0.94 0.01 67 / 0.20)',
    subtle: 'oklch(0.94 0.01 67)', // neutral.100
    light: 'oklch(0.89 0.02 67)', // neutral.200
    medium: 'oklch(0.82 0.02 67)', // neutral.300
    strong: 'oklch(0.62 0.03 67)', // neutral.500
    dark: 'oklch(0.52 0.03 67)', // neutral.600
    divider: 'oklch(0.94 0.01 67)', // neutral.100
  },
  success: {
    subtle: 'oklch(0.93 0.04 132)', // success.100
    light: 'oklch(0.86 0.07 132)', // success.200
    medium: 'oklch(0.76 0.10 132)', // success.300
    strong: 'oklch(0.58 0.13 132)', // success.500
    dark: 'oklch(0.39 0.10 132)', // success.700
    divider: 'oklch(0.93 0.04 132)', // success.100
  },
  info: {
    subtle: 'oklch(0.93 0.05 252)', // info.100
    light: 'oklch(0.86 0.09 252)', // info.200
    medium: 'oklch(0.73 0.11 252)', // info.300
    strong: 'oklch(0.50 0.15 252)', // info.500
    dark: 'oklch(0.33 0.12 252)', // info.700
    divider: 'oklch(0.93 0.05 252)', // info.100
  },
  warning: {
    subtle: 'oklch(0.95 0.05 56)', // warning.100
    light: 'oklch(0.90 0.09 56)', // warning.200
    medium: 'oklch(0.84 0.13 56)', // warning.300
    strong: 'oklch(0.73 0.16 56)', // warning.400
    dark: 'oklch(0.44 0.14 56)', // warning.700
    divider: 'oklch(0.95 0.05 56)', // warning.100
  },
  error: {
    subtle: 'oklch(0.93 0.05 24)', // error.100
    light: 'oklch(0.86 0.10 24)', // error.200
    medium: 'oklch(0.74 0.15 24)', // error.300
    strong: 'oklch(0.51 0.22 24)', // error.500
    dark: 'oklch(0.31 0.14 24)', // error.700
    divider: 'oklch(0.93 0.05 24)', // error.100
  },
} as const;

// ── Color — dark mode neutral override ──────────────────────────────────────

export const borderColorNeutralDark = {
  inverse: 'oklch(0.89 0.02 67)', // neutralWarm.200
  subtle: 'oklch(0.23 0.04 204)', // neutralDark.700
  light: 'oklch(0.32 0.05 204)', // neutralDark.600
  medium: 'oklch(0.43 0.05 204)', // neutralDark.500
  strong: 'oklch(0.56 0.05 204)', // neutralDark.400
  dark: 'oklch(0.70 0.04 204)', // neutralDark.300
  divider: 'oklch(0.23 0.04 204)', // neutralDark.700
} as const;

// ── Style ────────────────────────────────────────────────────────────────────

export const borderStyle = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
} as const;

// ── Radius ───────────────────────────────────────────────────────────────────

export const borderRadius = {
  none: '0',
  xs: '4px', // chips, badges
  sm: '6px', // icon buttons, inputs
  md: '8px', // buttons, cards
  lg: '12px', // cards, modals
  xl: '16px', // hero cards
  '2xl': '20px', // large containers
  '3xl': '24px', // feature sections
  full: '9999px', // pills, avatars
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type BorderWidthToken = typeof borderWidth;
export type BorderColorLightToken = typeof borderColorLight;
export type BorderColorNeutralDark = typeof borderColorNeutralDark;
export type BorderStyleToken = typeof borderStyle;
export type BorderRadiusToken = typeof borderRadius;
export type BorderWidthKey = keyof BorderWidthToken;
export type BorderRadiusKey = keyof BorderRadiusToken;
