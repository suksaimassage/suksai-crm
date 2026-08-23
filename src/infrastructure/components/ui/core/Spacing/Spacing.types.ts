/**
 * Spacing Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos del sistema de espaciado
 *
 * Principios SOLID:
 * - Interface Segregation: Interfaces pequeñas y específicas
 * - Dependency Inversion: Componentes dependen de abstracciones
 */

import type {
  TBorderRadius,
  TBorderStyle,
  TBorderWidths,
  TColorIntensity,
  TColorName,
} from '@infra/styles/themes/theme.types';
import type React from 'react';
import type { ReactNode, CSSProperties } from 'react';

/**
 * Tokens de spacing disponibles en el theme
 */
export type TSpacingToken =
  | 'px'
  | '0'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32'
  | '36'
  | '40'
  | '44'
  | '48'
  | '52'
  | '56'
  | '60'
  | '64'
  | '72'
  | '80'
  | '96'
  | 'xxs'
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
  | '7xl'
  | '8xl';

/**
 * Valores de spacing (pueden ser tokens o CSS values)
 */
export type TSpacingValue = TSpacingToken | number | `${number}px`;

/**
 * Direcciones de spacing
 */
export type TSpacingDirection = 'all' | 'x' | 'y' | 'top' | 'right' | 'bottom' | 'left';

/**
 * Tipo de spacing
 */
export type TSpacingType = 'padding' | 'margin';

/**
 * Props del componente Box (espaciado con elemento contenedor)
 */
export interface IBoxProps {
  /** Contenido del box */
  readonly children?: ReactNode;

  /** Padding en todas las direcciones */
  readonly $p?: TSpacingValue;

  /** Padding horizontal (left + right) */
  readonly $px?: TSpacingValue;

  /** Padding vertical (top + bottom) */
  readonly $py?: TSpacingValue;

  /** Padding top */
  readonly $pt?: TSpacingValue;

  /** Padding right */
  readonly $pr?: TSpacingValue;

  /** Padding bottom */
  readonly $pb?: TSpacingValue;

  /** Padding left */
  readonly $pl?: TSpacingValue;

  /** Margin en todas las direcciones */
  readonly $m?: TSpacingValue;

  /** Margin horizontal (left + right) */
  readonly $mx?: TSpacingValue;

  /** Margin vertical (top + bottom) */
  readonly $my?: TSpacingValue;

  /** Margin top */
  readonly $mt?: TSpacingValue;

  /** Margin right */
  readonly $mr?: TSpacingValue;

  /** Margin bottom */
  readonly $mb?: TSpacingValue;

  /** Margin left */
  readonly $ml?: TSpacingValue;

  /** Elemento HTML a renderizar */
  readonly as?: keyof React.JSX.IntrinsicElements;

  readonly $backgroundColor?: CSSProperties['backgroundColor'];

  /** Clase CSS personalizada */
  readonly className?: string;

  /** Estilos inline adicionales */
  readonly style?: CSSProperties;

  /** Ancho */
  readonly width?: CSSProperties['width'];

  /** Altura */
  readonly height?: CSSProperties['height'];

  /** Display */
  readonly display?: CSSProperties['display'];

  /** Border */
  readonly $border?: TBorderWidths;

  /** Radius */
  readonly radius?: TBorderRadius;

  /** Border color */
  readonly $borderColor?: TColorName;

  /** Border Color Intensity */
  readonly $borderColorIntensity?: TColorIntensity;

  /** Border Color Intensity */
  readonly $borderStyle?: TBorderStyle;
}

/**
 * Props del componente Stack (espaciado vertical entre hijos)
 */
export interface IStackProps {
  /** Contenido del stack */
  readonly children: ReactNode;

  /** Espacio entre elementos */
  readonly spacing?: TSpacingValue;

  /** Alineación horizontal */
  readonly align?: 'start' | 'center' | 'end' | 'stretch';

  /** Dirección del stack */
  readonly direction?: 'vertical' | 'horizontal';

  /** Dividir elementos con línea */
  readonly divider?: ReactNode;

  /** Wrap en flex */
  readonly wrap?: boolean;

  /** Clase CSS personalizada */
  readonly className?: string;

  /** Elemento HTML a renderizar */
  readonly as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Props del componente Spacer (espacio flexible)
 */
export interface ISpacerProps {
  /** Tamaño del espacio (si no se provee, es flexible) */
  readonly size?: TSpacingValue;

  /** Dirección del espacio */
  readonly direction?: 'horizontal' | 'vertical';

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Configuración interna de spacing
 * (No expuesta al usuario)
 */
export interface ISpacingConfig {
  readonly baseUnit: number;
  readonly scale: number[];
}
