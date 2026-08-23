/**
 * useFloatingPanel — Portal-based floating panel positioning
 *
 * Reutiliza las funciones puras de Popover.utils para calcular posición
 * y auto-flip. El panel se renderiza vía createPortal en document.body,
 * evitando el bug de overflow:hidden en ancestros.
 *
 * SOLID:
 * - SRP: solo posicionamiento + ciclo de vida del panel flotante.
 * - DIP: depende de abstracciones (ElementDimensions, PositionOptions),
 *         no de implementaciones concretas de Popover.
 * - OCP: extensible vía IFloatingPanelOptions sin modificar internos.
 *
 * @example
 * const { panelRef, floatingStyles, mounted } = useFloatingPanel(triggerRef, isOpen);
 * // render via createPortal with floatingStyles applied
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  TPopoverPlacement,
  PositioningStrategy,
} from '@infra/components/ui/common/Popover/Popover.types';
import {
  calculatePopoverPosition,
  getElementDimensions,
} from '@infra/components/ui/common/Popover/Popover.utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface IFloatingPanelOptions {
  /** Posición preferida del panel respecto al trigger. @default "bottom-start" */
  readonly placement?: TPopoverPlacement;
  /** Distancia en px entre trigger y panel. @default 6 */
  readonly offset?: number;
  /** Estrategia CSS de posicionamiento. @default "fixed" */
  readonly strategy?: PositioningStrategy;
  /** Igualar min-width del panel al ancho del trigger. @default false */
  readonly matchTriggerWidth?: boolean;
}

export interface IFloatingPanelResult {
  /** Ref para asignar al elemento del panel flotante */
  readonly panelRef: React.RefObject<HTMLDivElement | null>;
  /** Estilos inline para posicionar el panel (top, left, position, minWidth) */
  readonly floatingStyles: React.CSSProperties;
  /** Placement final tras auto-flip (puede diferir del solicitado) */
  readonly resolvedPlacement: TPopoverPlacement;
  /** true cuando el componente está montado en el cliente (SSR-safe) */
  readonly mounted: boolean;
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PLACEMENT: TPopoverPlacement = 'bottom-start';
const DEFAULT_OFFSET = 6;
const DEFAULT_STRATEGY: PositioningStrategy = 'fixed';

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useFloatingPanel(
  triggerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  options: IFloatingPanelOptions = {},
): IFloatingPanelResult {
  const {
    placement = DEFAULT_PLACEMENT,
    offset = DEFAULT_OFFSET,
    strategy = DEFAULT_STRATEGY,
    matchTriggerWidth = false,
  } = options;

  const panelRef = useRef<HTMLDivElement | null>(null);
  // CSR-only (Vite): always mounted — no SSR framework in this project
  const mounted = true;
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: TPopoverPlacement;
  }>({
    top: 0,
    left: 0,
    placement,
  });
  const [triggerWidth, setTriggerWidth] = useState<number>(0);

  // ── Cálculo de posición ──────────────────────────────────────────────────────

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !panelRef.current) return;

    const triggerRect = getElementDimensions(triggerRef.current);
    const popoverRect = getElementDimensions(panelRef.current);

    if (!triggerRect || !popoverRect) return;

    if (matchTriggerWidth) {
      setTriggerWidth(triggerRect.width);
    }

    const result = calculatePopoverPosition({
      triggerRect,
      popoverRect,
      placement,
      offset,
      arrow: false,
      strategy,
    });

    setPosition({
      top: result.top,
      left: result.left,
      placement: result.placement,
    });
  }, [isOpen, triggerRef, placement, offset, strategy, matchTriggerWidth]);

  // ── Posicionar al abrir ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    // rAF para esperar a que el panel se renderice en el DOM
    const frameId = requestAnimationFrame(() => {
      updatePosition();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isOpen, updatePosition]);

  // ── Re-posicionar en scroll / resize ─────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    // rAF-throttle: coalesce scroll/resize bursts into one recálculo por frame,
    // evitando el layout thrashing (Forced reflow) de medir en cada evento.
    let frameId: number | null = null;
    const handleUpdate = () => {
      if (frameId !== null) return; // ya hay un recálculo encolado para este frame
      frameId = requestAnimationFrame(() => {
        frameId = null;
        updatePosition();
      });
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  // ── Estilos inline (evita generación excesiva de clases CSS) ─────────────────

  const floatingStyles: React.CSSProperties = {
    position: strategy,
    top: `${position.top}px`,
    left: `${position.left}px`,
    zIndex: 9999,
    ...(matchTriggerWidth && triggerWidth > 0 ? { minWidth: `${triggerWidth}px` } : {}),
  };

  return {
    panelRef,
    floatingStyles,
    resolvedPlacement: position.placement,
    mounted,
  };
}
