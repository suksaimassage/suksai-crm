/**
 * Popover Component - Types & Interfaces
 *
 * Responsabilidad: Definir contratos del componente Popover
 *
 * Principios SOLID:
 * - Interface Segregation: Interfaces pequeñas y específicas
 * - Dependency Inversion: Componentes dependen de abstracciones
 */

import type { ReactNode, ReactElement } from 'react';

/**
 * Posiciones del popover relativas al trigger
 */
export type TPopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Triggers para abrir/cerrar el popover
 */
export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual';

/**
 * Valores admitidos para `aria-haspopup` (WAI-ARIA 1.2). `'true'` es equivalente
 * a `'menu'` por compatibilidad heredada; los demás describen la naturaleza de la
 * superficie que abre el trigger.
 */
export type TAriaHasPopup = 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

/**
 * Rol ARIA de la superficie del popover (el contenedor portaleado).
 *
 * - `'tooltip'` (por defecto) — descripción breve, no interactiva.
 * - `'dialog'` — superficie interactiva con acciones/foco (no modal: el kit no
 *   atrapa el foco ni bloquea el fondo, así que NO se emite `aria-modal="true"`).
 * - `'menu' | 'listbox' | 'grid' | 'tree'` — superficies de selección.
 *
 * El trigger deriva su `aria-haspopup` por defecto de este rol, salvo que el
 * propio hijo declare uno (en cuyo caso se respeta el del hijo).
 */
export type TPopoverSurfaceRole = 'tooltip' | 'dialog' | 'menu' | 'listbox' | 'grid' | 'tree';

/**
 * Estrategia de posicionamiento
 */
export type PositioningStrategy = 'absolute' | 'fixed';

/**
 * Props del Popover principal
 */
export interface PopoverProps {
  /** Elemento que dispara el popover */
  readonly children: ReactElement;

  /** Contenido del popover */
  readonly content: ReactNode;

  /** Si el popover está abierto (modo controlado) */
  readonly open?: boolean;

  readonly anchorRef?: React.RefObject<HTMLElement>;

  /** Callback al cambiar el estado */
  readonly onOpenChange?: (open: boolean) => void;

  /** Posición preferida del popover */
  readonly placement?: TPopoverPlacement;

  /** Tipo de trigger */
  readonly trigger?: PopoverTrigger;

  /** Offset desde el trigger (en px) */
  readonly offset?: number;

  /** Mostrar flecha apuntando al trigger */
  readonly arrow?: boolean;

  /** Cerrar al hacer click fuera */
  readonly closeOnClickOutside?: boolean;

  /** Cerrar al presionar Escape */
  readonly closeOnEscape?: boolean;

  /** Delay antes de mostrar (para hover, en ms) */
  readonly showDelay?: number;

  /** Delay antes de ocultar (para hover, en ms) */
  readonly hideDelay?: number;

  /** Ancho del popover */
  readonly width?: string | number;

  /** Ancho máximo del popover */
  readonly maxWidth?: string | number;

  /** Estrategia de posicionamiento */
  readonly strategy?: PositioningStrategy;

  /** Clase CSS personalizada para el popover */
  readonly className?: string;

  /** ID del popover */
  readonly id?: string;

  /** Mantener popover montado cuando está cerrado */
  readonly keepMounted?: boolean;

  /** Callback después de abrir */
  readonly onOpen?: () => void;

  /** Callback después de cerrar */
  readonly onClose?: () => void;

  /** Z-index del popover */
  readonly zIndex?: number;

  /**
   * Rol ARIA de la superficie portaleada. Por defecto `'tooltip'` (comportamiento
   * histórico). Usa `'dialog'` para popovers interactivos de leer-y-actuar — el
   * trigger anunciará `aria-haspopup="dialog"` salvo que el hijo declare otro.
   */
  readonly role?: TPopoverSurfaceRole;

  /**
   * Nombre accesible de la superficie portaleada (`aria-label`). Obligatorio en la
   * práctica cuando `role="dialog"`: un nodo dialog/alertdialog debe tener nombre
   * accesible (axe-core: "ARIA dialog and alertdialog nodes should have an
   * accessible name"). El `PopoverHeader` muestra el título visualmente pero no
   * está cableado al contenedor, así que el nombre se aporta por aquí.
   */
  readonly ariaLabel?: string;
}

/**
 * Props del PopoverHeader
 */
export interface PopoverHeaderProps {
  /** Contenido del header */
  readonly children?: ReactNode;

  /** Título del popover */
  readonly title?: string;

  /** Mostrar botón de cerrar */
  readonly showCloseButton?: boolean;

  /** Callback al cerrar */
  readonly onClose?: () => void;

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Props del PopoverBody
 */
export interface PopoverBodyProps {
  /** Contenido del body */
  readonly children: ReactNode;

  /** Padding personalizado */
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Clase CSS personalizada */
  readonly className?: string;
}

/**
 * Posición calculada del popover
 */
export interface PopoverPosition {
  readonly top: number;
  readonly left: number;
  readonly placement: TPopoverPlacement;
  readonly arrowPosition?: {
    readonly top?: string;
    readonly left?: string;
    readonly right?: string;
    readonly bottom?: string;
  };
}

/**
 * Dimensiones de un elemento
 */
export interface ElementDimensions {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Opciones de posicionamiento
 */
export interface PositionOptions {
  readonly triggerRect: ElementDimensions;
  readonly popoverRect: ElementDimensions;
  readonly placement: TPopoverPlacement;
  readonly offset: number;
  readonly arrow: boolean;
  readonly strategy: PositioningStrategy;
}

/**
 * Context del Popover
 */
export interface PopoverContextValue {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

/**
 * Props que se pasan al elemento trigger
 */
export interface TriggerProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  readonly 'aria-expanded'?: boolean;
  readonly 'aria-controls'?: string;
  readonly 'aria-haspopup'?: TAriaHasPopup;
}
