/**
 * media.ts — Responsive media query helpers
 *
 * Derived from breakpoint tokens. Use these constants instead of raw px values
 * in styled-components to keep breakpoints consistent across the codebase.
 *
 * Breakpoints (min-width, mobile-first):
 *   xs  → 320px   — small phone
 *   sm  → 480px   — large phone
 *   md  → 768px   — tablet
 *   lg  → 1024px  — small laptop
 *   xl  → 1280px  — laptop
 *   2xl → 1536px  — desktop
 *
 * Usage:
 *   import { above, below } from '@infra/styles/media';
 *
 *   const StyledFoo = styled.div`
 *     ${above.lg} { display: grid; }
 *     ${below.md}  { padding: 16px; }
 *   `;
 */

// Raw pixel values — keep in sync with breakpoint.ts
const BP = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
} as const;

/** min-width queries — mobile-first "above breakpoint" */
export const above = {
  xs: `@media (min-width: ${BP.xs}px)`,
  sm: `@media (min-width: ${BP.sm}px)`,
  md: `@media (min-width: ${BP.md}px)`,
  lg: `@media (min-width: ${BP.lg}px)`,
  xl: `@media (min-width: ${BP.xl}px)`,
  '2xl': `@media (min-width: ${BP['2xl']}px)`,
  '3xl': `@media (min-width: ${BP['3xl']}px)`,
  '4xl': `@media (min-width: ${BP['4xl']}px)`,
} as const;

/** max-width queries — "below breakpoint" (inclusive upper bound = BP - 1) */
export const below = {
  xs: `@media (max-width: ${BP.xs - 1}px)`,
  sm: `@media (max-width: ${BP.sm - 1}px)`,
  md: `@media (max-width: ${BP.md - 1}px)`,
  lg: `@media (max-width: ${BP.lg - 1}px)`,
  xl: `@media (max-width: ${BP.xl - 1}px)`,
  '2xl': `@media (max-width: ${BP['2xl'] - 1}px)`,
} as const;
