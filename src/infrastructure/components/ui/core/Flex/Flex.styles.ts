import type { IBreakpoint } from '@infra/styles/themes/theme.types';
import styled from 'styled-components';
import type { DefaultTheme } from 'styled-components';

// ---------------------------------------------------------------------------
// Flex CSS value type aliases
// ---------------------------------------------------------------------------

type TFlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type TFlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type TJustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch';
type TAlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type TAlignContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | 'normal';
type TAlignSelf = 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

// ---------------------------------------------------------------------------
// Breakpoint / spacing key types
// ---------------------------------------------------------------------------

type TBreakpointKey = 'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
type TBreakpoint = keyof IBreakpoint;

// Spacing values: a key that lives in theme.spacing OR any raw CSS string
type TSpacingValue = string;

// Responsive wrapper: scalar or a partial map keyed by breakpoint
type TResponsive<T> = T | Partial<Record<TBreakpointKey, T>>;

// ---------------------------------------------------------------------------
// Helper: resolve a spacing key or pass-through raw CSS
// ---------------------------------------------------------------------------

const BREAKPOINT_ORDER = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;

export function resolveSpacing(value: string, theme: DefaultTheme): string {
  const isSpacingKey = (key: string, spacing: typeof theme.spacing): key is keyof typeof spacing =>
    key in spacing;

  if (isSpacingKey(value, theme.spacing)) {
    return theme.spacing[value] ?? value;
  }

  return value;
}

// ---------------------------------------------------------------------------
// Helper: emit a single CSS property, handling responsive object or scalar
// ---------------------------------------------------------------------------

const getBreakpoint = (theme: DefaultTheme, bpKey: TBreakpoint) => {
  return theme.breakpoint[bpKey];
};

export function resolveResponsive<T>(
  value: TResponsive<T> | undefined,
  cssProperty: string,
  theme: DefaultTheme,
  resolver?: (val: T, theme: DefaultTheme) => string,
): string {
  if (value === undefined) return '';

  const format = (v: T): string => (resolver ? resolver(v, theme) : String(v));

  // Plain scalar (not a plain object)
  if (typeof value !== 'object' || value === null) {
    return `${cssProperty}: ${format(value)};`;
  }

  const obj = value as Partial<Record<TBreakpointKey, T>>;
  const parts: string[] = [];

  // base — no media query
  if (obj.base !== undefined) {
    parts.push(`${cssProperty}: ${format(obj.base)};`);
  }

  // breakpoint keys in mobile-first order
  for (const bpKey of BREAKPOINT_ORDER) {
    const bpValue = obj[bpKey];
    if (bpValue === undefined) continue;
    const minWidth = getBreakpoint(theme, bpKey);
    parts.push(`@media (min-width: ${minWidth}) {\n  ${cssProperty}: ${format(bpValue)};\n}`);
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Helper: emit TWO CSS properties (paddingX → padding-left + padding-right)
// Used for responsive objects where both props must appear inside each @media block
// ---------------------------------------------------------------------------

export function resolveResponsiveDouble(
  value: TResponsive<TSpacingValue> | undefined,
  cssPropertyA: string,
  cssPropertyB: string,
  theme: DefaultTheme,
): string {
  if (value === undefined) return '';

  const fmt = (v: string): string => resolveSpacing(v, theme);

  // Plain scalar — TSpacingValue is always string, so check for object keys
  if (typeof value === 'string') {
    const resolved = fmt(value);
    return `${cssPropertyA}: ${resolved};\n${cssPropertyB}: ${resolved};`;
  }

  const obj: Partial<Record<TBreakpointKey, TSpacingValue>> = value;
  const parts: string[] = [];

  if (obj.base !== undefined) {
    const resolved = fmt(obj.base);
    parts.push(`${cssPropertyA}: ${resolved};\n${cssPropertyB}: ${resolved};`);
  }

  for (const bpKey of BREAKPOINT_ORDER) {
    const bpValue = obj[bpKey];
    if (bpValue === undefined) continue;
    const minWidth = getBreakpoint(theme, bpKey);
    const resolved = fmt(bpValue);
    parts.push(
      `@media (min-width: ${minWidth}) {\n  ${cssPropertyA}: ${resolved};\n  ${cssPropertyB}: ${resolved};\n}`,
    );
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// StyledFlex props interface
// ---------------------------------------------------------------------------

interface IStyledFlexProps {
  readonly $direction?: TResponsive<TFlexDirection>;
  readonly $wrap?: TResponsive<TFlexWrap>;
  readonly $justify?: TResponsive<TJustifyContent>;
  readonly $align?: TResponsive<TAlignItems>;
  readonly $alignContent?: TResponsive<TAlignContent>;
  readonly $gap?: TResponsive<TSpacingValue>;
  readonly $rowGap?: TResponsive<TSpacingValue>;
  readonly $columnGap?: TResponsive<TSpacingValue>;
  readonly $flex?: string;
  readonly $display?: 'flex' | 'inline-flex';
  readonly $width?: TResponsive<string>;
  readonly $height?: TResponsive<string>;
  readonly $minWidth?: TResponsive<string>;
  readonly $minHeight?: TResponsive<string>;
  readonly $maxWidth?: TResponsive<string>;
  readonly $maxHeight?: TResponsive<string>;
  readonly $padding?: TResponsive<TSpacingValue>;
  readonly $paddingX?: TResponsive<TSpacingValue>;
  readonly $paddingY?: TResponsive<TSpacingValue>;
  readonly $overflow?: TResponsive<string>;
  readonly $overflowX?: TResponsive<string>;
  readonly $overflowY?: TResponsive<string>;
}

// ---------------------------------------------------------------------------
// StyledFlex
// ---------------------------------------------------------------------------

export const StyledFlex = styled.div<IStyledFlexProps>`
  display: flex;
  box-sizing: border-box;

  ${({ $display }) => ($display !== undefined ? `display: ${$display};` : '')}

  ${({ theme, $direction }) => resolveResponsive($direction, 'flex-direction', theme)}

  ${({ theme, $wrap }) => resolveResponsive($wrap, 'flex-wrap', theme)}

  ${({ theme, $justify }) => resolveResponsive($justify, 'justify-content', theme)}

  ${({ theme, $align }) => resolveResponsive($align, 'align-items', theme)}

  ${({ theme, $alignContent }) => resolveResponsive($alignContent, 'align-content', theme)}

  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : '')}

  ${({ theme, $gap }) => resolveResponsive($gap, 'gap', theme, resolveSpacing)}

  ${({ theme, $rowGap }) => resolveResponsive($rowGap, 'row-gap', theme, resolveSpacing)}

  ${({ theme, $columnGap }) => resolveResponsive($columnGap, 'column-gap', theme, resolveSpacing)}

  ${({ theme, $width }) => resolveResponsive($width, 'width', theme)}

  ${({ theme, $height }) => resolveResponsive($height, 'height', theme)}

  ${({ theme, $minWidth }) => resolveResponsive($minWidth, 'min-width', theme)}

  ${({ theme, $minHeight }) => resolveResponsive($minHeight, 'min-height', theme)}

  ${({ theme, $maxWidth }) => resolveResponsive($maxWidth, 'max-width', theme)}

  ${({ theme, $maxHeight }) => resolveResponsive($maxHeight, 'max-height', theme)}

  ${({ theme, $padding }) => resolveResponsive($padding, 'padding', theme, resolveSpacing)}

  ${({ theme, $paddingX }) =>
    resolveResponsiveDouble($paddingX, 'padding-left', 'padding-right', theme)}

  ${({ theme, $paddingY }) =>
    resolveResponsiveDouble($paddingY, 'padding-top', 'padding-bottom', theme)}

  ${({ theme, $overflow }) => resolveResponsive($overflow, 'overflow', theme)}

  ${({ theme, $overflowX }) => resolveResponsive($overflowX, 'overflow-x', theme)}

  ${({ theme, $overflowY }) => resolveResponsive($overflowY, 'overflow-y', theme)}
`;

// ---------------------------------------------------------------------------
// StyledFlexItem props interface
// ---------------------------------------------------------------------------

interface IStyledFlexItemProps {
  readonly $grow?: TResponsive<number>;
  readonly $shrink?: TResponsive<number>;
  readonly $basis?: TResponsive<string>;
  readonly $order?: TResponsive<number>;
  readonly $alignSelf?: TResponsive<TAlignSelf>;
  readonly $flex?: string;
  readonly $width?: TResponsive<string>;
  readonly $height?: TResponsive<string>;
  readonly $minWidth?: TResponsive<string>;
  readonly $minHeight?: TResponsive<string>;
  readonly $maxWidth?: TResponsive<string>;
  readonly $maxHeight?: TResponsive<string>;
}

// ---------------------------------------------------------------------------
// StyledFlexItem
// ---------------------------------------------------------------------------

export const StyledFlexItem = styled.div<IStyledFlexItemProps>`
  box-sizing: border-box;
  min-width: 0;

  ${({ theme, $grow }) => resolveResponsive($grow, 'flex-grow', theme, (v) => String(v))}

  ${({ theme, $shrink }) => resolveResponsive($shrink, 'flex-shrink', theme, (v) => String(v))}

  ${({ theme, $basis }) => resolveResponsive($basis, 'flex-basis', theme)}

  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : '')}

  ${({ theme, $order }) => resolveResponsive($order, 'order', theme, (v) => String(v))}

  ${({ theme, $alignSelf }) => resolveResponsive($alignSelf, 'align-self', theme)}

  ${({ theme, $width }) => resolveResponsive($width, 'width', theme)}

  ${({ theme, $height }) => resolveResponsive($height, 'height', theme)}

  ${({ theme, $minWidth }) => resolveResponsive($minWidth, 'min-width', theme)}

  ${({ theme, $minHeight }) => resolveResponsive($minHeight, 'min-height', theme)}

  ${({ theme, $maxWidth }) => resolveResponsive($maxWidth, 'max-width', theme)}

  ${({ theme, $maxHeight }) => resolveResponsive($maxHeight, 'max-height', theme)}
`;

// ---------------------------------------------------------------------------
// Re-export types consumed by Flex.tsx
// ---------------------------------------------------------------------------

export type {
  TFlexDirection,
  TFlexWrap,
  TJustifyContent,
  TAlignItems,
  TAlignContent,
  TAlignSelf,
  TBreakpointKey,
  TResponsive,
  TSpacingValue,
  IStyledFlexProps,
  IStyledFlexItemProps,
};
