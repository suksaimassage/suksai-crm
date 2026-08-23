/**
 * Button Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos del componente Button
 *
 * Principios SOLID:
 * - Interface Segregation: Interfaces pequeñas y específicas
 * - Dependency Inversion: Componentes dependen de abstracciones
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import type { TButtonColor, TButtonSize } from '@infra/components/ui/common/Button/Button.types';

/**
 * Variantes de estilo del botón
 *
 * "solid" - Fondo sólido con color
 *
 * "outline" - Solo borde
 *
 * "ghost" - Sin borde, con hover
 *
 * "text" - Texto simple, sin fondo
 *
 * "link" - Estilo link/anchor
 */
export type TButtonVariant = 'solid' | 'outline' | 'ghost' | 'text' | 'link';

/**
 * Estados del botón
 */
export type TButtonState = 'idle' | 'hover' | 'active' | 'loading' | 'disabled';

export type TButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Props del Button principal
 */
export interface IButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Contenido del botón (texto) */
  readonly children?: ReactNode;

  /** Variante visual del botón */
  variant?: TButtonVariant;

  /** Color del botón */
  color?: TButtonColor;

  /** Tamaño del botón */
  size?: TButtonSize;

  /** Icono a la izquierda del texto */
  readonly leftIcon?: ReactNode;

  /** Icono a la derecha del texto */
  readonly rightIcon?: ReactNode;

  /** Estado de carga */
  readonly loading?: boolean;

  /** Texto durante carga (opcional) */
  readonly loadingText?: string;

  /** Botón deshabilitado */
  readonly disabled?: boolean;

  /** Ancho completo (100%) */
  readonly fullWidth?: boolean;

  /** Forma del botón */
  readonly shape?: 'default' | 'rounded' | 'pill';

  /** Handler de click */
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /** Tipo de botón HTML */
  readonly type?: 'button' | 'submit' | 'reset';

  /** Clase CSS personalizada */
  readonly className?: string;

  /** ID del elemento */
  readonly id?: string;

  /** Solo icono (sin texto) */
  readonly iconOnly?: boolean;

  /** ARIA label (requerido si iconOnly) */
  readonly 'aria-label'?: string;
}

/**
 * Props del ButtonGroup
 */
export interface IButtonGroupProps {
  /** Botones hijos */
  readonly children: ReactNode;

  /** Tamaño de todos los botones */
  readonly size?: TButtonSize;

  /** Variante de todos los botones */
  readonly variant?: TButtonVariant;

  /** Color de todos los botones */
  readonly color?: TButtonColor;

  /** Orientación del grupo */
  readonly orientation?: TButtonGroupOrientation;

  /** Adjuntar botones (sin gap) */
  readonly attached?: boolean;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Configuración de estilos internos
 * (No expuesto al usuario - Internal Use Only)
 */
export interface IButtonStyleConfig {
  readonly sizes: Readonly<
    Record<
      TButtonSize,
      {
        readonly height: string;
        readonly padding: string;
        readonly fontSize: string;
        readonly iconSize: string;
      }
    >
  >;
  readonly shapes: {
    readonly default: string;
    readonly rounded: string;
    readonly pill: string;
  };
}

/**
 * Props del spinner de carga
 */
export interface ISpinnerProps {
  readonly size?: number;
  readonly color?: string;
  readonly className?: string;
}
