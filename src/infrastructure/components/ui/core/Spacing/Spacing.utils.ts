/**
 * Spacing Utilities
 *
 * Responsabilidad: Funciones helper para convertir spacing tokens
 *
 * Principios:
 * - Single Responsibility: Cada función hace una cosa
 * - Pure Functions: Sin side effects
 */

import type { TSpacingValue, TSpacingToken } from './Spacing.types';

const validTokens = [
  'px',
  '0',
  '0.5',
  '1',
  '1.5',
  '2',
  '2.5',
  '3',
  '3.5',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '14',
  '16',
  '20',
  '24',
  '28',
  '32',
  '36',
  '40',
  '44',
  '48',
  '52',
  '56',
  '60',
  '64',
  '72',
  '80',
  '96',
  'xxs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
] as const;

/**
 * Verifica si un valor es un spacing token válido
 */
export const isSpacingToken = (value: unknown): value is TSpacingToken => {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return validTokens.includes(value as TSpacingToken);
};

/**
 * Obtiene el valor CSS de un spacing token
 * (En producción, esto debería venir del theme)
 */
const getSpacingTokenValue = (token: TSpacingToken): string => {
  const spacingMap: Record<TSpacingToken, string> = {
    px: '1px',
    '0': '0',
    '0.5': '2px',
    '1': '4px',
    '1.5': '6px',
    '2': '8px',
    '2.5': '10px',
    '3': '12px',
    '3.5': '14px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '7': '28px',
    '8': '32px',
    '9': '36px',
    '10': '40px',
    '11': '44px',
    '12': '48px',
    '14': '56px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
    '28': '112px',
    '32': '128px',
    '36': '144px',
    '40': '160px',
    '44': '176px',
    '48': '192px',
    '52': '208px',
    '56': '224px',
    '60': '240px',
    '64': '256px',
    '72': '288px',
    '80': '320px',
    '96': '384px',
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
    '6xl': '192px',
    '7xl': '256px',
    '8xl': '384px',
  };

  return spacingMap[token] || '0';
};

/**
 * Convierte un spacing value a CSS value
 *
 * @example
 * getSpacingValue('md') => '16px'
 * getSpacingValue(4) => '16px'
 * getSpacingValue('2rem') => '2rem'
 */
export const getSpacingValue = (value: TSpacingValue | undefined): string | undefined => {
  if (value === undefined) return undefined;

  // Si ya es un string CSS válido (con unidades), retornarlo
  if (typeof value === 'string' && !isSpacingToken(value)) {
    return value;
  }

  // Si es un número, convertir a spacing token
  if (typeof value === 'number') {
    return getSpacingTokenValue(String(value) as TSpacingToken);
  }

  // Si es un token, obtener su valor del theme
  if (isSpacingToken(value)) {
    return getSpacingTokenValue(value);
  }

  return undefined;
};

/**
 * Genera props de padding para styled-components
 */
export const getPaddingProps = (props: {
  $p?: TSpacingValue;
  $px?: TSpacingValue;
  $py?: TSpacingValue;
  $pt?: TSpacingValue;
  $pr?: TSpacingValue;
  $pb?: TSpacingValue;
  $pl?: TSpacingValue;
}) => {
  const styles: Record<string, string | undefined> = {};

  // Padding all
  if (props.$p !== undefined) {
    styles.padding = getSpacingValue(props.$p);
  }

  // Padding horizontal
  if (props.$px !== undefined) {
    styles.paddingLeft = getSpacingValue(props.$px);
    styles.paddingRight = getSpacingValue(props.$px);
  }

  // Padding vertical
  if (props.$py !== undefined) {
    styles.paddingTop = getSpacingValue(props.$py);
    styles.paddingBottom = getSpacingValue(props.$py);
  }

  // Padding individual (sobrescribe los anteriores)
  if (props.$pt !== undefined) styles.paddingTop = getSpacingValue(props.$pt);
  if (props.$pr !== undefined) styles.paddingRight = getSpacingValue(props.$pr);
  if (props.$pb !== undefined) styles.paddingBottom = getSpacingValue(props.$pb);
  if (props.$pl !== undefined) styles.paddingLeft = getSpacingValue(props.$pl);

  return styles;
};

/**
 * Genera props de margin para styled-components
 */
export const getMarginProps = (props: {
  $m?: TSpacingValue;
  $mx?: TSpacingValue;
  $my?: TSpacingValue;
  $mt?: TSpacingValue;
  $mr?: TSpacingValue;
  $mb?: TSpacingValue;
  $ml?: TSpacingValue;
}) => {
  const styles: Record<string, string | undefined> = {};

  // Margin all
  if (props.$m !== undefined) {
    styles.margin = getSpacingValue(props.$m);
  }

  // Margin horizontal
  if (props.$mx !== undefined) {
    styles.marginLeft = getSpacingValue(props.$mx);
    styles.marginRight = getSpacingValue(props.$mx);
  }

  // Margin vertical
  if (props.$my !== undefined) {
    styles.marginTop = getSpacingValue(props.$my);
    styles.marginBottom = getSpacingValue(props.$my);
  }

  // Margin individual (sobrescribe los anteriores)
  if (props.$mt !== undefined) styles.marginTop = getSpacingValue(props.$mt);
  if (props.$mr !== undefined) styles.marginRight = getSpacingValue(props.$mr);
  if (props.$mb !== undefined) styles.marginBottom = getSpacingValue(props.$mb);
  if (props.$ml !== undefined) styles.marginLeft = getSpacingValue(props.$ml);

  return styles;
};

/**
 * Combina padding y margin props
 */
export const getSpacingProps = (props: {
  $p?: TSpacingValue;
  $px?: TSpacingValue;
  $py?: TSpacingValue;
  $pt?: TSpacingValue;
  $pr?: TSpacingValue;
  $pb?: TSpacingValue;
  $pl?: TSpacingValue;
  $m?: TSpacingValue;
  $mx?: TSpacingValue;
  $my?: TSpacingValue;
  $mt?: TSpacingValue;
  $mr?: TSpacingValue;
  $mb?: TSpacingValue;
  $ml?: TSpacingValue;
}) => {
  return {
    ...getPaddingProps(props),
    ...getMarginProps(props),
  };
};
