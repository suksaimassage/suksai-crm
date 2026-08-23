/**
 * Badge — Styled Components
 *
 * Token-map centralizado: cada color define 4 modos (solid/soft/outline/dot).
 * SRP: solo estilos. Cero lógica de negocio.
 */
import styled, { css, type DefaultTheme } from 'styled-components';
import {
  ALPHAS,
  colorMixAlpha,
  getColor,
  getContrastText,
} from '@infra/styles/themes/theme.helpers';
import type { TColorName, TColorScale } from '@infra/styles/themes/theme.types';
import type { TBadgeColor, TBadgeVariant, TBadgeSize } from './Badge.types';

// ─── Color tokens ──────────────────────────────────────────────────────────

export interface IColorTokens {
  solidBg: TColorName;
  softBg: TColorName;
  softFg: TColorName;
  border: TColorName;
  outlineFg: TColorName;
  dot: TColorName;
}

export const getTokens = (color: TBadgeColor): IColorTokens => {
  const map: Record<TBadgeColor, IColorTokens> = {
    primary: {
      solidBg: 'primary',
      softBg: 'primary',
      softFg: 'primary',
      border: 'primary',
      outlineFg: 'primary',
      dot: 'primary',
    },
    secondary: {
      solidBg: 'secondary',
      softBg: 'secondary',
      softFg: 'secondary',
      border: 'secondary',
      outlineFg: 'secondary',
      dot: 'secondary',
    },
    tertiary: {
      solidBg: 'tertiary',
      softBg: 'tertiary',
      softFg: 'tertiary',
      border: 'tertiary',
      outlineFg: 'tertiary',
      dot: 'tertiary',
    },
    neutral: {
      solidBg: 'neutral',
      softBg: 'neutral',
      softFg: 'neutral',
      border: 'neutral',
      outlineFg: 'neutral',
      dot: 'neutral',
    },
    success: {
      solidBg: 'success',
      softBg: 'success',
      softFg: 'success',
      border: 'success',
      outlineFg: 'success',
      dot: 'success',
    },
    info: {
      solidBg: 'info',
      softBg: 'info',
      softFg: 'info',
      border: 'info',
      outlineFg: 'info',
      dot: 'info',
    },
    warning: {
      solidBg: 'warning',
      softBg: 'warning',
      softFg: 'warning',
      border: 'warning',
      outlineFg: 'warning',
      dot: 'warning',
    },
    error: {
      solidBg: 'error',
      softBg: 'error',
      softFg: 'error',
      border: 'error',
      outlineFg: 'error',
      dot: 'error',
    },
    neutralWarm: {
      solidBg: 'neutralWarm',
      softBg: 'neutralWarm',
      softFg: 'neutralWarm',
      border: 'neutralWarm',
      outlineFg: 'neutralWarm',
      dot: 'neutralWarm',
    },
    neutralDark: {
      solidBg: 'neutralDark',
      softBg: 'neutralDark',
      softFg: 'neutralDark',
      border: 'neutralDark',
      outlineFg: 'neutralDark',
      dot: 'neutralDark',
    },
  };
  return map[color];
};

// ─── Size tokens ───────────────────────────────────────────────────────────

const SZ: Record<TBadgeSize, { py: string; px: string; dot: string; gap: string }> = {
  xs: { py: '1px', px: '6px', dot: '5px', gap: '4px' },
  sm: { py: '2px', px: '6px', dot: '5px', gap: '4px' },
  md: { py: '3px', px: '8px', dot: '6px', gap: '5px' },
  lg: { py: '5px', px: '10px', dot: '7px', gap: '6px' },
};

export const getBadgeBackgroundColor = (
  theme: DefaultTheme,
  $color: TBadgeColor,
  $shade?: TColorScale,
  $isSoft?: boolean,
) => {
  if ($isSoft) {
    return theme.isDark
      ? colorMixAlpha(getColor(theme, $color, 900), ALPHAS[32])
      : getColor(theme, $color, 100);
  }
  return theme.isDark
    ? colorMixAlpha(getColor(theme, $color, $shade ?? 900), ALPHAS[96])
    : getColor(theme, $color, $shade ?? 500);
};

export const getBadgeColorIfDark = (
  theme: DefaultTheme,
  $color: TBadgeColor,
  $shade?: TColorScale,
  $isSoft?: boolean,
) => {
  if ($isSoft) {
    return theme.isDark
      ? colorMixAlpha(getColor(theme, $color, $shade ?? 900), ALPHAS[32])
      : getColor(theme, $color, $shade ?? 500);
  }
  return theme.isDark
    ? colorMixAlpha(getColor(theme, $color, $shade ?? 900), ALPHAS[96])
    : getColor(theme, $color, $shade ?? 500);
};

const getVariantStyles = (
  $color: TBadgeColor,
  $variant: TBadgeVariant,
  $size: TBadgeSize,
  theme: DefaultTheme,
) => {
  const tokens = getTokens($color);

  const variants = {
    solid: css`
      background: ${getBadgeBackgroundColor(theme, tokens.solidBg)};
      color: ${theme.isDark
        ? getBadgeColorIfDark(theme, tokens.border, 200)
        : getContrastText(theme, tokens.softBg, 500)};
    `,

    soft: css`
      background: ${getBadgeBackgroundColor(theme, tokens.softBg, 100, true)};
      color: ${theme.isDark
        ? getBadgeColorIfDark(theme, tokens.border, 300)
        : getBadgeColorIfDark(theme, tokens.border, 800)};
    `,

    'soft-outline': css`
      background: ${getBadgeBackgroundColor(theme, tokens.softBg, 100, true)};
      border-color: ${getBadgeColorIfDark(theme, tokens.border, 600, true)};
      color: ${theme.isDark
        ? getBadgeColorIfDark(theme, tokens.border, 300)
        : getBadgeColorIfDark(theme, tokens.border, 800)};
    `,

    outline: css`
      background: transparent;
      border-color: ${getBadgeColorIfDark(theme, tokens.border, 600)};
      color: ${theme.isDark
        ? getBadgeColorIfDark(theme, tokens.outlineFg, 200)
        : getBadgeColorIfDark(theme, tokens.outlineFg, 600)};
    `,

    dot: css`
      background: transparent;
      color: ${theme.isDark
        ? getBadgeColorIfDark(theme, tokens.dot, 200)
        : getBadgeColorIfDark(theme, tokens.dot, 600)};
      &::before {
        content: '';
        display: inline-block;
        width: ${SZ[$size].dot};
        height: ${SZ[$size].dot};
        border-radius: 50%;
        background: ${getBadgeColorIfDark(theme, tokens.dot)};
        flex-shrink: 0;
      }
    `,
  };

  return variants[$variant];
};

// ─── Root ──────────────────────────────────────────────────────────────────

export const BadgeRoot = styled.span<{
  $color: TBadgeColor;
  $variant: TBadgeVariant;
  $size: TBadgeSize;
  $pill: boolean;
}>`
  ${({ theme, $color, $variant, $size, $pill }) => {
    return css`
      padding: ${$variant === 'dot' ? '0' : `${SZ[$size].py} ${SZ[$size].px}`};
      display: inline-flex;
      align-items: center;
      gap: ${SZ[$size].gap};
      border-radius: ${$pill ? theme.border.radius.full : theme.border.radius.xs};
      border: 1px solid transparent;
      line-height: 1;
      white-space: nowrap;
      flex-shrink: 0;
      vertical-align: middle;

      ${getVariantStyles($color, $variant, $size, theme)}
    `;
  }}
`;
