/**
 * Skeleton Styles
 */

import styled, { css, type DefaultTheme, keyframes } from 'styled-components';
import type { ISkeletonBaseProps, TSkeletonSpeed } from './Skeleton.types';

// ========================================
// KEYFRAME ANIMATION
// ========================================

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

/* ------------------ Helpers ------------------ */

const toCssSize = (value?: string | number) => (typeof value === 'number' ? `${value}px` : value);

const getWidth = ($width?: string | number, $variant?: string) => {
  if ($width) return toCssSize($width);
  return $variant === 'text' ? '100%' : 'auto';
};

const getHeight = ($height?: string | number, $variant?: string) => {
  if ($height) return toCssSize($height);

  const map = {
    text: '1em',
    circular: '40px',
    rectangular: '100px',
  };

  return map[$variant as keyof typeof map];
};

const getBorderRadius = ({
  $borderRadius,
  $variant,
  theme,
}: ISkeletonBaseProps & { theme: DefaultTheme }) => {
  if ($borderRadius) return $borderRadius;

  const map = {
    circular: theme.border.radius.full,
    rectangular: theme.border.radius.md,
    text: theme.border.radius.xs,
  };

  return map[$variant];
};

const getAnimation = ($animation: boolean, $speed: TSkeletonSpeed, theme: DefaultTheme) => {
  const { effect } = theme;
  if (!$animation) return;
  return css`
    background-image: ${effect.skeleton.gradient.light};
    background-size: 200% 100%;
    animation: ${shimmer} ${effect.skeleton.speed[$speed]}
      ${effect.skeleton.animation.timingFunction} ${effect.skeleton.animation.iterationCount};
  `;
};

// ========================================
// STYLED COMPONENT
// ========================================

export const SkeletonBase = styled.div<ISkeletonBaseProps>`
  display: block;

  /* Size */
  width: ${({ $width, $variant }) => getWidth($width, $variant)};
  height: ${({ $height, $variant }) => getHeight($height, $variant)};

  /* Base */
  background-color: ${({ theme }) => theme.color.neutral[200]};

  /* Animation */
  ${({ $animation, $speed, theme }) => getAnimation($animation, $speed, theme)}

  /* Shape */
  border-radius: ${(props) => getBorderRadius(props)};

  /* Text variant tweak */
  ${({ $variant }) =>
    $variant === 'text' &&
    css`
      transform: scale(1, 0.6);
      transform-origin: left center;
    `}

  /* Rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;
