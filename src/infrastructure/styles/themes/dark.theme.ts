/**
 * dark.theme.ts — Dark mode theme orchestrator
 *
 * Overrides only the tokens that differ in dark mode.
 * Everything else (palettes, spacing, typography, breakpoints,
 * transitions, z-index) is inherited from the light theme.
 *
 * SRP: compose dark-mode token overrides → export darkTheme. Nothing else.
 *
 * Dark mode strategy:
 *   - neutral palette  → neutralDark scale (deep teal)
 *   - Backgrounds flip → neutralDark surfaces
 *   - Text flips       → neutralWarm
 *   - Brand accents    → unchanged
 *   - Intent colors    → one stop lighter for dark surface contrast
 *   - Shadows          → opacity × 0.70, near-black teal base
 */

import { theme, type TTheme } from '@infra/styles/themes/light.theme';
import { borderColorNeutralDark } from './tokens/border';
import { backgroundDark, intentDark, overlayDark, scrollbarDark, textDark } from './tokens/color';
import { neutralDark } from './tokens/colors';
import { elevationDark, shadowInnerDark, shadowOuterDark } from './tokens/effect';

export const darkTheme: TTheme = {
  ...theme,
  color: {
    ...theme.color,
    // neutral alias → neutralDark scale in dark mode
    neutral: neutralDark,
    background: backgroundDark,
    text: textDark,
    intent: intentDark,
    overlay: overlayDark,
    scrollbar: scrollbarDark,
  },
  border: {
    ...theme.border,
    color: {
      ...theme.border.color,
      neutral: borderColorNeutralDark,
    },
  },
  effect: {
    ...theme.effect,
    shadow: {
      ...theme.effect.shadow,
      inner: shadowInnerDark,
      outer: shadowOuterDark,
    },
    elevation: elevationDark,
  },
  isDark: true,
};
