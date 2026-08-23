/**
 * Card Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos y tipos del componente Card
 *
 * Principios SOLID aplicados:
 * - Interface Segregation: Interfaces pequeñas y específicas
 * - Dependency Inversion: Componentes dependen de abstracciones (tipos)
 */

import type { ReactNode } from 'react';
import type React from 'react';
import type { TSizes } from '@infra/styles/themes/theme.types';

/**
 * Variantes de estilo del Card
 */
export type TCardVariant = 'default' | 'outlined' | 'elevated' | 'filled' | 'ghost';

/**
 * Tamaños del Card
 * Afecta padding y spacing internos
 */
export type TCardSize = Extract<TSizes, 'sm' | 'md' | 'lg'>;

/**
 * Tamaños del Card
 * Afecta padding y spacing internos
 */
export type TCardSpace = Extract<TSizes, 'sm' | 'md' | 'lg'>;

/**
 * Espaciado del Card
 * Afecta padding y spacing internos
 */
export type TCardPadding = 'none' | Extract<TSizes, 'sm' | 'md' | 'lg'>;

/**
 * Alineacion del footer del Card
 */
export type TCardFooterAlign = 'left' | 'center' | 'right' | 'between';

/**
 * Props del Card principal
 */
export interface ICardProps extends React.AriaAttributes {
  /** Contenido del card (usado cuando no hay header/body/footer específicos) */
  readonly children?: React.ReactNode;

  /** Variante visual del card */
  readonly variant?: TCardVariant;

  /** Tamaño del card */
  readonly size?: TCardSize;

  /** Padding personalizado (sobrescribe el del size) */
  readonly padding?: TCardPadding;

  /** Si el card es clickeable (añade hover states) */
  readonly clickable?: boolean;

  /** Handler de click */
  readonly onClick?: () => void;

  /** Clase CSS personalizada */
  readonly className?: string;

  /** ID del elemento */
  readonly id?: string;

  /** Ancho completo (100%) */
  readonly fullWidth?: boolean;

  /** Deshabilitar el card */
  readonly disabled?: boolean;
}

/**
 * Props del Card Header
 */
export interface ICardHeaderProps {
  /** Padding personalizado (sobrescribe el del size) */
  readonly padding?: TCardPadding;

  /** Contenido del header */
  readonly children?: ReactNode;

  /** Título del card (opcional, se renderiza como h3) */
  readonly title?: string;

  /** Subtítulo del card (opcional) */
  readonly subtitle?: string;

  /** Avatar o icono en el header */
  readonly avatar?: ReactNode;

  /** Acciones del header (botones, menús, etc.) */
  readonly action?: ReactNode;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Props del Card Body
 */
export interface ICardBodyProps {
  /** Contenido del body */
  readonly children: ReactNode;

  /** Padding personalizado (sobrescribe el del size) */
  readonly padding?: TCardPadding;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Props del Card Footer
 */
export interface ICardFooterProps {
  /** Contenido del footer */
  readonly children: ReactNode;

  /** Alinear contenido */
  readonly align?: TCardFooterAlign;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Configuración de estilos internos
 * (No expuesto al usuario - Internal Use Only)
 */
export interface ICardStyleConfig {
  readonly padding: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
  };
  readonly gap: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
  };
}
