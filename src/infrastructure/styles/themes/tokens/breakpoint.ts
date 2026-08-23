/**
 * tokens/breakpoint.ts — Responsive breakpoint tokens
 *
 * Mobile-first. Values are the *minimum* width where the breakpoint activates.
 * Use in media queries:  @media (min-width: ${breakpoint.md}) { ... }
 *
 * xs  → 320px   — small phone
 * sm  → 480px   — large phone
 * md  → 768px   — tablet
 * lg  → 1024px  — small laptop
 * xl  → 1280px  — laptop
 * 2xl → 1536px  — desktop
 * 3xl → 1920px  — wide monitor
 * 4xl → 2560px  — 4 K / ultra-wide
 */

export const breakpoint = {
  xs: '320px',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4xl': '2560px',
} as const;

export type BreakpointToken = typeof breakpoint;
export type BreakpointKey = keyof BreakpointToken;
