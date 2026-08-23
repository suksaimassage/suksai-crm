/**
 * Spacing System - Public API
 *
 * Sistema completo de espaciado con componentes y utilities
 *
 * Componentes:
 * - Box: Padding/margin flexible en cualquier dirección
 * - Stack: Apilar elementos con espaciado consistente
 * - Spacer: Crear espacio flexible o fijo
 * - Inset: Padding uniforme
 *
 * @example
 * import { Box, Stack, Spacer, Inset } from '@components/ui/Spacing';
 */
export { Box } from './Box';
export { Spacer } from './Spacer';
export { Stack } from './Stack';

// Types
export type {
  TSpacingToken,
  TSpacingValue,
  TSpacingDirection,
  TSpacingType,
  IBoxProps,
  IStackProps,
  ISpacerProps,
} from './Spacing.types';

// Utilities
export {
  isSpacingToken,
  getSpacingValue,
  getPaddingProps,
  getMarginProps,
  getSpacingProps,
} from './Spacing.utils';
