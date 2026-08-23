/**
 * Card Component - Styled Components
 *
 * Responsabilidad: Estilos visuales del Card
 *
 * Mobile First Design:
 * - Estilos base para mobile
 * - Media queries para tablets y desktop
 *
 * Principios aplicados:
 * - Single Responsibility: Solo estilos
 * - Open/Closed: Extensible via props, cerrado a modificación
 */

import styled, { css, type RuleSet } from 'styled-components';
import type { TCardVariant, TCardSize, TCardPadding, TCardFooterAlign } from './Card.types';

// ========================================
// HELPERS & MIXINS
// ========================================

/**
 * Mixin: Padding según tamaño
 * Mobile First: valores más pequeños en mobile, aumentan en desktop
 */
const paddingBySize = (size: TCardPadding = 'sm') => {
  const sizes: Record<TCardPadding, RuleSet<object>> = {
    none: css`
      padding: 0;
    `,
    sm: css`
      padding: ${({ theme }) => theme.spacing.sm};
    `,
    md: css`
      padding: ${({ theme }) => theme.spacing.md};
    `,
    lg: css`
      padding: ${({ theme }) => theme.spacing.lg};
    `,
  };

  return sizes[size];
};

/**
 * Mixin: Variante del Card
 */
const variantStyles = (variant: TCardVariant = 'default') => {
  const variants = {
    // Default: Fondo blanco con borde sutil
    default: css`
      background: ${({ theme }) => theme.color.background.card};
      border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
        ${({ theme }) => theme.border.color.neutral.light};
      box-shadow: none;
    `,

    // Outlined: Solo borde, sin fondo
    outlined: css`
      background: transparent;
      border: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
        ${({ theme }) => theme.border.color.neutral.light};
      box-shadow: none;
    `,

    // Elevated: Con sombra
    elevated: css`
      background: ${({ theme }) => theme.color.background.card};
      border: none;
      box-shadow: ${({ theme }) => theme.effect.shadow.outer.md};
    `,

    // Filled: Fondo con color
    filled: css`
      background: ${({ theme }) => theme.color.background.card};
      border: none;
      box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
    `,

    // Ghost: transparent, no border, no shadow
    ghost: css`
      background: transparent;
      border: none;
      box-shadow: none;
    `,
  };

  return variants[variant];
};

// ========================================
// CARD CONTAINER
// ========================================
const interactiveStyles = css`
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.effect.shadow.outer.lg};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${({ theme }) => theme.effect.shadow.outer.md};
  }
`;

const disabledStyles = css`
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed;
`;

export const StyledCard = styled.div<{
  $variant: TCardVariant;
  $size: TCardSize;
  $clickable: boolean;
  $fullWidth: boolean;
  $disabled: boolean;
}>`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Radius responsive */
  border-radius: ${({ theme }) => theme.border.radius.lg};

  /* Width */
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  max-width: 100%;

  /* Variant */
  ${({ $variant }) => variantStyles($variant)}

  /* States */
  ${({ $clickable, $disabled }) => $clickable && !$disabled && interactiveStyles}

  ${({ $disabled }) => $disabled && disabledStyles}

  /* Transitions */
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;

  /* Focus */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.primary[500]};
    outline-offset: 2px;
  }
`;

// ========================================
// CARD HEADER
// ========================================
const resolvePadding = ({
  $size,
  $customPadding,
}: {
  $size: TCardSize;
  $customPadding?: TCardPadding;
}) => {
  if ($customPadding === 'none') {
    return css`
      padding: 0;
    `;
  }

  if ($customPadding) {
    return paddingBySize($customPadding);
  }

  return paddingBySize($size);
};

export const StyledCardHeader = styled.div<{
  $size: TCardSize;
  $customPadding?: TCardPadding;
}>`
  ${(props) => resolvePadding(props)}

  display: flex;
  align-items: flex-start;

  /* Gap responsive */
  ${({ theme }) => css`
    gap: ${theme.spacing.md};

    @media (min-width: ${theme.breakpoint.md}) {
      gap: ${theme.spacing.lg};
    }
  `}

  /* Divider */
  border-bottom: ${({ theme }) => css`
    ${theme.border.width.xs} ${theme.border.style.dashed} ${theme.border.color.neutral.light}
  `};
`;

export const StyledCardHeaderContent = styled.div`
  flex: 1;
  min-width: 0; /* Fix para text overflow */
`;

export const StyledCardHeaderTitle = styled.h3`
  ${({ theme }) => {
    const t = theme.typography.type.headline;

    return css`
      margin: 0;
      font-family: ${t.fontFamily};
      font-weight: ${t.fontWeight};
      color: ${theme.color.text.primary};
      line-height: ${t.lineHeight.sm};
      /* Font size responsive (mobile-first) */
      font-size: ${t.fontSize.sm};

      @media (min-width: ${theme.breakpoint.md}) {
        font-size: ${t.fontSize.lg};
      }
    `;
  }}
`;

export const StyledCardHeaderSubtitle = styled.p`
  ${({ theme }) => {
    const t = theme.typography.type.subtitle;

    return css`
      margin: ${theme.spacing.xs} 0 0 0;
      font-family: ${t.fontFamily};
      font-weight: ${t.fontWeight};
      color: ${theme.color.text.secondary};
      line-height: ${t.lineHeight.sm};
      /* Mobile-first */
      font-size: ${t.fontSize.xs};

      @media (min-width: ${theme.breakpoint.md}) {
        font-size: ${t.fontSize.md};
      }
    `;
  }}
`;

export const StyledCardHeaderAvatar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledCardHeaderAction = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// ========================================
// CARD BODY
// ========================================

export const StyledCardBody = styled.div<{
  $size: TCardSize;
  $customPadding?: TCardPadding;
}>`
  ${({ theme, $customPadding }) => {
    const t = theme.typography.type.body;

    const padding = $customPadding === 'none' ? 'padding: 0;' : paddingBySize($customPadding);

    return css`
      /* Layout */
      flex: 1;

      /* Padding */
      ${padding}

      /* Typography */
      font-family: ${t.fontFamily};
      font-size: ${t.fontSize.sm};
      line-height: ${t.lineHeight.sm};
      color: ${theme.color.text.primary};
    `;
  }}
`;

// ========================================
// CARD FOOTER
// ========================================
const ALIGN_MAP = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
  between: 'space-between',
};

export const StyledCardFooter = styled.div<{
  $size: TCardSize;
  $align: TCardFooterAlign;
}>`
  ${({ theme, $size, $align }) => css`
    /* Layout */
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    /* Spacing */
    gap: ${theme.spacing.md};
    ${paddingBySize($size)}
    /* Divider */
    border-top: ${theme.border.width.xs} solid
      ${theme.border.color.neutral.light};
    /* Alignment */
    justify-content: ${ALIGN_MAP[$align]};
    /* Responsive */
    @media (min-width: ${theme.breakpoint.md}) {
      flex-wrap: nowrap;
    }
  `}
`;
