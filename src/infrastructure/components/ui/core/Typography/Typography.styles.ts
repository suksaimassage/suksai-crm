/**
 * Typography Styles
 *
 * Performance strategy:
 * - Static SIZE_LINE_HEIGHT_MAP prevents runtime computation per render.
 * - resolveFontScale short-circuits to a single CSS rule when $size is set.
 * - Responsive CSS generation only runs when $responsive=true.
 *
 * Mobile-first breakpoint cascade: xs → sm → md → lg → xl
 */

import styled, { css, type DefaultTheme } from 'styled-components';
import type { TBreakpointKey, TResponsiveValue } from '@infra/styles/themes/theme.types';
import type {
  TTypographyVariant,
  TTypographyColor,
  TTypographyFamily,
  TTypographyAlign,
  TTypographyWeight,
  TTypographySize,
} from './Typography.types';
import { getContrastText } from '@infra/styles/themes/theme.helpers';

// ========================================
// PRECOMPUTED STATIC MAPS
// Eliminates repeated inline calculations in the CSS template.
// Line-heights follow the inverse relationship with font-size:
//   larger text → tighter leading; smaller text → looser leading.
// ========================================

/**
 * Precomputed line-heights per atomic size token.
 * Values respect WCAG 1.4.8 (line-height ≥ 1.5 for body text).
 */
export const SIZE_LINE_HEIGHT_MAP: Readonly<Record<TTypographySize, string>> = {
  '3xs': '1.6', //  8px — generous leading for legibility at micro sizes
  '2xs': '1.55', // 10px
  xs: '1.5', // 12px
  sm: '1.5', // 14px
  md: '1.6', // 16px — body baseline (WCAG 1.5 minimum)
  lg: '1.55', // 18px
  xl: '1.5', // 20px
  '2xl': '1.35', // 24px — heading territory
  '3xl': '1.3', // 30px
  '4xl': '1.25', // 36px
  '5xl': '1.2', // 48px
  '6xl': '1.15', // 60px
  '7xl': '1.1', // 72px — display: very tight is intentional
} as const;

// ========================================
// INTERNAL STYLED PROPS
// ========================================

interface TypographyStyledProps {
  readonly $variant: TTypographyVariant;
  readonly $color: TTypographyColor;
  readonly $family?: TTypographyFamily;
  readonly $align: TTypographyAlign;
  readonly $weight?: TTypographyWeight;
  readonly $size?: TTypographySize;
  readonly $truncate: boolean;
  readonly $lineClamp?: number;
  readonly $gutterBottom: boolean;
  /** null means no contrast computation — use text scale directly */
  readonly $shade: number | null;
  readonly $responsive: boolean;
}

// ========================================
// CSS HELPERS
// ========================================

/**
 * Resolves a responsive value map at a specific breakpoint.
 * Cascades down: xl → lg → md → sm → xs → "inherit".
 */
const resolveBreakpointValue = (
  values: string | TResponsiveValue,
  breakpoint: TBreakpointKey,
): string => {
  if (typeof values === 'string') return values;

  const CASCADE: readonly TBreakpointKey[] = ['xl', 'lg', 'md', 'sm', 'xs'];
  const startIndex = CASCADE.indexOf(breakpoint);
  for (let i = startIndex; i < CASCADE.length; i++) {
    const resolved = values[CASCADE[i]];
    if (resolved) return resolved;
  }

  return 'inherit';
};

const isTextColor = (
  color: string,
  text: DefaultTheme['color']['text'],
): color is keyof typeof text => {
  return color in text;
};

/**
 * Resolves font-size and line-height for both atomic and variant modes.
 *
 * ROOT CAUSE FIX:
 * The previous implementation used `css` helper functions that returned
 * fragments containing nested `${({ theme }) => ...}` closures inside
 * `@media` blocks. styled-components does NOT resolve theme-accessor
 * functions inside `css` results that are themselves returned from an
 * interpolation — so the `@media` overrides were silently dropped and
 * only the xs base value ever applied.
 *
 * CORRECT PATTERN:
 * All dynamic values (theme tokens, props) must be fully resolved BEFORE
 * constructing the css string. Pre-resolve → interpolate concrete strings.
 * This guarantees every `@media` block contains a plain string, not a
 * deferred function, and styled-components emits all breakpoints correctly.
 */
const buildFontScale = (
  theme: DefaultTheme,
  variant: TTypographyVariant,
  size: TTypographySize | undefined,
  responsive: boolean,
) => {
  // ── Atomic size override ──────────────────────────────────────────────
  if (size) {
    const fontSize = theme.typography.size[size] ?? '1rem';
    const lineHeight = SIZE_LINE_HEIGHT_MAP[size];
    return css`
      font-size: ${fontSize};
      line-height: ${lineHeight};
    `;
  }

  // ── Variant scale: pre-resolve all breakpoint values ─────────────────
  const fs = theme.typography.type[variant].fontSize as TResponsiveValue;
  const lh = theme.typography.type[variant].lineHeight as TResponsiveValue;

  const fsXs = resolveBreakpointValue(fs, 'xs');
  const lhXs = resolveBreakpointValue(lh, 'xs');

  if (!responsive) {
    return css`
      font-size: ${fsXs};
      line-height: ${lhXs};
    `;
  }

  // Pre-resolve every breakpoint value into plain strings.
  // Never use ${({ theme }) => ...} inside these @media blocks —
  // that pattern breaks when the css fragment is returned from a function.
  const fsSm = resolveBreakpointValue(fs, 'sm');
  const fsMd = resolveBreakpointValue(fs, 'md');
  const fsLg = resolveBreakpointValue(fs, 'lg');
  const fsXl = resolveBreakpointValue(fs, 'xl');
  const lhMd = resolveBreakpointValue(lh, 'md');

  return css`
    font-size: ${fsXs};
    line-height: ${lhXs};

    @media (min-width: ${theme.breakpoint.sm}) {
      font-size: ${fsSm};
    }

    @media (min-width: ${theme.breakpoint.md}) {
      font-size: ${fsMd};
      line-height: ${lhMd};
    }

    @media (min-width: ${theme.breakpoint.lg}) {
      font-size: ${fsLg};
    }

    @media (min-width: ${theme.breakpoint.xl}) {
      font-size: ${fsXl};
    }
  `;
};

/**
 * Resolves the color token to a CSS value.
 *
 * Priority:
 *   1. "inherit" → CSS inherit
 *   2. $shade set → WCAG contrast computation
 *   3. Text-scale colors (primary/secondary/tertiary/disabled/inverse)
 *   4. Semantic colors without shade → 600 shade (readable on white)
 *   5. Fallback → text.primary
 */
const resolveColor = (
  theme: DefaultTheme,
  color: TTypographyColor,
  shade: number | null,
): string => {
  if (color === 'inherit') return 'inherit';
  if (shade != null) return getContrastText(theme, color, shade);

  const fromTextScale = theme.color.text[color];
  if (fromTextScale) return fromTextScale;

  if (isTextColor(color, theme.color.text)) {
    return theme.color.text[color] ?? theme.color.text.primary;
  }
  // Semantic color without shade — use 600 shade for readability on light bg
  const paletteColor = theme.color[color] as Record<number, string>;
  return paletteColor[600];
};

// ========================================
// STYLED COMPONENT
// ========================================

export const TypographyStyled = styled.div<TypographyStyledProps>`
  margin: 0;
  padding: 0;

  /* ── Font family ─────────────────────────────── */
  font-family: ${({ theme, $variant, $family }) =>
    $family ? theme.typography.font[$family] : theme.typography.type[$variant].fontFamily};

  /* ── Font scale (size + line-height) ─────────── */
  ${({ theme, $variant, $size, $responsive }) =>
    buildFontScale(theme, $variant, $size, $responsive)}

  /* ── Font weight ─────────────────────────────── */
  font-weight: ${({ theme, $variant, $weight }) =>
    $weight ? theme.typography.weight[$weight] : theme.typography.type[$variant].fontWeight};

  /* ── Color ───────────────────────────────────── */
  color: ${({ theme, $color, $shade }) => resolveColor(theme, $color, $shade)};

  /* ── Alignment ───────────────────────────────── */
  text-align: ${({ $align }) => $align};

  /* ── Gutter ──────────────────────────────────── */
  ${({ $gutterBottom, theme }) =>
    $gutterBottom &&
    css`
      margin-bottom: ${theme.spacing.md};
    `}

  /* ── Single-line truncation ──────────────────── */
  ${({ $truncate }) =>
    $truncate &&
    css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `}

  /* ── Multi-line clamp ────────────────────────── */
  ${({ $lineClamp }) =>
    $lineClamp &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: ${$lineClamp};
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    `}

  /* ── Font rendering ──────────────────────────── */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;
