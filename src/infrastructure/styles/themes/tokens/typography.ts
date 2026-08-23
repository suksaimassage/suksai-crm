/**
 * tokens/typography.ts — Typography design tokens
 *
 * Three font roles, never mixed:
 *   display → headings (Poppins)
 *   body    → prose, labels, inputs (Lato)
 *   mono    → code blocks (DM Mono)
 *
 * typographyType defines 14 semantic roles with responsive size maps.
 * Components use typographyType.<role> — never raw fontSize values.
 */

// ── Font families ─────────────────────────────────────────────────────────────

export const fontFamily = {
  display: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
  body: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

// ── Weights ───────────────────────────────────────────────────────────────────

export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ── Type scale (px expressed as rem, 16px base) ───────────────────────────────

export const fontSize = {
  '3xs': '0.5rem', //  8px — micro labels, status indicators
  '2xs': '0.625rem', // 10px — dense UI, overlines, small badges
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  md: '1rem', // 16px — base
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem', // 72px
} as const;

// ── Line heights ──────────────────────────────────────────────────────────────

export const lineHeight = {
  tight: '1.2',
  snug: '1.35',
  normal: '1.5',
  relaxed: '1.65',
  loose: '1.75',
} as const;

// ── Letter spacing ────────────────────────────────────────────────────────────

export const letterSpacing = {
  tight: '-0.02em',
  normal: '0em',
  wide: '0.02em',
  wider: '0.05em',
} as const;

// ── Semantic type roles ───────────────────────────────────────────────────────
// Each role carries fontFamily, responsive fontSize map, responsive lineHeight
// map, and a default fontWeight. All 14 roles defined here.

export const typographyType = {
  h1: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '2rem', sm: '2.25rem', md: '2.75rem', lg: '3rem', xl: '3.5rem' },
    lineHeight: { xs: '1.2', md: '1.25' },
    fontWeight: 300,
  },
  h2: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem', lg: '2.5rem', xl: '2.75rem' },
    lineHeight: { xs: '1.25', md: '1.3' },
    fontWeight: 300,
  },
  h3: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.25rem', xl: '2.5rem' },
    lineHeight: { xs: '1.3', md: '1.35' },
    fontWeight: 400,
  },
  h4: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem', xl: '2.25rem' },
    lineHeight: { xs: '1.35', md: '1.4' },
    fontWeight: 400,
  },
  h5: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem', lg: '1.75rem', xl: '2rem' },
    lineHeight: { xs: '1.4', md: '1.45' },
    fontWeight: 400,
  },
  h6: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem', lg: '1.5rem', xl: '1.75rem' },
    lineHeight: { xs: '1.45', md: '1.5' },
    fontWeight: 500,
  },
  largeTitle: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem', xl: '4.5rem' },
    lineHeight: { xs: '1.1', md: '1.15' },
    fontWeight: 400,
  },
  headline: {
    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
    fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem', lg: '1.5rem' },
    lineHeight: { xs: '1.4', md: '1.45' },
    fontWeight: 400,
  },
  body: {
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '1rem', sm: '1.0625rem', md: '1.125rem' },
    lineHeight: { xs: '1.6', md: '1.65' },
    fontWeight: 400,
  },
  content: {
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '1rem', sm: '1.0625rem', md: '1.125rem' },
    lineHeight: { xs: '1.7', md: '1.75' },
    fontWeight: 400,
  },
  subtitle: {
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.0625rem' },
    lineHeight: { xs: '1.5', md: '1.55' },
    fontWeight: 400,
  },
  caption1: {
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem' },
    lineHeight: { xs: '1.4', md: '1.45' },
    fontWeight: 400,
  },
  caption2: {
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
    lineHeight: { xs: '1.35', md: '1.4' },
    fontWeight: 500,
  },
  label: {
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: {
      '3xs': '0.5rem',
      '2xs': '0.625rem',
      xs: '0.75rem',
      sm: '0.8125rem',
      md: '0.875rem',
    },
    lineHeight: { xs: '1.4', md: '1.45' },
    fontWeight: 500,
  },
  footnote: {
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
    lineHeight: { xs: '1.45', md: '1.5' },
    fontWeight: 500,
  },
  code: {
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
    lineHeight: { xs: '1.45', md: '1.5' },
    fontWeight: 500,
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type FontFamilyToken = typeof fontFamily;
export type FontWeightToken = typeof fontWeight;
export type FontSizeToken = typeof fontSize;
export type LineHeightToken = typeof lineHeight;
export type LetterSpacingToken = typeof letterSpacing;
export type TypographyTypeToken = typeof typographyType;
export type TypographyRole = keyof TypographyTypeToken;
export type FontSizeKey = keyof FontSizeToken;
