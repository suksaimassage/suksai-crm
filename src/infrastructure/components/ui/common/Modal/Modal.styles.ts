/**
 * Modal Component - Styled Components
 *
 * Responsabilidad: Estilos visuales del Modal
 *
 * Mobile First Design:
 * - Responsive en mobile
 * - Full screen en mobile para tamaños grandes
 *
 * Principios:
 * - Single Responsibility: Solo estilos
 * - Open/Closed: Extensible via props
 */

import styled, { css, keyframes } from 'styled-components';
import type { TModalSize, TModalPosition, TModalFooterAlign } from './Modal.types';

// ========================================
// ANIMATIONS
// ========================================

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideDown = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

// ========================================
// CONFIGURATION
// ========================================

/**
 * Configuración de tamaños
 */
const sizeConfig = {
  xs: {
    maxWidth: '400px',
    width: '90%',
  },
  sm: {
    maxWidth: '500px',
    width: '90%',
  },
  md: {
    maxWidth: '600px',
    width: '90%',
  },
  lg: {
    maxWidth: '800px',
    width: '90%',
  },
  xl: {
    maxWidth: '1000px',
    width: '90%',
  },
  full: {
    maxWidth: '100%',
    width: '100%',
  },
};

// ========================================
// BACKDROP (overlay)
// ========================================

export const Backdrop = styled.div<{
  $open: boolean;
  $blur: boolean;
  $animated: boolean;
}>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal || 1400};

  /* Fondo oscuro */
  background: ${({ theme }) => theme.color.overlay.dark || 'rgba(21, 20, 24, 0.8)'};

  /* Blur effect */
  ${({ $blur }) =>
    $blur &&
    css`
      backdrop-filter: blur(4px);
    `}

  /* Animación */
  ${({ $animated, $open }) =>
    $animated &&
    css`
      animation: ${$open ? fadeIn : fadeOut} 0.2s ease;
    `}

  /* Display */
  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

// ========================================
// MODAL CONTAINER
// ========================================

export const ModalContainer = styled.div<{
  $position: TModalPosition;
}>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal || 1400};

  /* Layout */
  display: flex;
  align-items: ${({ $position }) => {
    switch ($position) {
      case 'top':
        return 'flex-start';
      case 'bottom':
        return 'flex-end';
      case 'center':
      default:
        return 'center';
    }
  }};
  justify-content: center;

  /* Padding para que no toque los bordes en mobile */
  padding: ${({ theme }) => theme.spacing.md || '16px'};

  /* Permitir scroll si el contenido es muy alto */
  overflow-y: auto;

  /* Smooth scroll */
  -webkit-overflow-scrolling: touch;
`;

// ========================================
// MODAL CONTENT
// ========================================

export const ModalContent = styled.div<{
  $size: TModalSize;
  $position: TModalPosition;
  $animated: boolean;
  $open: boolean;
}>`
  ${({ theme, $size, $animated, $open, $position }) => {
    const { color, border, effect, breakpoint } = theme;

    const size = sizeConfig[$size];
    const animationMap = {
      top: slideDown,
      bottom: slideUp,
      center: scaleIn,
    };
    const animation = !$animated
      ? 'none'
      : css`
          ${$open ? animationMap[$position] : fadeOut} 0.3s ease
        `;

    return css`
      /* Size */
      width: ${size.width};
      max-width: ${size.maxWidth};

      /* Layout */
      position: relative;
      margin: auto;

      /* Surface */
      background: ${color.background.light};
      border-radius: ${border.radius.xl ?? '16px'};

      /* Elevation */
      box-shadow: ${effect.elevation.modal};

      /* Animation */
      animation: ${animation};

      /* Overflow */
      overflow: hidden;

      /* Mobile behavior — every size (incl. lg/xl/full) goes full-viewport,
         safe-area-aware, and becomes a flex column so Header/Body/Footer
         distribute the available height correctly (Body flexes/scrolls,
         Footer never gets clipped below the fold). */
      @media (max-width: ${breakpoint.md}) {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        width: 100vw;
        max-width: 100vw;
        max-height: 100dvh;
        height: 100dvh;
        border-radius: 0;
        margin: 0;
        overflow-y: auto;
        padding-bottom: env(safe-area-inset-bottom, 16px);
      }
    `;
  }}
`;

// ========================================
// MODAL HEADER
// ========================================

export const StyledModalHeader = styled.div`
  ${({ theme }) => {
    const { spacing } = theme;

    return css`
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.md};
      /* Padding */
      padding: ${spacing.lg};
      padding-bottom: ${spacing.md};
      /* Divider */
      border-bottom: 1px solid ${theme.border.color.neutral.light};
      /* No-op outside a flex parent; keeps this from shrinking when
         ModalContent becomes a flex column on mobile. */
      flex-shrink: 0;
    `;
  }}
`;

export const ModalHeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ModalTitle = styled.h2`
  ${({ theme }) => {
    const { typography, color } = theme;
    const body = typography.type.body;

    return css`
      margin: 0;
      font-family: ${body.fontFamily};
      font-size: ${body.fontSize.sm};
      font-weight: ${body.fontWeight};
      line-height: ${body.lineHeight.xs};
      color: ${color.text.primary};
      /* Truncate */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
  }}
`;

export const ModalSubtitle = styled.p`
  ${({ theme }) => {
    const { typography, color, spacing } = theme;
    const subtitle = typography.type.subtitle;

    return css`
      margin: ${spacing.xs} 0 0;
      font-family: ${subtitle.fontFamily};
      font-size: ${subtitle.fontSize.sm};
      line-height: ${subtitle.lineHeight.md};
      color: ${color.text.secondary};
    `;
  }}
`;

export const CloseButton = styled.button`
  ${({ theme }) => {
    const { color, border } = theme;

    return css`
      /* Reset */
      border: none;
      background: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
      /* Layout */
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      /* Size */
      width: 32px;
      height: 32px;
      border-radius: ${border.radius.md};
      /* Color */
      color: ${color.text.secondary};
      /* Transition */
      transition:
        background 0.2s ease,
        color 0.2s ease;
      /* Hover */
      &:hover {
        background: ${color.background.neutral};
        color: ${color.text.primary};
      }
      /* Active */
      &:active {
        background: ${color.background.neutral};
      }
      /* Focus */
      &:focus-visible {
        outline: 2px solid ${color.primary[500]};
        outline-offset: 2px;
      }
    `;
  }}
`;

// ========================================
// MODAL BODY
// ========================================

export const StyledModalBody = styled.div<{
  $padding: 'none' | 'sm' | 'md' | 'lg';
  $scrollable: boolean;
}>`
  ${({ theme, $padding, $scrollable }) => {
    const { spacing, typography, color, breakpoint } = theme;
    const body = typography.type.body;

    const paddingMap = {
      none: '0',
      sm: `${spacing.sm} ${spacing.lg}`,
      md: `${spacing.md} ${spacing.lg}`,
      lg: spacing.lg,
    };

    return css`
      /* Padding */
      padding: ${paddingMap[$padding]};

      /* Typography */
      font-family: ${body.fontFamily};
      font-size: ${body.fontSize.xs};
      line-height: ${body.lineHeight.md};
      color: ${color.text.primary};

      ${$scrollable
        ? css`
            /* Scrollable */
            max-height: 60vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
              width: 8px;
            }

            &::-webkit-scrollbar-track {
              background: ${color.background.neutral};
            }

            &::-webkit-scrollbar-thumb {
              background: ${color.neutral[400]};
              border-radius: 4px;
            }

            /* ModalContent is a flex column on mobile — flex to fill the
               space Header/Footer leave rather than a static 60vh, which
               can be LESS than what's actually available in a full-screen
               modal (or MORE, overflowing past the footer). */
            @media (max-width: ${breakpoint.md}) {
              flex: 1;
              min-height: 0;
              max-height: none;
            }
          `
        : ''}
    `;
  }}
`;

// ========================================
// MODAL FOOTER
// ========================================

export const StyledModalFooter = styled.div<{
  $align: TModalFooterAlign;
}>`
  ${({ theme, $align }) => {
    const { spacing, breakpoint } = theme;

    const alignMap = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end',
      between: 'space-between',
    };

    return css`
      display: flex;
      align-items: center;
      gap: ${spacing.sm};
      /* Padding */
      padding: ${spacing.lg} ${spacing.lg} ${spacing.md};
      /* Divider */
      border-top: 1px solid ${theme.border.color.neutral.light};
      /* Alignment */
      justify-content: ${alignMap[$align]};
      /* Responsive */
      flex-wrap: wrap;
      /* No-op outside a flex parent; keeps this pinned at the bottom (never
         squeezed) when ModalContent becomes a flex column on mobile. */
      flex-shrink: 0;

      @media (min-width: ${breakpoint.md}) {
        flex-wrap: nowrap;
      }
    `;
  }}
`;
