// ========================================
// TYPES
// ========================================

import type { TBreakpointKey, TSizes } from '@infra/styles/themes/theme.types';

export type TGridSpacingValue = TSizes;
export type TGridBreakpointKey = TBreakpointKey | '2xl' | '3xl' | '4xl';

export interface IGridResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  '3xl'?: T;
  '4xl'?: T;
}

export interface IGridProps {
  readonly children: React.ReactNode;
  readonly as?: keyof React.JSX.IntrinsicElements;
  readonly $columns?: number | IGridResponsiveValue<number>;
  readonly $gap?: TGridSpacingValue | IGridResponsiveValue<TGridSpacingValue>;
  readonly $columnGap?: TGridSpacingValue | IGridResponsiveValue<TGridSpacingValue>;
  readonly $rowGap?: TGridSpacingValue | IGridResponsiveValue<TGridSpacingValue>;
  readonly $autoFlow?: 'fit' | 'fill';
  readonly $minColumnWidth?: string;
  readonly $justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  readonly $alignItems?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  readonly $className?: string;
}

export interface IGridItemProps {
  readonly children: React.ReactNode;
  readonly as?: keyof React.JSX.IntrinsicElements;
  readonly $colSpan?: number | IGridResponsiveValue<number>;
  readonly $colStart?: number | IGridResponsiveValue<number>;
  readonly $colEnd?: number | IGridResponsiveValue<number>;
  readonly $rowSpan?: number | IGridResponsiveValue<number>;
  readonly $className?: string;
}
