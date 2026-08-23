/**
 * Typography Component Types
 *
 * Typographic scale validated against Major Third ratio (≈1.25).
 * Pure Golden Ratio (1.618) yields impractical UI values (9.9px, 25.9px…),
 * so Major Third is industry-preferred for web typography systems.
 *
 * Scale derivation (base=16px, ratio≈1.25):
 *   8 → 10 → 12 → 14 → 16 → 18 → 20 → 24 → 30 → 36 → 48 → 60 → 72
 *
 * Ratios between adjacent steps: 1.25, 1.2, 1.167, 1.143, 1.125, 1.111,
 * 1.2, 1.25, 1.2, 1.333, 1.25, 1.2 — weighted average ≈1.21 (near Major Third).
 */

import type { TColorName } from '@infra/styles/themes/theme.types';
import type React from 'react';

// ========================================
// VARIANT SYSTEM
// ========================================

export const typographyVariant = [
  'largeTitle',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'headline',
  'body',
  'content',
  'subtitle',
  'footnote',
  'caption1',
  'caption2',
  'label', // form labels, field headers — medium weight, 12-14px
  'code',
] as const;

export type TTypographyVariant = (typeof typographyVariant)[number];

// ========================================
// STYLE TOKENS
// ========================================

export type TTypographyFamily = 'display' | 'body' | 'mono';
export type TTypographyColor = TColorName | 'disabled' | 'inverse' | 'inherit';
export type TTypographyAlign = 'left' | 'center' | 'right' | 'justify';
export type TTypographyWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

/**
 * Atomic size tokens — bypass the variant's responsive scale.
 *
 *  Token │  rem   │  px  │ Use case
 * ───────┼────────┼──────┼──────────────────────────────────
 *   3xs  │ 0.500  │   8  │ Micro labels, status indicators
 *   2xs  │ 0.625  │  10  │ Dense UI, small badges, overlines
 *   xs   │ 0.750  │  12  │ Captions, legal text, helper text
 *   sm   │ 0.875  │  14  │ Secondary text, form labels
 *   md   │ 1.000  │  16  │ Body text — base (WCAG AA min for body)
 *   lg   │ 1.125  │  18  │ Large body, emphasis, subheadings
 *   xl   │ 1.250  │  20  │ Small headings, section titles
 *   2xl  │ 1.500  │  24  │ Section headings
 *   3xl  │ 1.875  │  30  │ Page headings
 *   4xl  │ 2.250  │  36  │ Large headings
 *   5xl  │ 3.000  │  48  │ Display — hero, landing pages
 *   6xl  │ 3.750  │  60  │ Display — editorial
 *   7xl  │ 4.500  │  72  │ Display — max impact
 */
export type TTypographySize =
  | '3xs'
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl';

// ========================================
// COMPONENT PROPS
// ========================================

export interface ITypographyProps extends React.AriaAttributes {
  /** Semantic variant — sets default element, type scale, weight */
  variant?: TTypographyVariant;

  /** Override the rendered HTML element */
  as?: keyof React.JSX.IntrinsicElements;

  /**
   * DOM id — forwarded to the rendered element. Enables `aria-labelledby`
   * references from a sibling container (e.g. a Card labelled by its heading).
   */
  id?: string;

  /** Text color from design token system */
  color?: TTypographyColor;

  /** Text alignment */
  align?: TTypographyAlign;

  /** Font family override */
  family?: TTypographyFamily;

  /** Font weight override (supersedes variant default) */
  weight?: TTypographyWeight;

  /**
   * Atomic size override — bypasses the variant's responsive scale.
   * Prefer this for dense UI, fixed-size labels, and icon companions.
   */
  size?: TTypographySize;

  children: React.ReactNode;

  className?: string;

  /**
   * Background shade for automatic contrast calculation.
   * When set, text color is computed to meet WCAG contrast requirements.
   * ≥500 → inverse (white/light) text; <500 → primary (dark) text.
   */
  shade?: number | null;

  /** Truncate with ellipsis on one line */
  truncate?: boolean;

  /** Truncate after N lines with ellipsis */
  lineClamp?: number;

  /** Add margin-bottom equal to theme.spacing.md */
  gutterBottom?: boolean;

  /** Show skeleton placeholder while content is loading */
  loading?: boolean;

  /** Width of the skeleton element when loading=true */
  skeletonWidth?: string | number;

  /**
   * Delay (ms) before hiding the skeleton after loading becomes false.
   * Prevents the flash-of-content on fast responses.
   * @default 200
   */
  loadingDelay?: number;

  /**
   * Enable responsive font scaling across breakpoints (mobile-first).
   * Set to false for server-side stable rendering or fixed-size contexts.
   * @default true
   */
  responsive?: boolean;
}
