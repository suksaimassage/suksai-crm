/**
 * Button Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos del componente Button
 *
 * Principios SOLID:
 * - Interface Segregation: Interfaces específicas por responsabilidad
 * - Dependency Inversion: Depende de abstracciones (tipos)
 */

import type { ReactNode, MouseEvent, ButtonHTMLAttributes, Ref } from 'react';
import type { TColorName, TSizes } from '@infra/styles/themes/theme.types';

/**
 * Variantes de color del Button
 */
export type TButtonColor = TColorName;

/**
 * Variantes visuales del Button
 *
 * "solid" - Fondo color, texto blanco
 *
 * "outlined" - Borde color, fondo transparente
 *
 * "dashed" - Borde discontinuo, fondo transparente
 *
 * "filled" - Fondo color claro, texto color
 *
 * "text" - Sin borde ni fondo, solo texto
 *
 * "link" - Como text pero con underline
 *
 * "ghost" - Fondo sutil, texto color
 */
export type TButtonVariant = 'solid' | 'outlined' | 'dashed' | 'filled' | 'text' | 'link' | 'ghost';

/**
 * Tamaños del Button
 *
 * "xs" - Extra small: 24px height
 *
 * "sm" - Small: 32px height
 *
 * "md" - Medium: 40px height (default)
 *
 * "lg" - Large: 48px height
 *
 * "xl" - Extra large: 56px height
 */
export type TButtonSize = TSizes;

/**
 * Forma del Button
 */
export type TButtonShape = 'default' | 'rounded' | 'circle' | 'square' | 'pill';

/**
 * Props del Button principal
 */
export interface IButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Color del botón (tema semántico) */
  readonly color?: TButtonColor;

  /** Variante visual */
  readonly variant?: TButtonVariant;

  /** Tamaño del botón */
  readonly size?: TButtonSize;

  /** Forma del botón */
  readonly shape?: TButtonShape;

  /** Contenido del botón (texto) */
  readonly children?: ReactNode;

  /** Icono antes del texto */
  readonly iconStart?: ReactNode;

  /** Icono después del texto */
  readonly iconEnd?: ReactNode;

  /** Solo icono (sin texto) */
  readonly iconOnly?: boolean;

  /** Estado de carga */
  readonly loading?: boolean;

  /** Icono personalizado de carga */
  readonly loadingIcon?: ReactNode;

  /** Texto durante carga (opcional) */
  readonly loadingText?: string;

  /** Deshabilitar botón */
  readonly disabled?: boolean;

  /** Ancho completo (100%) */
  readonly fullWidth?: boolean;

  /** Handler de click */
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;

  /** Tipo de botón HTML */
  readonly type?: 'button' | 'submit' | 'reset';

  /** Clase CSS personalizada */
  readonly className?: string;

  /** ID del elemento */
  readonly id?: string;

  /** ARIA label para accesibilidad */
  readonly 'aria-label'?: string;

  /** Ref hacia el elemento DOM del botón (React 19 ref-as-prop) */
  readonly ref?: Ref<HTMLButtonElement>;
}

/**
 * Props internos del styled component
 * (No expuestos al usuario - Internal Use Only)
 */
export interface IStyledButtonProps {
  readonly $color: TButtonColor;
  readonly $variant: TButtonVariant;
  readonly $size: TButtonSize;
  readonly $shape: TButtonShape;
  readonly $loading: boolean;
  readonly $disabled: boolean;
  readonly $fullWidth: boolean;
  readonly $iconOnly: boolean;
}

/**
 * Configuración de estilos por tamaño
 */
export interface IButtonSizeConfig {
  readonly height: string;
  readonly width: string;
  readonly padding: string;
  readonly fontSize: string;
  readonly iconSize: string;
  readonly gap: string;
}

/**
 * Configuración de colores por variante
 */
export interface IButtonColorConfig {
  readonly background: string;
  readonly color: string;
  readonly border: string;
  readonly hover: {
    readonly background: string;
    readonly color: string;
    readonly border: string;
  };
  readonly active: {
    readonly background: string;
    readonly color: string;
    readonly border: string;
  };
  readonly disabled: {
    readonly background: string;
    readonly color: string;
    readonly border: string;
  };
  readonly loading: {
    readonly background: string;
    readonly color: string;
    readonly border: string;
  };
}
