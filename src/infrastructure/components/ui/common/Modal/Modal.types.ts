/**
 * Modal Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos del componente Modal
 *
 * Principios SOLID:
 * - Interface Segregation: Interfaces pequeñas y específicas
 * - Dependency Inversion: Componentes dependen de abstracciones
 */

import type { ReactNode } from 'react';
import type { TSizes } from '@infra/styles/themes/theme.types';

/**
 * Tamaños del modal
 */
export type TModalSize = TSizes | 'full';

/**
 * Posición del modal
 */
export type TModalPosition = 'center' | 'top' | 'bottom';

/**
 * Comportamiento al cerrar
 */
export type TModalCloseReason = 'backdrop' | 'escape' | 'close-button' | 'action';

export type TModalBodyPadding = 'none' | Extract<TSizes, 'sm' | 'md' | 'lg'>;
export type TModalFooterAlign = 'left' | 'center' | 'right' | 'between';

/**
 * Props del Modal principal
 */
export interface IModalProps {
  /** Si el modal está abierto */
  readonly open: boolean;

  /** Callback al cerrar el modal */
  readonly onClose: (reason: TModalCloseReason) => void;

  /** Contenido del modal */
  readonly children: ReactNode;

  /** Tamaño del modal */
  readonly size?: TModalSize;

  /** Posición del modal */
  readonly position?: TModalPosition;

  /** Cerrar al hacer click fuera (backdrop) */
  readonly closeOnBackdropClick?: boolean;

  /** Cerrar con tecla Escape */
  readonly closeOnEscape?: boolean;

  /** Clase CSS personalizada */
  readonly className?: string;

  /** ID del elemento */
  readonly id?: string;

  /** Deshabilitar scroll del body cuando está abierto */
  readonly lockScroll?: boolean;

  /** Animación de entrada/salida */
  readonly animated?: boolean;

  /** Blur del backdrop */
  readonly backdropBlur?: boolean;

  /** Callback después de abrir */
  readonly onAfterOpen?: () => void;

  /** Callback después de cerrar */
  readonly onAfterClose?: () => void;
}

/**
 * Props del ModalHeader
 */
export interface IModalHeaderProps {
  /** Contenido del header */
  readonly children?: ReactNode;

  /** Título del modal */
  readonly title?: string;

  /** Subtítulo del modal */
  readonly subtitle?: string;

  /** Mostrar botón de cerrar */
  readonly showCloseButton?: boolean;

  /** Callback al cerrar */
  readonly onClose?: () => void;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Props del ModalBody
 */
export interface IModalBodyProps {
  /** Contenido del body */
  readonly children: ReactNode;

  /** Padding personalizado */
  readonly padding?: TModalBodyPadding;

  /** Clase CSS personalizada */
  readonly className?: string;

  /** Habilitar scroll interno */
  readonly scrollable?: boolean;
}

/**
 * Props del ModalFooter
 */
export interface IModalFooterProps {
  /** Contenido del footer */
  readonly children: ReactNode;

  /** Alineación de los botones */
  readonly align?: TModalFooterAlign;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Props del Backdrop
 */
export interface IBackdropProps {
  /** Si está visible */
  readonly open: boolean;

  /** Callback al hacer click */
  readonly onClick?: () => void;

  /** Aplicar blur */
  readonly blur?: boolean;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Configuración de estilos internos
 * (No expuesto al usuario - Internal Use Only)
 */
export interface IModalStyleConfig {
  readonly sizes: Readonly<
    Record<
      TModalSize,
      {
        readonly maxWidth: string;
        readonly width: string;
      }
    >
  >;
  readonly positions: {
    readonly center: string;
    readonly top: string;
    readonly bottom: string;
  };
}
