/**
 * Popover Hooks
 *
 * Responsabilidad: Custom hooks para manejo de popover
 *
 * Principios:
 * - Single Responsibility: Cada hook maneja un único aspecto
 * - Reusable: Independientes del componente Popover
 *
 * ⚡ Performance note:
 * usePopoverPosition usa useLayoutEffect (no useEffect) para el cálculo
 * inicial. Esto garantiza que la posición se calcula y aplica ANTES de
 * que el navegador pinte, eliminando el flash en (0,0).
 */

import { useEffect, useLayoutEffect, useCallback, useRef, useState } from 'react';
import type { PopoverPosition, PositionOptions } from './Popover.types';
import { calculatePopoverPosition, getElementDimensions } from './Popover.utils';

// ========================================
// useClickOutside
// ========================================

/**
 * Detecta clicks fuera del popover y del trigger para cerrarlo.
 * Usa captura (true) para ejecutarse antes que otros handlers.
 */
export const useClickOutside = (
  popoverRef: React.RefObject<HTMLElement | null>,
  triggerRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled = true,
): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isInsidePopover = popoverRef.current?.contains(target) ?? false;
      const isInsideTrigger = triggerRef.current?.contains(target) ?? false;

      if (isInsidePopover || isInsideTrigger) return;

      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [popoverRef, triggerRef, onClose, enabled]);
};

// ========================================
// usePopoverPosition
// ========================================

/**
 * Calcula y mantiene la posición del popover relativa al trigger.
 *
 * ✅ FIX — Flicker en (0,0):
 * El cálculo inicial usa useLayoutEffect en lugar de useEffect.
 * useLayoutEffect se ejecuta sincrónicamente DESPUÉS de que React
 * muta el DOM pero ANTES de que el navegador pinte.
 *
 * Flujo cuando isOpen pasa de false → true:
 * 1. React renderiza el PopoverContainer (con visibility:hidden)
 * 2. useLayoutEffect mide el trigger y el popover (ambos ya en el DOM)
 * 3. Calcula coordenadas reales → setPosition + setIsPositioned(true)
 * 4. React re-renderiza con la posición correcta (todavía antes del paint)
 * 5. El navegador pinta → el usuario nunca ve el popover en (0,0)
 */
export const usePopoverPosition = (
  triggerRef: React.RefObject<HTMLElement | null>,
  popoverRef: React.RefObject<HTMLElement | null>,
  options: Omit<PositionOptions, 'triggerRect' | 'popoverRect'>,
  isOpen: boolean,
): { position: PopoverPosition | null; isPositioned: boolean } => {
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);

  // Desestructurar primitivos para usar como deps estables
  const { placement, offset, arrow, strategy } = options;

  const updatePosition = useCallback(() => {
    const triggerRect = getElementDimensions(triggerRef.current);
    const popoverRect = getElementDimensions(popoverRef.current);

    if (!triggerRect || !popoverRect) return;

    const newPosition = calculatePopoverPosition({
      placement,
      offset,
      arrow,
      strategy,
      triggerRect,
      popoverRect,
    });

    setPosition(newPosition);
    setIsPositioned(true);
  }, [triggerRef, popoverRef, placement, offset, arrow, strategy]);

  // ✅ CRITICAL: useLayoutEffect para cálculo inicial (sync, pre-paint)
  useLayoutEffect(() => {
    if (!isOpen) {
      // Defer state resets to avoid set-state-in-effect lint rule;
      // these run after paint so the invisible container never flashes.
      const frameId = requestAnimationFrame(() => {
        setIsPositioned(false);
        setPosition(null);
      });
      return () => {
        cancelAnimationFrame(frameId);
      };
    }

    updatePosition();
  }, [isOpen, updatePosition]);

  // Resize y scroll: async está bien aquí (son actualizaciones post-paint).
  // rAF-throttle: coalesce los eventos en un único recálculo por frame para
  // evitar el layout thrashing (Forced reflow) de medir en cada evento.
  useEffect(() => {
    if (!isOpen) return;

    let frameId: number | null = null;
    const handleUpdate = () => {
      if (frameId !== null) return; // ya hay un recálculo encolado para este frame
      frameId = requestAnimationFrame(() => {
        frameId = null;
        updatePosition();
      });
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, {
      passive: true,
      capture: true,
    });

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  return { position, isPositioned };
};

// ========================================
// useEscapeKey
// ========================================

/** Cierra el popover al presionar Escape. */
export const useEscapeKey = (onClose: () => void, enabled = true): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, enabled]);
};

// ========================================
// useHoverDelay
// ========================================

/** Gestiona delays de apertura/cierre para trigger hover. */
export const useHoverDelay = (
  callback: () => void,
  delayMs: number,
): {
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  cancel: () => void;
} => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    cancel();
    timeoutRef.current = setTimeout(callback, delayMs);
  }, [callback, delayMs, cancel]);

  const handleMouseLeave = useCallback(() => {
    cancel();
  }, [cancel]);

  // Limpiar al desmontar
  useEffect(() => cancel, [cancel]);

  return { handleMouseEnter, handleMouseLeave, cancel };
};

// ========================================
// useFocusReturn
// ========================================

/**
 * Devuelve el foco al trigger cuando el popover se cierra.
 * Mejora significativa de accesibilidad para usuarios de teclado.
 */
export const useFocusReturn = (
  triggerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
): void => {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    // Solo actuar cuando pasa de abierto a cerrado
    if (wasOpen && !isOpen) {
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);
};

// ========================================
// usePopover (public API hook)
// ========================================

/**
 * Hook de conveniencia para gestionar estado del popover externamente.
 *
 * @example
 * const { isOpen, open, close, toggle } = usePopover();
 */
export const usePopover = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, open, close, toggle };
};
