/**
 * Image.styles.ts
 *
 * All styled-components and keyframe animations for the Image + Lightbox.
 * Path: src/components/ui/common/Image/Image.styles.ts
 */

import styled, { css, keyframes } from 'styled-components';
import type {
  BackdropProps,
  ContentShellProps,
  SkeletonProps,
  StyledImgProps,
  ThumbnailWrapperProps,
  ZoomBadgeProps,
} from './Image.types';
import { ANIM_MS } from './Image.constants';

// ─────────────────────────────────────────────────────────────
// KEYFRAMES
// ─────────────────────────────────────────────────────────────

const backdropIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const backdropOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const contentIn = keyframes`
  from { opacity: 0; transform: scale(0.84); }
  to   { opacity: 1; transform: scale(1); }
`;

const contentOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.92); }
`;

/** Horizontal shimmer sweep for the skeleton loader */
export const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

// ─────────────────────────────────────────────────────────────
// THUMBNAIL
// ─────────────────────────────────────────────────────────────

export const ThumbnailWrapper = styled.div<ThumbnailWrapperProps>`
  position: relative;
  display: block;
  overflow: hidden;
  background-color: ${({ theme }) => theme.color.neutral[100]};

  width: ${({ $width }) =>
    $width == null ? '100%' : typeof $width === 'number' ? `${$width}px` : $width};

  ${({ $height }) =>
    $height != null && `height: ${typeof $height === 'number' ? `${$height}px` : $height};`}

  ${({ $aspectRatio }) => $aspectRatio && `aspect-ratio: ${$aspectRatio};`}

  border-radius: ${({ $borderRadius, theme }) => $borderRadius ?? theme.border.radius.md};

  cursor: ${({ $interactive }) => ($interactive ? 'zoom-in' : 'default')};

  ${({ $interactive, theme }) =>
    $interactive &&
    css`
      transition:
        transform ${theme.transition.duration.base} ${theme.transition.timing.easeOut},
        box-shadow ${theme.transition.duration.base} ${theme.transition.timing.easeOut};
      will-change: transform;

      &:hover {
        transform: scale(1.015);
        box-shadow: ${theme.effect.shadow.outer.lg};
      }

      &:active {
        transform: scale(0.985);
      }
    `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 3px;
  }
`;

export const StyledImg = styled.img<StyledImgProps>`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: ${({ $objectFit }) => $objectFit};
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity ${({ theme }) => theme.transition.duration.slow}
    ${({ theme }) => theme.transition.timing.easeOut};
  will-change: opacity;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
`;

export const SkeletonShimmer = styled.div<SkeletonProps>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.neutral[100]} 25%,
    ${({ theme }) => theme.color.neutral[200]} 50%,
    ${({ theme }) => theme.color.neutral[100]} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${({ theme }) => theme.transition.duration.slow}
    ${({ theme }) => theme.transition.timing.easeOut};
`;

export const FigCaption = styled.figcaption`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.tertiary};
  text-align: center;
  line-height: 1.5;
`;

// ─────────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────────

/**
 * Full-viewport backdrop.
 * Background color is overridden inline during swipe-to-close so
 * opacity dims proportionally with the drag offset.
 */
export const Backdrop = styled.div<BackdropProps>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  /* default — overridden inline during swipe */
  background: rgba(14, 13, 17, 0.94);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  overscroll-behavior: contain;

  ${({ $phase }) =>
    $phase === 'entering' &&
    css`
      animation: ${backdropIn} ${ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
    `}

  ${({ $phase }) =>
    $phase === 'exiting' &&
    css`
      animation: ${backdropOut} ${ANIM_MS}ms cubic-bezier(0.4, 0, 1, 1) both;
    `}
`;

/**
 * Uses `display: contents` so the keyframe applies to its direct child
 * (ImageTransformLayer) without introducing an extra layout box.
 * This isolates the enter/exit scale animation from zoom/swipe transforms,
 * which live on the child via inline style.
 */
export const ContentAnimationShell = styled.div<ContentShellProps>`
  display: contents;

  ${({ $phase }) =>
    $phase === 'entering' &&
    css`
      & > * {
        animation: ${contentIn} ${ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
    `}

  ${({ $phase }) =>
    $phase === 'exiting' &&
    css`
      & > * {
        animation: ${contentOut} ${ANIM_MS}ms cubic-bezier(0.4, 0, 1, 1) both;
      }
    `}
`;

/**
 * Receives zoom + swipe transforms exclusively via inline style.
 * Keeping dynamic transforms off styled-component props prevents
 * a new CSS class being injected on every animation frame.
 */
export const ImageTransformLayer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  will-change: transform;
  transform-origin: center center;
`;

export const LightboxImg = styled.img`
  display: block;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: ${({ theme }) => theme.border.radius.md};
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
`;

export const CloseBtn = styled.button`
  position: fixed;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  z-index: ${({ theme }) => theme.zIndex.modal + 10};
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid oklch(1 0 0 / 0.12);
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: oklch(1 0 0 / 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: ${({ theme }) => theme.color.text.inverse};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    transform ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
    transform: scale(0.9);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    pointer-events: none;
  }
`;

export const ZoomBadge = styled.div<ZoomBadgeProps>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.xl};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${({ theme }) => theme.zIndex.modal + 10};
  padding: ${({ theme }) => `${theme.spacing.xxs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: rgba(255, 255, 255, 0.8);
  pointer-events: none;
  white-space: nowrap;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${({ theme }) => theme.transition.duration.slow}
    ${({ theme }) => theme.transition.timing.easeOut};
`;
