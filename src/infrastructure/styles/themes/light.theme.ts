/**
 * light.theme.ts — Light mode theme orchestrator
 *
 * Assembles all design tokens into the authoritative `theme` object.
 * This file contains NO raw values — all data lives in tokens/.
 *
 * SRP: compose tokens → export typed theme. Nothing else.
 */
import type { ITheme } from './theme.types';

import { breakpoint } from './tokens/breakpoint';
import { borderColorLight, borderRadius, borderStyle, borderWidth } from './tokens/border';
import {
  accentLight,
  backgroundLight,
  brandAgenda,
  gradientLight,
  intentLight,
  overlayLight,
  scrollbarLight,
  textLight,
} from './tokens/color';
import {
  primary,
  secondary,
  tertiary,
  neutral,
  neutralWarm,
  neutralDark,
  success,
  info,
  warning,
  error,
} from './tokens/colors';
import {
  blur,
  easing,
  elevationLight,
  glowPrimary,
  glowSecondary,
  shadowError,
  shadowInner,
  shadowOuter,
  shadowPrimary,
  shadowSecondary,
  shadowSuccess,
  skeleton,
} from './tokens/effect';
import { spacing } from './tokens/spacing';
import { transitionDuration, transitionTiming } from './tokens/transition';
import { fontFamily, fontSize, fontWeight, typographyType } from './tokens/typography';
import { zIndex } from './tokens/zIndex';

export const theme: ITheme = {
  color: {
    primary,
    secondary,
    tertiary,
    neutral,
    neutralWarm,
    neutralDark,
    success,
    info,
    warning,
    error,
    accent: accentLight,
    background: backgroundLight,
    text: textLight,
    intent: intentLight,
    gradient: gradientLight,
    overlay: overlayLight,
    scrollbar: scrollbarLight,
    brand: brandAgenda,
  },
  border: {
    width: borderWidth,
    color: borderColorLight,
    style: borderStyle,
    radius: borderRadius,
  },
  typography: {
    font: fontFamily,
    weight: fontWeight,
    size: fontSize,
    type: typographyType,
  },
  spacing,
  transition: {
    duration: transitionDuration,
    timing: transitionTiming,
  },
  effect: {
    shadow: {
      inner: shadowInner,
      outer: shadowOuter,
      primary: shadowPrimary,
      secondary: shadowSecondary,
      success: shadowSuccess,
      error: shadowError,
    },
    blur,
    glow: {
      primary: glowPrimary,
      secondary: glowSecondary,
    },
    skeleton,
    elevation: elevationLight,
    easing,
  },
  zIndex,
  breakpoint,
  isDark: false,
} as const;

export type TTheme = typeof theme;
export const lightTheme = theme;
