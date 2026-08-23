/**
 * Empty Component Styles
 *
 * All styled-components for the Empty system.
 * Uses only theme tokens — no hardcoded values.
 * SRP: Styling layer only.
 */

import styled, { css, keyframes } from 'styled-components';
import type { TEmptySize, TEmptyVariant, TEmptyAnimation } from './Empty.types';
import { EMPTY_SIZES } from './Empty.config';

// ─── Keyframes ────────────────────────────────────────────────────────────────

const floatKf = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
`;

const pulseKf = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.96); }
`;

const shimmerKf = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const entranceKf = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)     scale(1);    }
`;

const dragGlowKf = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 var(--empty-glow-off, transparent); }
  50%       { box-shadow: 0 0 0 6px var(--empty-glow, oklch(0.55 0.22 283 / 0.15)); }
`;

// ─── Animation mixin ─────────────────────────────────────────────────────────

const getAnimationMixin = (animation: TEmptyAnimation) => {
  switch (animation) {
    case 'float':
      return css`
        animation: ${floatKf} 3s ease-in-out infinite;
      `;
    case 'pulse':
      return css`
        animation: ${pulseKf} 2s ease-in-out infinite;
      `;
    case 'shimmer':
      return css`
        background: linear-gradient(
          90deg,
          transparent 0%,
          var(--empty-shimmer, oklch(1 0 0 / 0.15)) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: ${shimmerKf} 2s linear infinite;
      `;
    default:
      return css``;
  }
};

// ─── Variant mixins ──────────────────────────────────────────────────────────

const variantMixin = (variant: TEmptyVariant) => {
  switch (variant) {
    case 'card':
      return css`
        background-color: ${({ theme }) => theme.color.background.light};
        border: ${({ theme }) => theme.border.width.xs} solid
          ${({ theme }) => theme.border.color.neutral.light};
        border-radius: ${({ theme }) => theme.border.radius.lg};
        box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
      `;
    case 'subtle':
      return css`
        background-color: ${({ theme }) => theme.color.background.neutral};
        border-radius: ${({ theme }) => theme.border.radius.md};
        opacity: 0.85;
      `;
    case 'fullscreen':
      return css`
        position: fixed;
        inset: 0;
        z-index: ${({ theme }) => theme.zIndex.overlay};
        background-color: ${({ theme }) => theme.color.background.light};
        max-width: none;
        border-radius: 0;
      `;
    default:
      return css``;
  }
};

// ─── Drag-over mixin ─────────────────────────────────────────────────────────

const dragOverMixin = css`
  background-color: ${({ theme }) => theme.color.overlay.primary};
  border-color: ${({ theme }) => theme.border.color.primary.strong};
  animation: ${dragGlowKf} 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    outline: 2px dashed ${({ theme }) => theme.border.color.primary.strong};
  }
`;

// ─── Root container ───────────────────────────────────────────────────────────

interface IStyledEmptyProps {
  $size: TEmptySize;
  $variant: TEmptyVariant;
  $isDragOver: boolean;
}

export const StyledEmpty = styled.section<IStyledEmptyProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  max-width: ${({ $size }) => EMPTY_SIZES[$size].maxWidth};
  padding: ${({ $size }) => EMPTY_SIZES[$size].padding};
  gap: ${({ $size }) => EMPTY_SIZES[$size].gap};
  margin: 0 auto;
  --empty-glow: ${({ theme }) => theme.color.overlay.primary};
  --empty-shimmer: ${({ theme }) => (theme.isDark ? 'oklch(1 0 0 / 0.10)' : 'oklch(1 0 0 / 0.40)')};

  /* Entrance animation */
  animation: ${entranceKf} ${({ theme }) => theme.transition.duration.slow}
    ${({ theme }) => theme.transition.timing.easeOut} both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* Variant */
  ${({ $variant }) => variantMixin($variant)}

  /* Drag over */
  ${({ $isDragOver }) => $isDragOver && dragOverMixin}

  /* Fullscreen centering override */
  ${({ $variant }) =>
    $variant === 'fullscreen' &&
    css`
      max-width: none;
      padding: 0;
    `}

  transition:
    background-color ${({ theme }) => theme.transition.duration.base} ${({ theme }) =>
    theme.transition.timing.easeOut},
    border-color     ${({ theme }) => theme.transition.duration.base} ${({ theme }) =>
    theme.transition.timing.easeOut},
    box-shadow       ${({ theme }) => theme.transition.duration.base} ${({ theme }) =>
    theme.transition.timing.easeOut};
`;

// ─── Illustration wrapper ─────────────────────────────────────────────────────

interface IStyledIllustrationProps {
  $size: TEmptySize;
  $animation: TEmptyAnimation;
  $isDragOver: boolean;
}

export const StyledIllustration = styled.div<IStyledIllustrationProps>`
  width: ${({ $size }) => EMPTY_SIZES[$size].illustrationSize}px;
  height: ${({ $size }) => EMPTY_SIZES[$size].illustrationSize}px;
  flex-shrink: 0;
  color: ${({ theme }) => (theme.isDark ? theme.color.primary[600] : theme.color.primary[500])};
  will-change: transform, opacity;

  ${({ $animation }) => $animation !== 'none' && getAnimationMixin($animation)}

  ${({ $isDragOver }) =>
    $isDragOver &&
    css`
      color: ${({ theme }) => theme.color.primary[600]};
      transform: scale(1.05);
      animation: none;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }

  svg,
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  transition:
    color ${({ theme }) => theme.transition.duration.base} ease,
    transform ${({ theme }) => theme.transition.duration.base} ease;
`;

// ─── Icon wrapper ─────────────────────────────────────────────────────────────

interface IStyledIconProps {
  $size: TEmptySize;
  $animation: TEmptyAnimation;
}

export const StyledIcon = styled.div<IStyledIconProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => EMPTY_SIZES[$size].iconSize * 2}px;
  height: ${({ $size }) => EMPTY_SIZES[$size].iconSize * 2}px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background-color: ${({ theme }) =>
    theme.isDark ? theme.color.overlay.primary : theme.color.primary[500]};
  color: ${({ theme }) => (theme.isDark ? theme.color.primary[400] : theme.color.text.inverse)};
  flex-shrink: 0;
  will-change: transform, opacity;

  ${({ $animation }) => $animation !== 'none' && getAnimationMixin($animation)}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  svg {
    width: ${({ $size }) => EMPTY_SIZES[$size].iconSize}px;
    height: ${({ $size }) => EMPTY_SIZES[$size].iconSize}px;
  }
`;

// ─── Text area ────────────────────────────────────────────────────────────────

export const StyledContent = styled.div<{ $size: TEmptySize }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ $size }) => ($size === 'xs' ? '4px' : $size === 'sm' ? '6px' : '8px')};
`;

// ─── Actions slot ─────────────────────────────────────────────────────────────

export const StyledActions = styled.div<{ $size: TEmptySize }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${({ $size }) => ($size === 'xs' ? '6px' : $size === 'sm' ? '8px' : '12px')};
  margin-top: ${({ $size }) => ($size === 'xs' ? '4px' : $size === 'sm' ? '6px' : '8px')};
`;

// ─── Drag-over label ─────────────────────────────────────────────────────────

export const StyledDragLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.primary[600]};
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background-color: ${({ theme }) => theme.color.overlay.primary};
  animation: ${pulseKf} 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
