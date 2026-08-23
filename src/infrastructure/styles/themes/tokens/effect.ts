/**
 * tokens/effect.ts — Visual effect tokens
 *
 * Exports:
 *   shadowInner        — inset shadows (light mode)
 *   shadowInnerDark    — inset shadows (dark mode, opacity × 0.70)
 *   shadowOuter        — drop shadows (light mode)
 *   shadowOuterDark    — drop shadows (dark mode)
 *   shadowPrimary      — brand-tinted drop shadows
 *   shadowSecondary    — secondary brand drop shadows
 *   shadowSuccess      — success-tinted drop shadows
 *   shadowError        — error-tinted drop shadows
 *   blur               — backdrop-blur scale
 *   glowPrimary        — primary glow effects
 *   glowSecondary      — secondary glow effects
 *   skeleton           — skeleton loading animation tokens
 *   elevationLight     — named elevation presets (light)
 *   elevationDark      — named elevation presets (dark)
 *   easing             — motion easing helpers (not the same as transition.ts)
 *
 * Shadow base colors:
 *   light mode → oklch(0.11 0.03 204) deep teal-dark
 *   dark mode  → oklch(0.08 0.02 204) near-black teal, opacity × 0.70
 *
 * All values use OKLCH (CSS Color Level 4). Hex in comments only.
 */

// ── Inner shadows ─────────────────────────────────────────────────────────────

export const shadowInner = {
  xs: 'inset 0 1px 2px 0 oklch(0.11 0.03 204 / 0.05)',
  sm: 'inset 0 2px 4px 0 oklch(0.11 0.03 204 / 0.08)',
  md: 'inset 0 4px 8px -2px oklch(0.11 0.03 204 / 0.10)',
  lg: 'inset 0 8px 16px -4px oklch(0.11 0.03 204 / 0.12)',
  xl: 'inset 0 12px 24px -6px oklch(0.11 0.03 204 / 0.15)',
} as const;

export const shadowInnerDark = {
  xs: 'inset 0 1px 2px 0 oklch(0.08 0.02 204 / 0.04)',
  sm: 'inset 0 2px 4px 0 oklch(0.08 0.02 204 / 0.06)',
  md: 'inset 0 4px 8px -2px oklch(0.08 0.02 204 / 0.07)',
  lg: 'inset 0 8px 16px -4px oklch(0.08 0.02 204 / 0.08)',
  xl: 'inset 0 12px 24px -6px oklch(0.08 0.02 204 / 0.10)',
} as const;

// ── Outer shadows ─────────────────────────────────────────────────────────────

export const shadowOuter = {
  xs: '0 1px 2px 0 oklch(0.11 0.03 204 / 0.05)',
  sm: '0 2px 4px 0 oklch(0.11 0.03 204 / 0.08)',
  md: '0 4px 8px -2px oklch(0.11 0.03 204 / 0.10), 0 2px 4px -2px oklch(0.11 0.03 204 / 0.06)',
  lg: '0 10px 20px -5px oklch(0.11 0.03 204 / 0.12), 0 4px 8px -4px oklch(0.11 0.03 204 / 0.08)',
  xl: '0 20px 40px -10px oklch(0.11 0.03 204 / 0.15), 0 8px 16px -8px oklch(0.11 0.03 204 / 0.10)',
} as const;

export const shadowOuterDark = {
  xs: '0 1px 2px 0 oklch(0.08 0.02 204 / 0.04)',
  sm: '0 2px 4px 0 oklch(0.08 0.02 204 / 0.06)',
  md: '0 4px 8px -2px oklch(0.08 0.02 204 / 0.07), 0 2px 4px -2px oklch(0.08 0.02 204 / 0.04)',
  lg: '0 10px 20px -5px oklch(0.08 0.02 204 / 0.08), 0 4px 8px -4px oklch(0.08 0.02 204 / 0.06)',
  xl: '0 20px 40px -10px oklch(0.08 0.02 204 / 0.10), 0 8px 16px -8px oklch(0.08 0.02 204 / 0.07)',
} as const;

// ── Brand-tinted shadows ──────────────────────────────────────────────────────

export const shadowPrimary = {
  xs: '0 1px 2px 0 oklch(0.76 0.07 67 / 0.10)',
  sm: '0 2px 4px 0 oklch(0.76 0.07 67 / 0.15)',
  md: '0 4px 8px -2px oklch(0.76 0.07 67 / 0.20), 0 2px 4px -2px oklch(0.76 0.07 67 / 0.10)',
  lg: '0 10px 20px -5px oklch(0.76 0.07 67 / 0.25), 0 4px 8px -4px oklch(0.76 0.07 67 / 0.15)',
  xl: '0 20px 40px -10px oklch(0.76 0.07 67 / 0.30), 0 8px 16px -8px oklch(0.76 0.07 67 / 0.20)',
} as const;

export const shadowSecondary = {
  xs: '0 1px 2px 0 oklch(0.76 0.14 79 / 0.10)',
  sm: '0 2px 4px 0 oklch(0.76 0.14 79 / 0.15)',
  md: '0 4px 8px -2px oklch(0.76 0.14 79 / 0.20), 0 2px 4px -2px oklch(0.76 0.14 79 / 0.10)',
  lg: '0 10px 20px -5px oklch(0.76 0.14 79 / 0.25), 0 4px 8px -4px oklch(0.76 0.14 79 / 0.15)',
  xl: '0 20px 40px -10px oklch(0.76 0.14 79 / 0.30), 0 8px 16px -8px oklch(0.76 0.14 79 / 0.20)',
} as const;

export const shadowSuccess = {
  xs: '0 1px 2px 0 oklch(0.58 0.13 132 / 0.10)',
  sm: '0 2px 4px 0 oklch(0.58 0.13 132 / 0.15)',
  md: '0 4px 8px -2px oklch(0.58 0.13 132 / 0.20), 0 2px 4px -2px oklch(0.58 0.13 132 / 0.10)',
  lg: '0 10px 20px -5px oklch(0.58 0.13 132 / 0.25), 0 4px 8px -4px oklch(0.58 0.13 132 / 0.15)',
  xl: '0 20px 40px -10px oklch(0.58 0.13 132 / 0.30), 0 8px 16px -8px oklch(0.58 0.13 132 / 0.20)',
} as const;

export const shadowError = {
  xs: '0 1px 2px 0 oklch(0.51 0.22 24 / 0.10)',
  sm: '0 2px 4px 0 oklch(0.51 0.22 24 / 0.15)',
  md: '0 4px 8px -2px oklch(0.51 0.22 24 / 0.20), 0 2px 4px -2px oklch(0.51 0.22 24 / 0.10)',
  lg: '0 10px 20px -5px oklch(0.51 0.22 24 / 0.25), 0 4px 8px -4px oklch(0.51 0.22 24 / 0.15)',
  xl: '0 20px 40px -10px oklch(0.51 0.22 24 / 0.30), 0 8px 16px -8px oklch(0.51 0.22 24 / 0.20)',
} as const;

// ── Blur ──────────────────────────────────────────────────────────────────────

export const blur = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '40px',
} as const;

// ── Glow ──────────────────────────────────────────────────────────────────────

export const glowPrimary = {
  xs: '0 0 4px oklch(0.76 0.07 67 / 0.30)',
  sm: '0 0 8px oklch(0.76 0.07 67 / 0.40)',
  md: '0 0 16px oklch(0.76 0.07 67 / 0.50)',
  lg: '0 0 24px oklch(0.76 0.07 67 / 0.60)',
  xl: '0 0 40px oklch(0.76 0.07 67 / 0.70)',
} as const;

export const glowSecondary = {
  xs: '0 0 4px oklch(0.76 0.14 79 / 0.30)',
  sm: '0 0 8px oklch(0.76 0.14 79 / 0.40)',
  md: '0 0 16px oklch(0.76 0.14 79 / 0.50)',
  lg: '0 0 24px oklch(0.76 0.14 79 / 0.60)',
  xl: '0 0 40px oklch(0.76 0.14 79 / 0.70)',
} as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const skeleton = {
  baseColor: 'oklch(0.11 0.03 204 / 0.08)',
  shimmerColor: 'oklch(0.97 0.01 67 / 0.40)',
  animation: {
    duration: '1.5s',
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
  },
  gradient: {
    light:
      'linear-gradient(90deg, transparent 0%, oklch(0.97 0.01 67 / 0.40) 50%, transparent 100%)',
    dark: 'linear-gradient(90deg, transparent 0%, oklch(0.97 0.01 67 / 0.10) 50%, transparent 100%)',
  },
  speed: {
    slow: '2s',
    normal: '1.5s',
    fast: '1s',
  },
} as const;

// ── Elevation ─────────────────────────────────────────────────────────────────

export const elevationLight = {
  base: '0',
  raised: '0 1px 2px 0 oklch(0.11 0.03 204 / 0.05)',
  overlay: '0 4px 8px -2px oklch(0.11 0.03 204 / 0.10), 0 2px 4px -2px oklch(0.11 0.03 204 / 0.06)',
  modal: '0 10px 20px -5px oklch(0.11 0.03 204 / 0.12), 0 4px 8px -4px oklch(0.11 0.03 204 / 0.08)',
  popover:
    '0 20px 40px -10px oklch(0.11 0.03 204 / 0.15), 0 8px 16px -8px oklch(0.11 0.03 204 / 0.10)',
} as const;

export const elevationDark = {
  base: '0',
  raised: '0 1px 2px 0 oklch(0.08 0.02 204 / 0.04)',
  overlay: '0 4px 8px -2px oklch(0.08 0.02 204 / 0.07), 0 2px 4px -2px oklch(0.08 0.02 204 / 0.04)',
  modal: '0 10px 20px -5px oklch(0.08 0.02 204 / 0.08), 0 4px 8px -4px oklch(0.08 0.02 204 / 0.06)',
  popover:
    '0 20px 40px -10px oklch(0.08 0.02 204 / 0.10), 0 8px 16px -8px oklch(0.08 0.02 204 / 0.07)',
} as const;

// ── Easing helpers ────────────────────────────────────────────────────────────
// Note: primary timing lives in transition.ts. These are for CSS animations
// (keyframes, Web Animations API) rather than transitions.

export const easing = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShadowScaleToken = typeof shadowInner;
export type ShadowPrimaryToken = typeof shadowPrimary;
export type BlurToken = typeof blur;
export type GlowToken = typeof glowPrimary;
export type SkeletonToken = typeof skeleton;
export type ElevationToken = typeof elevationLight;
export type EasingToken = typeof easing;
