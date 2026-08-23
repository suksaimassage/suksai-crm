/**
 * Popover Component — Styled Components
 *
 * Responsabilidad: Estilos visuales del Popover
 *
 * Principios:
 * - Single Responsibility: Solo estilos
 * - Open/Closed: Extensible via props
 *
 * ✅ Flash fix:
 * $isPositioned controla visibility separado de $isOpen.
 * El popover está en el DOM (opacity:0, visibility:hidden) mientras
 * se calculan las coordenadas — NUNCA visible en (0,0).
 *
 * ✅ Performance:
 * $top/$left/$zIndex/$width/$maxWidth van por .attrs() como inline styles,
 * evitando que styled-components genere una clase CSS por cada valor
 * numérico (el bug "Over 200 classes" del sistema de posicionamiento).
 */

import styled, { css, type DefaultTheme } from 'styled-components';
import type { TPopoverPlacement } from './Popover.types';

// ========================================
// POPOVER CONTAINER
// ========================================

interface TPopoverContainerProps {
  $isOpen: boolean;
  /** True solo cuando se han calculado las coordenadas reales. */
  $isPositioned: boolean;
  $top: number;
  $left: number;
  $width?: string | number;
  $maxWidth?: string | number;
  $zIndex: number;
  $strategy: 'absolute' | 'fixed';
}

const toUnit = (value?: string | number): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

export const PopoverContainer = styled.div.attrs<TPopoverContainerProps>(
  ({ $top, $left, $zIndex, $width, $maxWidth }) => ({
    style: {
      top: `${$top}px`,
      left: `${$left}px`,
      zIndex: $zIndex,
      ...(toUnit($width) && { width: toUnit($width) }),
      ...(toUnit($maxWidth) && { maxWidth: toUnit($maxWidth) }),
    },
  }),
)<TPopoverContainerProps>`
  position: ${({ $strategy }) => $strategy};

  /*
   * ✅ TWO-PHASE VISIBILITY:
   *
   * Phase 1 — Not positioned yet ($isPositioned: false):
   *   visibility: hidden → completamente invisible, no ocupa espacio visual.
   *   opacity: 0 → invisible aunque el layout sea correcto.
   *   pointer-events: none → no intercepta eventos.
   *   NO transition en esta fase para evitar fade desde (0,0).
   *
   * Phase 2 — Positioned + Open:
   *   visibility: visible → visible.
   *   opacity: 1 + transform → fade in suave desde la posición correcta.
   *   transition → animación de apertura.
   */
  visibility: ${({ $isPositioned }) => ($isPositioned ? 'visible' : 'hidden')};
  opacity: ${({ $isOpen, $isPositioned }) => ($isOpen && $isPositioned ? 1 : 0)};
  transform: ${({ $isOpen, $isPositioned }) =>
    $isOpen && $isPositioned ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)'};
  pointer-events: ${({ $isOpen, $isPositioned }) => ($isOpen && $isPositioned ? 'auto' : 'none')};

  /* Transición solo cuando ya está posicionado para no animar desde (0,0) */
  transition: ${({ $isPositioned }) =>
    $isPositioned ? 'opacity 0.15s ease, transform 0.15s ease, visibility 0s' : 'none'};

  will-change: opacity, transform;
`;

// ========================================
// POPOVER CONTENT (Card-like surface)
// ========================================

export const PopoverContent = styled.div`
  ${({ theme }) => {
    const { color, border, effect } = theme;

    return css`
      background: ${color.background.light};
      border: ${border.width.xs} solid ${color.neutral[200]};
      border-radius: ${border.radius.lg};
      box-shadow: ${effect.elevation.popover};

      display: flex;
      flex-direction: column;
      overflow: hidden;

      min-width: 200px;
      max-width: min(400px, calc(100vw - 16px));
    `;
  }}
`;

// ========================================
// POPOVER ARROW
// ========================================

interface TArrowProps {
  $placement: TPopoverPlacement;
  $coords?: Partial<{
    top: string;
    left: string;
    right: string;
    bottom: string;
  }>;
}

const getArrowStyles = (theme: DefaultTheme, placement: TPopoverPlacement) => {
  const borderColor = theme.color.neutral[200];
  const bg = theme.color.background.light;

  const base = css`
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    background: ${bg};
  `;

  if (placement.startsWith('bottom')) {
    return css`
      &::before {
        ${base}
        border-top: 1px solid ${borderColor};
        border-left: 1px solid ${borderColor};
        clip-path: polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%);
        transform: translate(-50%, -30%) rotate(45deg);
        width: 10px;
        height: 20px;
      }
    `;
  }

  if (placement.startsWith('top')) {
    return css`
      &::before {
        ${base}
        border-bottom: 1px solid ${borderColor};
        border-right: 1px solid ${borderColor};
        clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);
        transform: translate(-50%, -70%) rotate(45deg);
        width: 10px;
        height: 20px;
      }
    `;
  }

  if (placement.startsWith('right')) {
    return css`
      &::before {
        ${base}
        border-bottom: 1px solid ${borderColor};
        border-left: 1px solid ${borderColor};
        clip-path: polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%);
        transform: translate(-30%, -50%) rotate(45deg);
        width: 20px;
        height: 10px;
      }
    `;
  }

  // left
  return css`
    &::before {
      ${base}
      border-top: 1px solid ${borderColor};
      border-right: 1px solid ${borderColor};
      clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%);
      transform: translate(-71.5%, -60%) rotate(45deg);
      width: 20px;
      height: 10px;
    }
  `;
};

/**
 * Arrow se renderiza FUERA de PopoverContent para no ser recortada
 * por el overflow:hidden del border-radius.
 *
 * .attrs() para coords de posición → evita nuevas clases CSS por px.
 */
export const PopoverArrow = styled.div.attrs<TArrowProps>(({ $coords }) => ({
  style: { ...$coords },
}))<TArrowProps>`
  position: absolute;
  width: 16px;
  height: 16px;
  pointer-events: none;
  z-index: 1;

  ${({ theme, $placement }) => getArrowStyles(theme, $placement)}
`;

// ========================================
// POPOVER HEADER
// ========================================

export const StyledPopoverHeader = styled.div`
  ${({ theme }) => {
    const { spacing, color } = theme;

    return css`
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.sm};
      padding: ${spacing.md} ${spacing.md} ${spacing.sm};
      border-bottom: ${theme.border.width.xs} solid ${color.neutral[200]};
    `;
  }}
`;

export const PopoverHeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const PopoverTitle = styled.h3`
  ${({ theme }) => {
    const { typography, color } = theme;

    return css`
      margin: 0;
      font-family: ${typography.font.display};
      font-size: ${typography.size.sm};
      font-weight: ${typography.weight.semibold};
      line-height: 1.25;
      color: ${color.text.primary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
  }}
`;

export const CloseButton = styled.button`
  ${({ theme }) => {
    const { color, border, spacing } = theme;

    return css`
      appearance: none;
      border: none;
      background: transparent;
      padding: ${spacing.xs};
      margin: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: ${border.radius.sm};
      color: ${color.text.tertiary};
      transition:
        background 0.15s ease,
        color 0.15s ease;

      &:hover {
        background: ${color.neutral[100]};
        color: ${color.text.primary};
      }

      &:active {
        background: ${color.neutral[200]};
      }

      &:focus-visible {
        outline: 2px solid ${color.primary[500]};
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }
    `;
  }}
`;

// ========================================
// POPOVER BODY
// ========================================

interface TPopoverBodyProps {
  $padding: 'none' | 'sm' | 'md' | 'lg';
  $scrollable: boolean;
}

export const StyledPopoverBody = styled.div<TPopoverBodyProps>`
  ${({ theme, $padding, $scrollable }) => {
    const { spacing, typography, color } = theme;

    const paddingMap: Record<'none' | 'sm' | 'md' | 'lg', string> = {
      none: '0',
      sm: `${spacing.sm} ${spacing.md}`,
      md: spacing.md,
      lg: spacing.lg,
    };

    return css`
      padding: ${paddingMap[$padding]};
      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      line-height: 1.5;
      color: ${color.text.primary};

      ${$scrollable &&
      css`
        max-height: 300px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: ${color.neutral[300]} transparent;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: ${color.neutral[300]};
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: ${color.neutral[400]};
        }
      `}
    `;
  }}
`;

// ========================================
// TRIGGER WRAPPER
// ========================================

/**
 * display:contents hace que el wrapper sea invisible al layout:
 * no ocupa espacio, no crea box container, no rompe flex/grid del padre.
 */
export const TriggerWrapper = styled.span`
  display: contents;
`;
