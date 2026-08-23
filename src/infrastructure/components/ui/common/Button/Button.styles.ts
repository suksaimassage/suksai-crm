/**
 * Button Component - Styled Components
 *
 * Responsabilidad: Estilos visuales del Button.
 *
 * Mobile First Design:
 * - Estilos base para mobile.
 * - Media queries para desktop.
 *
 * Principios SOLID:
 * - Single Responsibility: Solo estilos, sin lógica de negocio.
 * - Open/Closed: Extensible via props transient ($prefix).
 */

import styled, { css, type DefaultTheme } from 'styled-components';
import type { IStyledButtonProps } from './Button.types';
import { getShapeSizeIconOnly, getButtonSizeConfig, getButtonVariantColors } from './Button.utils';

// ========================================
// MIXINS & HELPERS
// ========================================

/*
 * ✅ FIX #1: Eliminado \\$ (escape incorrecto en template literal).
 *
 * ANTES: transition: all ${...duration} ${...easing}
 *        → CSS generado: "transition: all 200ms \ease-in-out"  ← inválido
 *
 * AHORA: transition: all ${...duration} ${...easing}
 *        → CSS generado: "transition: all 200ms cubic-bezier(...)" ← válido
 *
 * Además se eliminaron los ?. (optional chaining) innecesarios ya que
 * el theme está correctamente tipado via styled.d.ts.
 */
/**
 * Estilos base del botón — aplicados a todas las variantes.
 */
const baseButtonStyles = css`
  ${({ theme }) => {
    const { color, typography, transition } = theme;
    return css`
      /* Reset */
      appearance: none;
      border: 0;
      margin: 0;
      padding: 0;
      background-color: transparent;

      cursor: pointer;
      user-select: none;
      box-sizing: border-box;

      /* Typography */
      font-family: ${typography.type.body.fontFamily};
      font-weight: ${typography.type.body.fontWeight};
      line-height: ${typography.type.body.lineHeight.xs};
      text-decoration: none;

      /* Layout */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;

      /* Prevent layout shift */
      flex-shrink: 0;

      /* Transitions */
      transition:
        background-color ${transition.duration.base} ${transition.timing.easeInOut},
        color ${transition.duration.base} ${transition.timing.easeInOut},
        border-color ${transition.duration.base} ${transition.timing.easeInOut},
        box-shadow ${transition.duration.base} ${transition.timing.easeInOut},
        transform ${transition.duration.fast} ${transition.timing.easeOut};

      /* Focus (accesible) */
      &:focus-visible {
        outline: 2px solid ${color.primary[500]};
        outline-offset: 2px;
      }

      /* Disabled (base behavior) */
      &:disabled {
        cursor: not-allowed;
        pointer-events: none;
      }
    `;
  }}
`;

/**
 * Estilos de tamaño — height, padding, font-size, gap e icon-size.
 */
const sizeStyles = ($size: IStyledButtonProps['$size'], $iconOnly: boolean) => {
  const config = getButtonSizeConfig($size);

  return css`
    height: ${config.height};
    padding: ${$iconOnly ? '0' : config.padding};
    font-size: ${config.fontSize};
    gap: ${config.gap};

    /* Icon only: cuadrado perfecto */
    ${$iconOnly &&
    css`
      width: ${config.width};
      min-width: ${config.width};
    `}

    /* Tamaño de iconos SVG */
    svg,
    img {
      width: ${config.iconSize};
      height: ${config.iconSize};
      flex-shrink: 0;
    }
  `;
};

/**
 * Estilos de forma — border-radius según la shape prop.
 */
const shapeStyles = ($shape: IStyledButtonProps['$shape']) => {
  switch ($shape) {
    case 'rounded':
    case 'circle':
    case 'pill':
      return css`
        border-radius: ${({ theme }) => theme.border.radius.full};
      `;
    case 'square':
      return css`
        border-radius: 0;
      `;
    case 'default':
    default:
      return css`
        border-radius: ${({ theme }) => theme.border.radius.md};
      `;
  }
};

/**
 * Estilos de variante y color — fondo, texto, borde y estados interactivos.
 */
const variantStyles = (
  $color: IStyledButtonProps['$color'],
  $variant: IStyledButtonProps['$variant'],
  theme: DefaultTheme,
) => {
  const colors = getButtonVariantColors($color, $variant, theme);
  const borderStyle = $variant === 'dashed' ? 'dashed' : 'solid';

  return css`
    /* Estado normal */
    background: ${colors.background};
    color: ${colors.color} !important;
    border: 1px ${borderStyle} ${colors.border};
    /* Link: subrayado */
    ${$variant === 'link' &&
    css`
      text-decoration: underline;
      text-underline-offset: 2px;
    `}
    /* Hover */
    &:hover:not(:disabled) {
      background: ${colors.hover.background};
      color: ${colors.hover.color};
      border-color: ${colors.hover.border};
      transform: translateY(-1px);
      ${$variant === 'solid' &&
      css`
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      `}
    }
    /* Active */
    &:active:not(:disabled) {
      background: ${colors.active.background};
      color: ${colors.active.color};
      border-color: ${colors.active.border};
      transform: translateY(0);
      box-shadow: none;
    }
    /* Disabled */
    &:disabled {
      background-color: ${colors.disabled.background};
      color: ${colors.disabled.color};
      border-color: ${colors.disabled.border};
      cursor: not-allowed;
      opacity: 0.6;
      transform: none;
      box-shadow: none;
    }
  `;
};

/**
 * Estilos del estado loading — bloquea interacciones y fija los colores.
 */
const loadingStyles = (
  $loading: boolean,
  $color: IStyledButtonProps['$color'],
  $variant: IStyledButtonProps['$variant'],
  theme: DefaultTheme,
) => {
  if (!$loading) return css``;

  const colors = getButtonVariantColors($color, $variant, theme);

  return css`
    cursor: wait;
    background: ${colors.loading.background};
    color: ${colors.loading.color};
    border-color: ${colors.loading.border};

    /* Congelar hover/active mientras carga */
    &:hover,
    &:active {
      background: ${colors.loading.background};
      color: ${colors.loading.color};
      border-color: ${colors.loading.border};
      transform: none;
      box-shadow: none;
    }
  `;
};

// ========================================
// STYLED BUTTON
// ========================================

export const StyledButton = styled.button<IStyledButtonProps>`
  /* Base */
  ${baseButtonStyles}

  /* Tamaño */
  ${({ $size, $iconOnly }) => sizeStyles($size, $iconOnly)}

  /* Forma */
  ${({ $shape }) => shapeStyles($shape)}

  /* Variante & Color */
  ${({ theme, $color, $variant }) => variantStyles($color, $variant, theme)}

  /* Loading */
  ${({ theme, $loading, $color, $variant }) => loadingStyles($loading, $color, $variant, theme)}

  /* Full width */
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  /* Cursor disabled */
  ${({ $disabled }) =>
    $disabled &&
    css`
      cursor: not-allowed;
    `}

  /* ----------------------------------------
     Mobile First — Ajustes en desktop (≥768px)
     Los tamaños base son para mobile.
     En desktop se incrementan levemente.
     ---------------------------------------- */
  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    ${({ $size, $shape }) => {
      const desktopSizes: Record<string, ReturnType<typeof css>> = {
        xs: css`
          ${getShapeSizeIconOnly($size, $shape)}
          height: 26px;
          font-size: 13px;
        `,
        sm: css`
          ${getShapeSizeIconOnly($size, $shape)}
          height: 36px;
          font-size: 15px;
        `,
        md: css`
          ${getShapeSizeIconOnly($size, $shape)}
          height: 44px;
          font-size: 17px;
        `,
        lg: css`
          ${getShapeSizeIconOnly($size, $shape)}
          height: 52px;
          font-size: 19px;
        `,
        xl: css`
          ${getShapeSizeIconOnly($size, $shape)}
          height: 60px;
          font-size: 21px;
        `,
      };

      return desktopSizes[$size] ?? css``;
    }}
  }
`;

// ========================================
// ICON WRAPPER
// ========================================

export const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
