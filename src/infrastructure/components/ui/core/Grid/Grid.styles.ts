/**
 * Grid System - Styled Components
 *
 * Sistema de grid responsive con escala optimizada:
 * xs: 1, sm: 2, md: 4, lg: 8, xl: 12, 2xl: 16, 3xl: 20, 4xl: 24
 */

import styled, { css, type DefaultTheme } from 'styled-components';
import type {
  TGridBreakpointKey,
  IGridResponsiveValue,
  IGridProps,
  IGridItemProps,
} from './Grid.types';
import type { TSpacingInput } from '@infra/components/ui/core/Layout/Layout.types';
import type { TSpacingValue } from '@infra/components/ui/core/Spacing';
import type { ISpacing, TBreakpointKey } from '@infra/styles/themes/theme.types';

const breakpoints: TGridBreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

// Columnas por defecto por breakpoint (escala actualizada)
const defaultColumns: Record<TGridBreakpointKey, number> = {
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
};

// ========================================
// HELPER FUNCTIONS
// ========================================

const generateResponsiveCSS = <T extends string | number>(
  property: string,
  value: T | IGridResponsiveValue<T>,
  theme: DefaultTheme,
  transform?: (val: T) => string,
) => {
  if (typeof value !== 'object') {
    const finalValue = transform ? transform(value) : value;
    return `
      ${property}: ${finalValue};
    `;
  }
  const responsive = value;

  return breakpoints.map((bp) => {
    if (responsive[bp] !== undefined) {
      const finalValue = transform ? transform(responsive[bp]) : responsive[bp];

      if (bp === 'xs') {
        return `
          ${property}: ${finalValue};
        `;
      }

      return `
        @media (min-width: ${theme.breakpoint[bp]}) {
          ${property}: ${finalValue};
        }
      `;
    }
    return '';
  });
};

/**
 * Shorthand support -
 * resolveSpacing("padding", { xs: "sm", md: "lg" }, theme);
 *
 * Axis helpers -
 * resolveSpacing(["margin-top", "margin-bottom"], "md", theme);
 *
 * Grid -
 * ${({ $gap, theme }) => resolveSpacing("gap", $gap, theme)}
 *
 * Stack -
 * ${({ $spacing, theme }) => resolveSpacing("gap", $spacing, theme)}
 *
 * @param properties
 * @param value
 * @param theme
 * @returns
 */
export const resolveSpacing = (
  properties: string | string[],
  value: TSpacingInput,
  theme: DefaultTheme,
) => {
  if (!value) return css``;

  const propsArray = Array.isArray(properties) ? properties : [properties];

  const isSpacingToken = (v: string): v is keyof ISpacing => {
    return typeof v === 'string' && v in theme.spacing;
  };

  const getValue = (v: TSpacingValue) => {
    if (typeof v === 'number') {
      return `${v}px`; // opcional: escala automática
    }

    if (isSpacingToken(v)) {
      return theme.spacing[v];
    }

    return v;
  };

  // Caso simple: "md"
  if (typeof value === 'string') {
    const spacing = getValue(value);

    return css`
      ${propsArray.map((prop) => `${prop}: ${spacing};`).join('\n')}
    `;
  }

  // Caso responsive: { xs: "sm", md: "lg" }
  const breakpointsOrder: TBreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  return breakpointsOrder.map((bp) => {
    // Narrowing real
    if (typeof value !== 'object') return css``;

    const bpValue = value[bp];
    if (!bpValue) return '';

    const spacing = getValue(bpValue);

    // Mobile first (xs sin media query)
    if (bp === 'xs') {
      return css`
        ${propsArray.map((prop) => `${prop}: ${spacing};`).join('\n')}
      `;
    }

    return css`
      @media (min-width: ${theme.breakpoint[bp]}) {
        ${propsArray.map((prop) => `${prop}: ${spacing};`).join('\n')}
      }
    `;
  });
};

const resolveColumns = (
  theme: DefaultTheme,
  $columns?: number | IGridResponsiveValue<number>,
  $autoFlow?: 'fit' | 'fill',
  $minColumnWidth?: string,
) => {
  if ($autoFlow && $minColumnWidth) {
    return css`
      grid-template-columns: repeat(auto-${$autoFlow}, minmax(${$minColumnWidth}, 1fr));
    `;
  }

  if ($columns) {
    return generateResponsiveCSS(
      'grid-template-columns',
      $columns,
      theme,
      (val) => `repeat(${val}, 1fr)`,
    );
  }

  return css`
    grid-template-columns: 1fr;
  `;
};

const resolveGridProp = ({
  prop,
  value,
  theme,
  transform,
}: {
  prop: string;
  value: number | IGridResponsiveValue<number>;
  theme: DefaultTheme;
  transform?: (val: number, bp?: TGridBreakpointKey) => string;
}) => {
  if (!value) return;

  // simple
  if (typeof value !== 'object') {
    const finalValue = transform ? transform(value) : value;
    return `
      ${prop}: ${finalValue};
    `;
  }

  // responsive
  return breakpoints.map((bp: TGridBreakpointKey) => {
    const v = value[bp];

    const finalValue = transform ? transform(v ?? 0, bp) : v;
    if (bp === 'xs') {
      return `
        ${prop}: ${finalValue};
      `;
    }

    return `
      @media (min-width: ${theme.breakpoint[bp]}) {
        ${prop}: ${finalValue};
      }
    `;
  });
};

// ========================================
// GRID CONTAINER
// ========================================

export const Grid = styled.div<IGridProps>`
  display: grid;
  width: 100%;

  /* Columns */
  ${({ $columns, $autoFlow, $minColumnWidth, theme }) =>
    resolveColumns(theme, $columns, $autoFlow, $minColumnWidth)}

  /* Gap */
  ${({ $gap, theme }) => resolveSpacing('gap', $gap, theme)}

  /* Column Gap */
  ${({ $columnGap, theme }) => resolveSpacing('column-gap', $columnGap, theme)}

  /* Row Gap */
  ${({ $rowGap, theme }) => resolveSpacing('row-gap', $rowGap, theme)}

  /* Alignment */
  ${({ $justifyItems }) =>
    $justifyItems &&
    css`
      justify-items: ${$justifyItems};
    `}
  ${({ $alignItems }) =>
    $alignItems &&
    css`
      align-items: ${$alignItems};
    `}
`;

// ========================================
// GRID ITEM
// ========================================

export const GridItem = styled.div<IGridItemProps>`
  /* Allow grid items to shrink below their min-content so repeat(n, 1fr) tracks
     stay equal instead of overflowing the container. Without this, 1fr resolves
     to minmax(auto, 1fr) and intrinsically-wide content (e.g. KPI cards with
     white-space:nowrap titles) pushes the grid past its column at narrow widths. */
  min-width: 0;

  ${({ $colSpan, theme }) =>
    resolveGridProp({
      prop: 'grid-column',
      value: $colSpan ?? 0,
      theme,
      transform: (val, bp) => {
        const maxColumns = defaultColumns[bp ?? 'xs'];
        return `span ${Math.min(val, maxColumns)}`;
      },
    })}

  ${({ $colStart, theme }) =>
    resolveGridProp({
      prop: 'grid-column-start',
      value: $colStart ?? 0,
      theme,
    })}

  ${({ $colEnd, theme }) =>
    resolveGridProp({
      prop: 'grid-column-end',
      value: $colEnd ?? 0,
      theme,
    })}

  ${({ $rowSpan, theme }) =>
    resolveGridProp({
      prop: 'grid-row',
      value: $rowSpan ?? 0,
      theme,
      transform: (val) => `span ${val}`,
    })}
`;
