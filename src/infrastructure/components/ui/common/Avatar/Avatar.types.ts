/**
 * Avatar Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos del componente Avatar
 *
 * Principios SOLID:
 * - Interface Segregation: Interfaces pequeñas y específicas
 * - Dependency Inversion: Componentes dependen de abstracciones
 */

import type { ReactNode, ImgHTMLAttributes } from 'react';
import type { TColorName, TSizes, TSizesExtended } from '@infra/styles/themes/theme.types';

/**
 * Tamaños del avatar
 */
export type TAvatarSize = Extract<TSizesExtended, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>;

/**
 * Variantes de color del avatar (para fallback con iniciales)
 */
export type TAvatarColor = TColorName;

/**
 * Forma del avatar
 */
export type TAvatarShape = 'circle' | 'rounded' | 'square';

/**
 * Espacios entre Avatar Group
 */
export type TAvatarGroupSpacing = 'tight' | 'normal' | 'loose';

/**
 * Border del Avatar
 */
export type TAvatarBorderWidth = 'thin' | 'medium' | 'thick';

/**
 * Posicion del badge del Avatar
 */
export type TAvatarBadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Estados del avatar
 */
export type TAvatarState = 'idle' | 'hover' | 'active' | 'loading' | 'disabled' | 'skeleton';

export type TAvatarBadgeSize = Extract<TSizes, 'sm' | 'md' | 'lg'>;

export type TAvatarBadgeStatus = 'online' | 'offline' | 'busy' | 'away';

/**
 * Props del Avatar principal
 */
export interface IAvatarProps {
  /** URL de la imagen */
  readonly src?: string;

  /** Texto alternativo para la imagen */
  readonly alt?: string;

  /** Nombre completo para generar iniciales */
  readonly name?: string;

  /** Tamaño del avatar */
  readonly size?: TAvatarSize;

  /** Forma del avatar */
  readonly shape?: TAvatarShape;

  /** Color de fondo para iniciales */
  readonly color?: TAvatarColor;

  /** Mostrar borde */
  readonly bordered?: boolean;

  /** Grosor del borde (si bordered=true) */
  readonly borderWidth?: TAvatarBorderWidth;

  /** Avatar deshabilitado */
  readonly disabled?: boolean;

  /** Estado de carga */
  readonly loading?: boolean;

  /** Mostrar skeleton loader */
  readonly skeleton?: boolean;

  /** Handler de click */
  readonly onClick?: () => void;

  /** Clase CSS personalizada */
  readonly className?: string;

  /** ID del elemento */
  readonly id?: string;

  /** Badge/indicador (ej: status online) */
  readonly badge?: ReactNode;

  /** Posición del badge */
  readonly badgePosition?: TAvatarBadgePosition;

  /** Props adicionales de img */
  readonly imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;
}

/**
 * Props del AvatarGroup
 */
export interface IAvatarGroupProps {
  /** Avatares hijos */
  readonly children: ReactNode;

  /** Tamaño de todos los avatares */
  readonly size?: TAvatarSize;

  /** Forma de todos los avatares */
  readonly shape?: TAvatarShape;

  /** Máximo de avatares a mostrar */
  readonly max?: number;

  /** Espacio entre avatares (overlap) */
  readonly spacing?: TAvatarGroupSpacing;

  /** Mostrar borde en todos */
  readonly bordered?: boolean;

  /** Clase CSS personalizada */
  readonly className?: string;

  /** Texto para avatares extras (+N) */
  readonly excessText?: (count: number) => string;
}

/**
 * Props del Badge/Indicator
 */
export interface IAvatarBadgeProps {
  /** Contenido del badge */
  readonly children?: ReactNode;

  /** Posición del badge */
  readonly position?: TAvatarBadgePosition;

  /** Color del badge */
  readonly color?: TAvatarColor | 'online' | 'offline' | 'busy' | 'away';

  /** Mostrar borde alrededor del badge */
  readonly bordered?: boolean;

  /** Tamaño del badge */
  readonly size?: TAvatarBadgeSize;

  /** Badge pulsante (para notificaciones) */
  readonly ping?: boolean;
}

/**
 * Configuración de estilos internos
 * (No expuesto al usuario - Internal Use Only)
 */
export interface IAvatarStyleConfig {
  readonly sizes: Readonly<
    Record<
      TAvatarSize,
      {
        readonly size: string;
        readonly fontSize: string;
        readonly badgeSize: string;
      }
    >
  >;
  readonly borderWidths: {
    readonly thin: string;
    readonly medium: string;
    readonly thick: string;
  };
  readonly shapes: {
    readonly circle: string;
    readonly rounded: string;
    readonly square: string;
  };
}
