import type { TTypographyVariant } from './Typography.types';

/**
 * Mapa de variante → elemento HTML semántico por defecto.
 */
export const DEFAULT_ELEMENT_MAP: Readonly<
  Record<TTypographyVariant, keyof React.JSX.IntrinsicElements>
> = {
  largeTitle: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  headline: 'h6',
  subtitle: 'p',
  body: 'p',
  content: 'p',
  footnote: 'span',
  caption1: 'span',
  caption2: 'span',
  label: 'p', // semantic form label
  code: 'pre',
};

/**
 * Alturas del Skeleton según la variante tipográfica.
 * Aproximan la altura visual del texto para evitar layout shift.
 */
export const SKELETON_HEIGHT_MAP: Readonly<Record<TTypographyVariant, string>> = {
  largeTitle: '4.5rem',
  h1: '3.5rem',
  h2: '2.75rem',
  h3: '2.5rem',
  h4: '2.25rem',
  h5: '2rem',
  h6: '1.75rem',
  headline: '1.5rem',
  body: '1.125rem',
  content: '1.125rem',
  subtitle: '0.9375rem',
  footnote: '0.875rem',
  caption1: '0.8125rem',
  caption2: '0.75rem',
  label: '0.875rem',
  code: '0.875rem',
};

// ========================================
// HELPERS (exportados para uso externo)
// ========================================

/**
 * Obtiene la altura del Skeleton para una variante tipográfica.
 * Útil si otros componentes necesitan Skeletons que imiten texto.
 */
export const getTypographySkeletonHeight = (variant: TTypographyVariant): string =>
  SKELETON_HEIGHT_MAP[variant];
