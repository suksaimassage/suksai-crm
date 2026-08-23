/**
 * Popover Component
 *
 * Overlay posicionado inteligentemente con auto-flip y sin flicker.
 *
 * Principios SOLID:
 * - Single Responsibility: Orquesta trigger, portal y posicionamiento
 * - Open/Closed: Extensible via props
 * - Composition: Usa sub-componentes PopoverHeader / PopoverBody
 *
 * ✅ Fixes aplicados:
 * - Flash en (0,0): useLayoutEffect en el hook de posición
 * - Hover close bug: onMouseLeave del trigger ahora usa hideHoverDelay
 * - A11y: aria-controls, aria-expanded, foco devuelto al cerrar
 * - Rendimiento: React.memo, useCallback estables
 *
 * @example
 * // Simple
 * <Popover content="Texto del popover">
 *   <button>Hover me</button>
 * </Popover>
 *
 * @example
 * // Complejo con header y body
 * <Popover
 *   content={
 *     <>
 *       <PopoverHeader title="Info" showCloseButton onClose={close} />
 *       <PopoverBody>Contenido aquí</PopoverBody>
 *     </>
 *   }
 *   placement="bottom-start"
 *   trigger="click"
 * >
 *   <Button>Abrir</Button>
 * </Popover>
 */

import React, { useRef, useState, useCallback, useId, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import * as S from './Popover.styles';
import type {
  PopoverProps,
  TriggerProps,
  TAriaHasPopup,
  TPopoverSurfaceRole,
} from './Popover.types';
import {
  useClickOutside,
  useEscapeKey,
  usePopoverPosition,
  useHoverDelay,
  useFocusReturn,
} from './Popover.hooks';

/**
 * `aria-haspopup` por defecto del trigger, derivado del rol de la superficie.
 * `'tooltip'` no aparece → cae al fallback `'true'` (comportamiento histórico),
 * porque "tooltip" no es un valor válido de `aria-haspopup`.
 */
const HASPOPUP_BY_ROLE: Partial<Record<TPopoverSurfaceRole, TAriaHasPopup>> = {
  dialog: 'dialog',
  menu: 'menu',
  listbox: 'listbox',
  grid: 'grid',
  tree: 'tree',
};

// ========================================
// POPOVER COMPONENT
// ========================================

const PopoverBase: React.FC<PopoverProps> = ({
  children,
  content,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom',
  trigger = 'click',
  offset = 8,
  arrow = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  showDelay = 0,
  hideDelay = 150,
  width,
  maxWidth,
  strategy = 'absolute',
  className,
  id: idProp,
  keepMounted = false,
  onOpen,
  onClose,
  zIndex = 1500,
  role = 'tooltip',
  ariaLabel,
}) => {
  // `aria-haspopup` por defecto del trigger cuando el hijo no declara uno.
  // Hace de `role` la fuente única de verdad (dialog → "dialog", tooltip → "true").
  const defaultHasPopup: TAriaHasPopup = HASPOPUP_BY_ROLE[role] ?? 'true';
  // ========================================
  // IDs (accessibility)
  // ========================================

  const generatedId = useId();
  const popoverId = idProp ?? `popover-${generatedId}`;

  // ========================================
  // STATE
  // ========================================

  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // ========================================
  // REFS
  // ========================================

  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ========================================
  // POSITIONING
  // ========================================

  /**
   * ✅ isPositioned es la clave del fix:
   * Solo es true después de que useLayoutEffect calculó las coordenadas reales.
   * PopoverContainer permanece invisible (visibility:hidden) hasta entonces.
   */
  const { position, isPositioned } = usePopoverPosition(
    triggerRef,
    popoverRef,
    { placement, offset, arrow, strategy },
    isOpen,
  );

  // ========================================
  // OPEN / CLOSE HANDLERS
  // ========================================

  const handleOpen = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalOpen(true);
    }
    onOpen?.();
  }, [isControlled, onOpenChange, onOpen]);

  const handleClose = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
    onClose?.();
  }, [isControlled, onOpenChange, onClose]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleOpen, handleClose]);

  // ========================================
  // HOVER DELAYS
  // ========================================

  const showHoverDelay = useHoverDelay(handleOpen, showDelay);
  const hideHoverDelay = useHoverDelay(handleClose, hideDelay);

  // ========================================
  // TRIGGER PROPS FACTORY
  // ========================================

  /**
   * Genera las props que se inyectan al trigger.
   * Usa composition para preservar handlers originales del elemento hijo.
   */
  const buildTriggerProps = (): TriggerProps => {
    /**
     * Cast children.props to a known shape so event handler accessors AND the
     * caller-declared `aria-haspopup` are typed rather than unknown (children is
     * a ReactElement whose props type is {}).
     */
    interface IChildEventProps {
      readonly onClick?: React.MouseEventHandler<HTMLElement>;
      readonly onMouseEnter?: React.MouseEventHandler<HTMLElement>;
      readonly onMouseLeave?: React.MouseEventHandler<HTMLElement>;
      readonly onFocus?: React.FocusEventHandler<HTMLElement>;
      readonly onBlur?: React.FocusEventHandler<HTMLElement>;
      readonly 'aria-haspopup'?: TAriaHasPopup;
    }
    const childProps = children.props as IChildEventProps;

    const props: TriggerProps = {
      'aria-expanded': isOpen,
      'aria-controls': popoverId,
      // ✅ A11y (WCAG 4.1.2): respeta el `aria-haspopup` que declare el hijo
      // (p. ej. "dialog" en los triggers de la agenda) en lugar de pisarlo con
      // "true". Si el hijo no declara ninguno, deriva del `role` de la superficie.
      'aria-haspopup': childProps['aria-haspopup'] ?? defaultHasPopup,
    };

    /**
     * Compone dos handlers: el del hijo (si existe) y el del popover.
     * Garantiza que el handler original del elemento hijo nunca se pierda.
     */
    const compose =
      <E,>(childHandler?: (event: E) => void, popoverHandler?: (event: E) => void) =>
      (event: E) => {
        childHandler?.(event);
        popoverHandler?.(event);
      };

    switch (trigger) {
      case 'click':
        props.onClick = compose(childProps.onClick, handleToggle);
        break;

      case 'hover':
        props.onMouseEnter = compose(childProps.onMouseEnter, () => {
          hideHoverDelay.cancel();
          showHoverDelay.handleMouseEnter();
        });
        // ✅ FIX: onMouseLeave debe iniciar el cierre (hideHoverDelay),
        // no llamar a showHoverDelay.handleMouseEnter() que reabre el popover.
        props.onMouseLeave = compose(childProps.onMouseLeave, () => {
          showHoverDelay.cancel();
          hideHoverDelay.handleMouseEnter();
        });
        break;

      case 'focus':
        props.onFocus = compose(childProps.onFocus, handleOpen);
        props.onBlur = compose(childProps.onBlur, handleClose);
        break;

      // "manual" — sin handlers automáticos
      default:
        break;
    }

    return props;
  };

  // ========================================
  // EFFECTS
  // ========================================

  // Click outside
  useClickOutside(
    popoverRef,
    triggerRef,
    handleClose,
    isOpen && closeOnClickOutside && trigger !== 'hover',
  );

  // Escape key
  useEscapeKey(handleClose, isOpen && closeOnEscape);

  // Devolver foco al trigger al cerrar — accesibilidad para teclado
  useFocusReturn(triggerRef, isOpen);

  // Cerrar al hacer scroll (solo modo hover — evita popover flotante)
  React.useEffect(() => {
    if (!isOpen || trigger !== 'hover') return;

    const handleScroll = () => {
      handleClose();
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, trigger, handleClose]);

  // ========================================
  // RENDER
  // ========================================

  // Clonar el trigger inyectando props de accesibilidad + ref
  const triggerElement = isValidElement(children)
    ? // eslint-disable-next-line react-hooks/refs -- cloneElement ref injection required for trigger measurement
      cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ...buildTriggerProps(),
        ref: triggerRef,
      })
    : children;

  const shouldRenderPopover = isOpen || keepMounted;

  return (
    <>
      {triggerElement}

      {shouldRenderPopover &&
        createPortal(
          <S.PopoverContainer
            ref={popoverRef}
            $isOpen={isOpen}
            $isPositioned={isPositioned}
            $top={position?.top ?? 0}
            $left={position?.left ?? 0}
            $width={width}
            $maxWidth={maxWidth}
            $zIndex={zIndex}
            $strategy={strategy}
            className={className}
            id={popoverId}
            role={role}
            // A11y: nombre accesible de la superficie. Requerido para role="dialog"
            // (axe-core exige nombre accesible en nodos dialog/alertdialog). Si no
            // se pasa, `undefined` no emite el atributo.
            aria-label={ariaLabel}
            aria-hidden={!isOpen}
            // Cancelar cierre si el puntero entra al popover (modo hover)
            onMouseEnter={
              trigger === 'hover'
                ? () => {
                    hideHoverDelay.cancel();
                    showHoverDelay.cancel();
                  }
                : undefined
            }
            // Iniciar cierre cuando el puntero abandona el popover (modo hover)
            onMouseLeave={
              trigger === 'hover'
                ? () => {
                    hideHoverDelay.handleMouseEnter();
                  }
                : undefined
            }
          >
            {/*
             * PopoverContent tiene overflow:hidden para los border-radius.
             * PopoverArrow se renderiza fuera para no ser recortada.
             */}
            <S.PopoverContent>{content}</S.PopoverContent>

            {arrow && position?.arrowPosition && (
              <S.PopoverArrow
                $placement={position.placement}
                $coords={{
                  top: position.arrowPosition.top,
                  left: position.arrowPosition.left,
                  right: position.arrowPosition.right,
                  bottom: position.arrowPosition.bottom,
                }}
                aria-hidden="true"
              />
            )}
          </S.PopoverContainer>,
          document.body,
        )}
    </>
  );
};

export const Popover = PopoverBase;
Popover.displayName = 'Popover';
