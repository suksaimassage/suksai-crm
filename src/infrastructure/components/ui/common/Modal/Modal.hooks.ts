/**
 * Modal Hooks
 *
 * Responsabilidad: Custom hooks para manejo de modal
 *
 * Principios:
 * - Single Responsibility: Cada hook maneja un aspecto
 * - Reusable: Pueden usarse en otros contextos
 */

import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Hook para bloquear scroll del body cuando el modal está abierto
 */
export const useLockScroll = (lock: boolean) => {
  useEffect(() => {
    if (!lock) return;

    // Guardar el scroll actual
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Bloquear scroll
    document.body.style.overflow = 'hidden';

    // Compensar scrollbar para evitar layout shift
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup: restaurar scroll
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '';
    };
  }, [lock]);
};

/**
 * Hook para manejar escape key
 */
export const useEscapeKey = (isOpen: boolean, onClose: () => void, enabled = true) => {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, enabled]);
};

/**
 * Hook para focus trap (mantener focus dentro del modal)
 */
export const useFocusTrap = (
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (container === null) return;

    // Elementos focuseables
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    };

    // Focus en el primer elemento al abrir
    const focusableElements = getFocusableElements();
    // .at(0) returns HTMLElement | undefined — safe when array is empty
    const firstElement = focusableElements.at(0);

    // Guardar el elemento que tenía focus antes
    const previousActiveElement = document.activeElement as HTMLElement;

    // Focus en el primer elemento (guard: array may be empty if all elements are disabled)
    firstElement?.focus();

    // Handler para trap
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();
      const firstEl: HTMLElement | undefined = elements[0];
      const lastEl: HTMLElement | undefined = elements[elements.length - 1];

      // Si Shift + Tab en el primer elemento, ir al último
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive guard: lastEl may be undefined if the focusable set changes between events
        lastEl?.focus();
      }
      // Si Tab en el último elemento, ir al primero
      else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive guard: firstEl may be undefined if the focusable set changes between events
        firstEl?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Cleanup: restaurar focus
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      previousActiveElement.focus();
    };
  }, [isOpen, containerRef]);
};

/**
 * Hook para callback después de animación
 */
export const useAfterTransition = (
  callback: (() => void) | undefined,
  dependency: boolean,
  delay = 300,
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!callback) return;

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Ejecutar callback después del delay
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dependency, callback, delay]);
};

/**
 * Hook personalizado para usar el modal fácilmente
 */
export const useModal = (initialState = false) => {
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

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
