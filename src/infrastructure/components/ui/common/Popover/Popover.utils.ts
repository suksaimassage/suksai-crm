/**
 * Popover Utilities
 *
 * Responsabilidad: Funciones puras de posicionamiento
 *
 * Principios:
 * - Single Responsibility: Cada función hace una sola cosa
 * - Pure Functions: Sin side effects ni estado
 *
 * Estrategia de posicionamiento:
 * El popover se renderiza en document.body via portal.
 * getBoundingClientRect() devuelve coordenadas relativas al viewport.
 *
 * strategy: 'fixed'    → usar coords del viewport directamente (sin scroll)
 * strategy: 'absolute' → sumar scroll para coords relativas al documento
 *
 * Flip logic:
 * Cuando no hay espacio en el placement solicitado se recalculan las
 * coordenadas completas con el placement opuesto.
 */

import type {
  TPopoverPlacement,
  PopoverPosition,
  ElementDimensions,
  PositionOptions,
} from './Popover.types';

// Alias interno para menos verbosidad en este archivo
type Placement = TPopoverPlacement;

// ========================================
// CONSTANTS
// ========================================

/** Margen mínimo entre el popover y los bordes del viewport */
const VIEWPORT_PADDING = 8;

// ========================================
// PUBLIC API
// ========================================

/**
 * Obtiene las dimensiones de un elemento relativas al viewport.
 * Retorna null si el elemento no existe o no tiene dimensiones.
 */
export const getElementDimensions = (element: HTMLElement | null): ElementDimensions | null => {
  if (!element) return null;

  const rect = element.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
  };
};

/**
 * Calcula la posición final del popover con auto-flip y clamp al viewport.
 *
 * Flujo:
 * 1. Calcular posición base con el placement solicitado
 * 2. Detectar si hay espacio disponible en ese lado
 * 3. Si no hay espacio → intentar el lado opuesto (recalcula coordenadas)
 * 4. Clamp final para nunca salirse del viewport
 * 5. Calcular posición de la flecha apuntando al centro del trigger
 */
export const calculatePopoverPosition = (options: PositionOptions): PopoverPosition => {
  const { triggerRect, popoverRect, placement, offset, arrow, strategy } = options;

  const arrowSize = arrow ? 8 : 0;
  const totalOffset = offset + arrowSize;

  const scrollX = strategy === 'fixed' ? 0 : window.scrollX;
  const scrollY = strategy === 'fixed' ? 0 : window.scrollY;

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const resolvedPlacement = resolvePlacement(
    triggerRect,
    popoverRect,
    placement,
    totalOffset,
    viewport,
  );

  const coords = computeCoords(
    triggerRect,
    popoverRect,
    resolvedPlacement,
    totalOffset,
    scrollX,
    scrollY,
  );

  const clamped = clampToViewport(coords, popoverRect, viewport, scrollX, scrollY);

  const arrowPosition = arrow
    ? computeArrowPosition(triggerRect, clamped, resolvedPlacement, arrowSize, scrollX, scrollY)
    : undefined;

  return {
    top: clamped.top,
    left: clamped.left,
    placement: resolvedPlacement,
    arrowPosition,
  };
};

/**
 * Retorna el placement opuesto (usado para auto-flip).
 */
export const getOppositePlacement = (placement: Placement): Placement => {
  const opposites: Record<Placement, Placement> = {
    top: 'bottom',
    'top-start': 'bottom-start',
    'top-end': 'bottom-end',
    bottom: 'top',
    'bottom-start': 'top-start',
    'bottom-end': 'top-end',
    left: 'right',
    'left-start': 'right-start',
    'left-end': 'right-end',
    right: 'left',
    'right-start': 'left-start',
    'right-end': 'left-end',
  };

  return opposites[placement];
};

// ========================================
// INTERNALS
// ========================================

/**
 * Comprueba si hay espacio suficiente en el viewport para el placement dado.
 * Opera en coordenadas de viewport (sin scroll).
 */
const hasSpaceForPlacement = (
  triggerRect: ElementDimensions,
  popoverRect: ElementDimensions,
  placement: Placement,
  offset: number,
  viewport: { width: number; height: number },
): boolean => {
  const p = VIEWPORT_PADDING;

  if (placement.startsWith('top')) {
    return triggerRect.top - popoverRect.height - offset >= p;
  }
  if (placement.startsWith('bottom')) {
    return triggerRect.bottom + popoverRect.height + offset <= viewport.height - p;
  }
  if (placement.startsWith('left')) {
    return triggerRect.left - popoverRect.width - offset >= p;
  }
  if (placement.startsWith('right')) {
    return triggerRect.right + popoverRect.width + offset <= viewport.width - p;
  }

  return true;
};

/**
 * Determina el placement definitivo.
 * Si el solicitado no tiene espacio, intenta el opuesto.
 * Si ninguno tiene espacio, usa el solicitado (clamp se encarga del resto).
 */
const resolvePlacement = (
  triggerRect: ElementDimensions,
  popoverRect: ElementDimensions,
  requestedPlacement: Placement,
  offset: number,
  viewport: { width: number; height: number },
): Placement => {
  if (hasSpaceForPlacement(triggerRect, popoverRect, requestedPlacement, offset, viewport)) {
    return requestedPlacement;
  }

  const opposite = getOppositePlacement(requestedPlacement);

  if (hasSpaceForPlacement(triggerRect, popoverRect, opposite, offset, viewport)) {
    return opposite;
  }

  return requestedPlacement;
};

/**
 * Calcula las coordenadas top/left del popover para un placement dado.
 * triggerRect es relativo al viewport; se suma scroll para strategy 'absolute'.
 */
const computeCoords = (
  triggerRect: ElementDimensions,
  popoverRect: ElementDimensions,
  placement: Placement,
  offset: number,
  scrollX: number,
  scrollY: number,
): { top: number; left: number } => {
  const triggerCenterX = triggerRect.left + scrollX + (triggerRect.width - popoverRect.width) / 2;

  switch (placement) {
    case 'top':
      return {
        top: triggerRect.top + scrollY - popoverRect.height - offset,
        left: triggerCenterX,
      };
    case 'top-start':
      return {
        top: triggerRect.top + scrollY - popoverRect.height - offset,
        left: triggerRect.left + scrollX,
      };
    case 'top-end':
      return {
        top: triggerRect.top + scrollY - popoverRect.height - offset,
        left: triggerRect.right + scrollX - popoverRect.width,
      };

    case 'bottom':
      return {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerCenterX,
      };
    case 'bottom-start':
      return {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerRect.left + scrollX,
      };
    case 'bottom-end':
      return {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerRect.right + scrollX - popoverRect.width,
      };

    case 'left':
      return {
        top: triggerRect.top + scrollY + (triggerRect.height - popoverRect.height) / 2,
        left: triggerRect.left + scrollX - popoverRect.width - offset,
      };
    case 'left-start':
      return {
        top: triggerRect.top + scrollY,
        left: triggerRect.left + scrollX - popoverRect.width - offset,
      };
    case 'left-end':
      return {
        top: triggerRect.bottom + scrollY - popoverRect.height,
        left: triggerRect.left + scrollX - popoverRect.width - offset,
      };

    case 'right':
      return {
        top: triggerRect.top + scrollY + (triggerRect.height - popoverRect.height) / 2,
        left: triggerRect.right + scrollX + offset,
      };
    case 'right-start':
      return {
        top: triggerRect.top + scrollY,
        left: triggerRect.right + scrollX + offset,
      };
    case 'right-end':
      return {
        top: triggerRect.bottom + scrollY - popoverRect.height,
        left: triggerRect.right + scrollX + offset,
      };

    default:
      return { top: 0, left: 0 };
  }
};

/**
 * Evita que el popover sobresalga del viewport.
 * Opera en el espacio de coordenadas final (con scroll si absolute).
 */
const clampToViewport = (
  coords: { top: number; left: number },
  popoverRect: ElementDimensions,
  viewport: { width: number; height: number },
  scrollX: number,
  scrollY: number,
): { top: number; left: number } => {
  const p = VIEWPORT_PADDING;

  const minLeft = p + scrollX;
  const maxLeft = viewport.width - popoverRect.width - p + scrollX;
  const minTop = p + scrollY;
  const maxTop = viewport.height - popoverRect.height - p + scrollY;

  return {
    top: Math.min(Math.max(coords.top, minTop), maxTop),
    left: Math.min(Math.max(coords.left, minLeft), maxLeft),
  };
};

/**
 * Calcula la posición de la flecha relativa al contenedor del popover.
 *
 * La flecha apunta al centro del trigger, no al centro del popover.
 * triggerRect es viewport-relative; popoverCoords es en espacio absoluto.
 */
const computeArrowPosition = (
  triggerRect: ElementDimensions,
  popoverCoords: { top: number; left: number },
  placement: Placement,
  arrowSize: number,
  scrollX: number,
  scrollY: number,
): PopoverPosition['arrowPosition'] => {
  const triggerCenterX = triggerRect.left + scrollX + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + scrollY + triggerRect.height / 2;

  const ARROW_HALF = arrowSize;
  const ARROW_EDGE_PADDING = 12;

  if (placement.startsWith('top') || placement.startsWith('bottom')) {
    const relativeX = triggerCenterX - popoverCoords.left - ARROW_HALF;
    const clampedX = Math.max(ARROW_EDGE_PADDING, relativeX);

    if (placement.startsWith('top')) {
      return { bottom: `-${ARROW_HALF}px`, left: `${clampedX}px` };
    }
    return { top: `-${ARROW_HALF}px`, left: `${clampedX}px` };
  }

  if (placement.startsWith('left') || placement.startsWith('right')) {
    const relativeY = triggerCenterY - popoverCoords.top - ARROW_HALF;
    const clampedY = Math.max(ARROW_EDGE_PADDING, relativeY);

    if (placement.startsWith('left')) {
      return { right: `-${ARROW_HALF}px`, top: `${clampedY}px` };
    }
    return { left: `-${ARROW_HALF}px`, top: `${clampedY}px` };
  }

  return {};
};
