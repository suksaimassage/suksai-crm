/**
 * Avatar Component - Styled Components
 *
 * Responsabilidad: Estilos visuales del Avatar
 *
 * Mobile First Design:
 * - Tamaños touch-friendly
 * - Responsive
 *
 * Principios:
 * - Single Responsibility: Solo estilos
 * - Open/Closed: Extensible via props
 */

import styled, { css, keyframes, type DefaultTheme } from 'styled-components';
import type {
  TAvatarSize,
  TAvatarShape,
  TAvatarColor,
  TAvatarBorderWidth,
  TAvatarBadgePosition,
  TAvatarBadgeSize,
  TAvatarGroupSpacing,
  TAvatarBadgeStatus,
} from './Avatar.types';
import type { TColorScale } from '@infra/styles/themes/theme.types';

// Local alias so helper signatures are concise
type Theme = DefaultTheme;

// ========================================
// CONFIGURATION
// ========================================

/**
 * Configuración de tamaños
 * Mobile First: tamaños optimizados para touch
 */
interface ISizeConfig {
  readonly size: string;
  readonly fontSize: string;
  readonly badgeSize: string;
}

const sizeConfig: Record<TAvatarSize, ISizeConfig> = {
  xs: {
    size: '24px',
    fontSize: '10px',
    badgeSize: '8px',
  },
  sm: {
    size: '32px',
    fontSize: '12px',
    badgeSize: '10px',
  },
  md: {
    size: '40px',
    fontSize: '14px',
    badgeSize: '12px',
  },
  lg: {
    size: '48px',
    fontSize: '16px',
    badgeSize: '14px',
  },
  xl: {
    size: '64px',
    fontSize: '20px',
    badgeSize: '16px',
  },
  '2xl': {
    size: '80px',
    fontSize: '24px',
    badgeSize: '18px',
  },
};

// ========================================
// ANIMATIONS
// ========================================

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const ping = keyframes`
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
`;

// ========================================
// HELPERS
// ========================================

/**
 * Obtiene color del theme
 */
const getColorValue = (color: TAvatarColor, shade: TColorScale, theme: Theme) => {
  return theme.color[color][shade];
};

/**
 * Mixin de tamaño
 */
const sizeStyles = (size: TAvatarSize) => css`
  width: ${sizeConfig[size].size};
  height: ${sizeConfig[size].size};
  font-size: ${sizeConfig[size].fontSize};
`;

/**
 * Mixin de forma
 */
const shapeStyles = (shape: TAvatarShape) => {
  const shapes = {
    circle: css`
      border-radius: ${({ theme }) => theme.border.radius.full};
    `,
    rounded: css`
      border-radius: ${({ theme }) => theme.border.radius.lg};
    `,
    square: css`
      border-radius: ${({ theme }) => theme.border.radius.sm};
    `,
  };

  return shapes[shape];
};

/**
 * Mixin de borde
 */
const borderStyles = (bordered: boolean, borderWidth: TAvatarBorderWidth) => {
  if (!bordered) return css``;

  const widths: Record<TAvatarBorderWidth, string> = {
    thin: '2px',
    medium: '3px',
    thick: '4px',
  };

  return css`
    border: ${widths[borderWidth]} solid ${({ theme }) => theme.color.background.light};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.border.color.neutral.medium};
  `;
};

// ========================================
// AVATAR CONTAINER
// ========================================

export const StyledAvatar = styled.div<{
  $size: TAvatarSize;
  $shape: TAvatarShape;
  $color: TAvatarColor;
  $bordered: boolean;
  $borderWidth: TAvatarBorderWidth;
  $disabled: boolean;
  $clickable: boolean;
  $loading: boolean;
  $skeleton: boolean;
}>`
  /* Base styles */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  /* Typography */
  font-family: ${({ theme }) => theme.typography.type.body.fontFamily};
  font-weight: ${({ theme }) => theme.typography.type.body.fontWeight};
  line-height: 1;
  text-transform: uppercase;
  user-select: none;

  /* Color de fondo para iniciales */
  background: ${({ $color, theme }) => getColorValue($color, 500, theme)};
  color: ${({ theme }) => theme.color.text.inverse};

  /* Tamaño */
  ${({ $size }) => sizeStyles($size)}

  /* Forma */
  ${({ $shape }) => shapeStyles($shape)}

  /* Borde */
  ${({ $bordered, $borderWidth }) => borderStyles($bordered, $borderWidth)}

  /* Overflow */
  overflow: visible;

  /* Transición */
  transition: all 0.2s ease;

  /* Clickable */
  ${({ $clickable, $disabled }) =>
    $clickable &&
    !$disabled &&
    css`
      cursor: pointer;

      &:hover {
        transform: scale(1.05);
        box-shadow: ${({ theme }) => theme.effect.shadow.outer.md};
      }

      &:active {
        transform: scale(0.98);
      }
    `}

  /* Disabled */
  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(100%);
    `}

  /* Loading */
  ${({ $loading }) =>
    $loading &&
    css`
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}

  /* Skeleton */
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      background: linear-gradient(
        90deg,
        ${({ theme }) => (theme.isDark ? 'oklch(0.32 0.05 204)' : theme.color.neutral[200])} 0%,
        ${({ theme }) => (theme.isDark ? 'oklch(0.23 0.04 204)' : theme.color.neutral[100])} 50%,
        ${({ theme }) => (theme.isDark ? 'oklch(0.32 0.05 204)' : theme.color.neutral[200])} 100%
      );
      background-size: 200% 100%;
      animation: ${shimmer} 1.5s ease-in-out infinite;
      color: transparent;
    `}

  /* Focus visible */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.primary[500]};
    outline-offset: 2px;
  }
`;

// ========================================
// AVATAR IMAGE
// ========================================

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
`;

// ========================================
// AVATAR INITIALS
// ========================================

export const AvatarInitials = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

// ========================================
// AVATAR BADGE
// ========================================

export const StyledAvatarBadge = styled.div<{
  $position: TAvatarBadgePosition;
  $size: TAvatarBadgeSize;
  $color: string;
  $bordered: boolean;
  $ping: boolean;
}>`
  position: absolute;

  /* Posición */
  ${({ $position }) => {
    switch ($position) {
      case 'top-right':
        return css`
          top: 0;
          right: 0;
          transform: translate(0%, -25%);
        `;
      case 'top-left':
        return css`
          top: 0;
          left: 0;
          transform: translate(-25%, 0%);
        `;
      case 'bottom-right':
        return css`
          bottom: 0;
          right: 0;
          transform: translate(0%, 25%);
        `;
      case 'bottom-left':
        return css`
          bottom: 0;
          left: 0;
          transform: translate(-25%, 0%);
        `;
    }
  }}

  /* Tamaño */
  ${({ $size }) => {
    const sizes: Record<TAvatarBadgeSize, string> = {
      sm: '14px',
      md: '16px',
      lg: '18px',
    };
    return css`
      width: ${sizes[$size]};
      height: ${sizes[$size]};
    `;
  }}

  /* Color */
  background: ${({ $color, theme }) => {
    // Colores especiales de status
    const statusColors: Record<string, string> = {
      online: theme.color.success[500],
      offline: theme.color.neutral[400],
      busy: theme.color.error[500],
      away: theme.color.warning[500],
    };

    return statusColors[$color];
  }};

  /* Forma */
  border-radius: ${({ theme }) => theme.border.radius.full};

  /* Borde */
  ${({ $bordered }) =>
    $bordered &&
    css`
      border: 2px solid ${({ theme }) => theme.color.background.light};
    `}

  /* Contenido centrado */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Ping animation */
  ${({ $ping }) =>
    $ping &&
    css`
      &::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: inherit;
        background: inherit;
        animation: ${ping} 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
    `}
`;

// ========================================
// AVATAR GROUP
// ========================================

export const StyledAvatarGroup = styled.div<{
  $spacing: TAvatarGroupSpacing;
}>`
  display: inline-flex;
  align-items: center;

  /* Spacing entre avatares (overlap) */
  ${({ $spacing }) => {
    const spacings = {
      tight: css`
        & > * {
          margin-left: -12px;

          &:first-child {
            margin-left: 0;
          }
        }
      `,
      normal: css`
        & > * {
          margin-left: -8px;

          &:first-child {
            margin-left: 0;
          }
        }
      `,
      loose: css`
        & > * {
          margin-left: -4px;

          &:first-child {
            margin-left: 0;
          }
        }
      `,
    };

    return spacings[$spacing];
  }}

  /* Z-index para hover */
  & > * {
    position: relative;

    &:hover {
      z-index: 10;
    }
  }
`;

// ========================================
// EXCESS AVATAR (+N)
// ========================================

export const ExcessAvatar = styled(StyledAvatar)`
  background: ${({ theme }) => theme.color.neutral[600]};
  color: ${({ theme }) => theme.color.text.inverse};
  font-weight: ${({ theme }) => theme.typography.type.body.fontWeight};
`;

// Ejemplo de badge de status
export const StatusBadge = styled.div<{
  $status: TAvatarBadgeStatus;
}>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.color.background.card};
  background: ${({ $status, theme }) => {
    const colors: Record<TAvatarBadgeStatus, string> = {
      online: theme.color.success[500],
      offline: theme.color.neutral[400],
      busy: theme.color.error[500],
      away: theme.color.warning[500],
    };
    return colors[$status];
  }};
  z-index: ${({ theme }) => theme.zIndex.dropdown};
`;
