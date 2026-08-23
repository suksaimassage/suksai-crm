/**
 * tokens/color.ts — Semantic color tokens
 *
 * These are *intent-level* tokens — they describe the role a color plays,
 * not the raw palette stop. Components always consume semantic tokens, never
 * raw palette values directly.
 *
 * Exports:
 *   accentLight        — brand accents (mode-independent)
 *   backgroundLight    — surface colors for light mode
 *   backgroundDark     — surface colors for dark mode
 *   textLight          — text colors for light mode
 *   textDark           — text colors for dark mode
 *   intentLight        — feedback-intent colors for light mode
 *   intentDark         — feedback-intent colors for dark mode (one stop lighter)
 *   gradientLight      — gradient presets for light mode
 *   overlayLight       — overlay/scrim values for light mode
 *   overlayDark        — overlay/scrim values for dark mode
 *   scrollbarLight     — scrollbar thumb/track for light mode
 *   scrollbarDark      — scrollbar thumb/track for dark mode
 *
 * All values use OKLCH (CSS Color Level 4). Hex in comments only.
 */

// ── Accent (mode-independent brand tokens) ───────────────────────────────────

export const accentLight = {
  primary: 'oklch(0.76 0.07 67)', // primary.400
  secondary: 'oklch(0.76 0.14 79)', // secondary.500
  tertiary: 'oklch(0.56 0.28 332)', // tertiary.500
} as const;

// ── Backgrounds ──────────────────────────────────────────────────────────────

export const backgroundLight = {
  light: 'oklch(0.98 0.01 67)', // neutralWarm.50 — page bg
  neutral: 'oklch(0.94 0.01 67)', // neutralWarm.100 — section dividers
  dark: 'oklch(0.22 0.01 67)', // neutralWarm.900 — contrast surface
  card: 'oklch(1 0.01 0 / 1)', // above page bg — card surface
  elevated: 'oklch(1 0.01 0)', // same as card — elevation via shadow in light mode
  overlay: 'oklch(0.11 0.03 204 / 0.60)', // neutralDark.900 @ 60% — modal scrim
  sidebar: 'oklch(0.16 0.03 204)', // neutralDark.800 — always dark
  tooltip: 'oklch(0.23 0.04 204)', // neutralDark.700
  badge: 'oklch(0.56 0.28 332)', // tertiary.500 — live badge
} as const;

export const backgroundDark = {
  light: 'oklch(0.16 0.03 204)', // neutralDark.800 — page bg
  neutral: 'oklch(0.23 0.04 204)', // neutralDark.700 — section dividers
  dark: 'oklch(0.11 0.03 204)', // neutralDark.900 — deepest bg
  card: 'oklch(0.23 0.04 204)', // neutralDark.700 — card surface
  elevated: 'oklch(0.32 0.05 204)', // neutralDark.600 — modal/drawer surface above card
  overlay: 'oklch(0.08 0.02 204 / 0.75)', // near-black teal @ 75%
  sidebar: 'oklch(0.11 0.03 204)', // neutralDark.900 — always dark
  tooltip: 'oklch(0.32 0.05 204)', // neutralDark.600
  badge: 'oklch(0.56 0.28 332)', // tertiary.500 — unchanged
} as const;

// ── Text ─────────────────────────────────────────────────────────────────────

export const textLight = {
  primary: 'oklch(0.11 0.03 204)', // neutralDark.900 — 14.8:1 AAA
  secondary: 'oklch(0.32 0.05 204)', // neutralDark.600 — 7.4:1 AAA
  tertiary: 'oklch(0.52 0.03 67)', // neutralWarm.600
  neutral: 'oklch(0.52 0.03 67)', // neutralWarm.600
  muted: 'oklch(0.43 0.05 204)', // neutralDark.500 — 4.7:1 AA
  inverse: 'oklch(0.97 0.01 67)', // neutralWarm.50 — on dark surfaces
  link: 'oklch(0.50 0.15 252)', // info.500 — 4.6:1 AA
  linkHover: 'oklch(0.42 0.14 252)', // info.600 — 6.2:1 AA
  success: 'oklch(0.49 0.12 132)', // success.600
  info: 'oklch(0.42 0.14 252)', // info.600
  warning: 'oklch(0.55 0.16 56)', // warning.600
  error: 'oklch(0.41 0.18 24)', // error.600
  disabled: 'oklch(0.62 0.03 67)', // neutralWarm.500
  placeholder: 'oklch(0.72 0.03 67)', // neutralWarm.400
} as const;

export const textDark = {
  primary: 'oklch(0.97 0.01 67)', // neutralWarm.50 — 14.2:1 AAA
  secondary: 'oklch(0.89 0.02 67)', // neutralWarm.200 — 9.1:1 AAA
  tertiary: 'oklch(0.72 0.03 67)', // neutralWarm.400
  neutral: 'oklch(0.62 0.03 67)', // neutralWarm.500
  muted: 'oklch(0.72 0.03 67)', // neutralWarm.400 — 4.6:1 AA
  inverse: 'oklch(0.16 0.03 204)', // neutralDark.800
  link: 'oklch(0.73 0.11 252)', // info.300 — 4.8:1 AA
  linkHover: 'oklch(0.85 0.08 252)', // info.200 — 7.2:1 AA
  success: 'oklch(0.76 0.10 132)', // success.300 — one stop lighter
  info: 'oklch(0.73 0.11 252)', // info.300 — one stop lighter
  warning: 'oklch(0.84 0.13 56)', // warning.300 — one stop lighter
  error: 'oklch(0.74 0.15 24)', // error.300 — one stop lighter
  disabled: 'oklch(0.43 0.05 204)', // neutralDark.500
  placeholder: 'oklch(0.56 0.05 204)', // neutralDark.400
} as const;

// ── Intent ───────────────────────────────────────────────────────────────────

export const intentLight = {
  primary: 'oklch(0.76 0.07 67)', // primary.400
  primaryHover: 'oklch(0.68 0.08 67)', // primary.400 one stop darker — button hover
  focusRing: 'oklch(0.59 0.08 67)', // primary.600 — WCAG 2.2 AA (1.4.11) focus ring, ≥3.5:1 on light surfaces
  secondary: 'oklch(0.76 0.14 79)', // secondary.500
  tertiary: 'oklch(0.56 0.28 332)', // tertiary.500
  success: 'oklch(0.58 0.13 132)', // success.500
  error: 'oklch(0.51 0.22 24)', // error.500
  errorSubtle: 'oklch(0.51 0.22 24 / 0.30)', // error.500 @ 30% — inline error border
  errorZone: 'oklch(0.97 0.01 24)', // error.50 — very light error tint for zone backgrounds
  successZone: 'oklch(0.96 0.02 132)', // success.50 — very light sage zone bg
  warningZone: 'oklch(0.97 0.02 56)', // warning.50 — very light amber zone bg
  infoZone: 'oklch(0.96 0.02 252)', // info.50 — very light blue zone bg
  warning: 'oklch(0.73 0.16 56)', // warning.400
  info: 'oklch(0.50 0.15 252)', // info.500
} as const;

export const intentDark = {
  primary: 'oklch(0.84 0.06 67)', // primary.300 — one stop lighter
  primaryHover: 'oklch(0.76 0.07 67)', // same as primary.400 in dark mode (inverse logic)
  focusRing: 'oklch(0.84 0.06 67)', // primary.300 — WCAG 2.2 AA (1.4.11) focus ring, ≥7.5:1 on dark surfaces
  secondary: 'oklch(0.84 0.11 79)', // secondary.300
  tertiary: 'oklch(0.76 0.17 332)', // tertiary.300
  success: 'oklch(0.76 0.10 132)', // success.300
  error: 'oklch(0.74 0.15 24)', // error.300
  errorSubtle: 'oklch(0.74 0.15 24 / 0.30)', // error.300 @ 30% — inline error border
  errorZone: 'oklch(0.20 0.03 24)', // dark error tint zone background
  successZone: 'oklch(0.17 0.04 132)', // dark sage tint zone bg
  warningZone: 'oklch(0.18 0.05 56)', // dark amber tint zone bg
  infoZone: 'oklch(0.16 0.05 252)', // dark navy tint zone bg
  warning: 'oklch(0.84 0.13 56)', // warning.300
  info: 'oklch(0.73 0.11 252)', // info.300
} as const;

// ── Gradients (light only — dark uses same values) ───────────────────────────

export const gradientLight = {
  primary: 'linear-gradient(135deg, oklch(0.76 0.07 67) 0%, oklch(0.76 0.14 79) 100%)',
  secondary: 'linear-gradient(135deg, oklch(0.76 0.14 79) 0%, oklch(0.73 0.16 56) 100%)',
  tertiary: 'linear-gradient(135deg, oklch(0.56 0.28 332) 0%, oklch(0.65 0.23 332) 100%)',
  neutral: 'linear-gradient(180deg, oklch(0.97 0.01 67) 0%, oklch(0.94 0.01 67) 100%)',
  success: 'linear-gradient(135deg, oklch(0.58 0.13 132) 0%, oklch(0.68 0.12 132) 100%)',
  error: 'linear-gradient(135deg, oklch(0.51 0.22 24) 0%, oklch(0.61 0.18 24) 100%)',
  warning: 'linear-gradient(135deg, oklch(0.73 0.16 56) 0%, oklch(0.84 0.13 56) 100%)',
  info: 'linear-gradient(135deg, oklch(0.50 0.15 252) 0%, oklch(0.63 0.15 252) 100%)',
  background: 'linear-gradient(180deg, oklch(0.97 0.01 67) 0%, oklch(0.94 0.01 67) 100%)',
} as const;

// ── Overlays ─────────────────────────────────────────────────────────────────

export const overlayLight = {
  light: 'oklch(0.97 0.01 67 / 0.80)',
  dark: 'oklch(0.11 0.03 204 / 0.80)',
  primary: 'oklch(0.76 0.07 67 / 0.10)',
  secondary: 'oklch(0.76 0.14 79 / 0.10)',
} as const;

export const overlayDark = {
  light: 'oklch(0.16 0.03 204 / 0.85)',
  dark: 'oklch(0.08 0.02 204 / 0.75)',
  primary: 'oklch(0.76 0.07 67 / 0.15)',
  secondary: 'oklch(0.76 0.14 79 / 0.12)',
} as const;

// ── Scrollbar ────────────────────────────────────────────────────────────────

export const scrollbarLight = {
  scrollbarThumb: 'oklch(0.82 0.02 67)', // neutral.300
  scrollbarThumbHover: 'oklch(0.94 0.01 67)', // neutral.100
} as const;

export const scrollbarDark = {
  scrollbarThumb: 'oklch(0.97 0.01 67 / 0.10)',
  scrollbarThumbHover: 'oklch(0.97 0.01 67 / 0.06)',
} as const;

// ── Brand Agenda palette (Suksai calendar UI) ────────────────────────────────

export const brandAgenda = {
  gold: {
    50: 'oklch(0.97 0.02 75)',
    100: 'oklch(0.94 0.04 75)',
    300: 'oklch(0.84 0.08 75)',
    400: 'oklch(0.74 0.10 75)',
    700: 'oklch(0.44 0.08 75)',
    bg: 'oklch(0.74 0.10 75 / 0.12)',
    bgHero: 'oklch(0.74 0.10 75 / 0.22)',
    bgNow: 'oklch(0.97 0.025 75)',
    border: 'oklch(0.74 0.10 75 / 0.40)',
    pendingBorder: 'oklch(0.74 0.10 75 / 0.60)',
    glow: 'oklch(0.74 0.10 75 / 0.10)',
    subText: 'oklch(0.84 0.08 75 / 0.80)',
  },
  jungle: {
    700: 'oklch(0.25 0.03 143)',
    900: 'oklch(0.15 0.022 143)',
    bg: 'oklch(0.25 0.03 143 / 0.10)',
    border: 'oklch(0.25 0.03 143 / 0.35)',
  },
  clay: {
    500: 'oklch(0.62 0.12 40)',
    600: 'oklch(0.50 0.10 40)',
    bg: 'oklch(0.62 0.12 40 / 0.10)',
    border: 'oklch(0.62 0.12 40 / 0.32)',
    tint: 'oklch(0.62 0.12 40 / 0.12)',
  },
  lotus: {
    bg: 'oklch(0.56 0.18 332 / 0.12)',
    border: 'oklch(0.56 0.18 332 / 0.30)',
    text: 'oklch(0.40 0.14 332)',
  },
  ink: {
    500: 'oklch(0.54 0.03 67)',
    700: 'oklch(0.33 0.02 67)',
    900: 'oklch(0.12 0.01 67)',
  },
  agenda: {
    gridLine: 'oklch(0.89 0.02 67 / 0.6)', // calendar slot divider at 60% opacity
    nowTrackBg: 'oklch(0.97 0.02 75 / 0.35)', // today-column background tint
    // Non-bookable block hatch — coarse 45° stripe, distinct from the pending
    // 135° fine stripe (Designer §4.2). Composed from existing warm neutrals.
    blockHatchA: 'oklch(0.89 0.02 67 / 0.55)', // stripe ink (neutralWarm[200]-equivalent)
    blockHatchB: 'oklch(0.98 0.01 67)', // gap (background.light-equivalent)
  },
  /** Round-robin color slots for therapist identity in week view (a–f) */
  therapistAccent: {
    a: 'oklch(0.55 0.15 204)', // teal
    aBg: 'oklch(0.55 0.15 204 / 0.13)',
    b: 'oklch(0.55 0.16 332)', // mauve / lotus
    bBg: 'oklch(0.55 0.16 332 / 0.13)',
    c: 'oklch(0.58 0.14 40)', // clay / terracotta
    cBg: 'oklch(0.58 0.14 40 / 0.13)',
    d: 'oklch(0.52 0.10 143)', // jungle green
    dBg: 'oklch(0.52 0.10 143 / 0.13)',
    e: 'oklch(0.62 0.13 75)', // gold / amber
    eBg: 'oklch(0.62 0.13 75 / 0.13)',
    f: 'oklch(0.52 0.12 270)', // violet
    fBg: 'oklch(0.52 0.12 270 / 0.13)',
  },
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type AccentToken = typeof accentLight;
export type BackgroundLightToken = typeof backgroundLight;
export type BackgroundDarkToken = typeof backgroundDark;
export type TextLightToken = typeof textLight;
export type TextDarkToken = typeof textDark;
export type IntentLightToken = typeof intentLight;
export type IntentDarkToken = typeof intentDark;
export type TIntentColorKey = keyof typeof intentLight;
export type GradientToken = typeof gradientLight;
export type OverlayLightToken = typeof overlayLight;
export type OverlayDarkToken = typeof overlayDark;
export type ScrollbarToken = typeof scrollbarLight;
