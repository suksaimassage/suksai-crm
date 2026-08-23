/**
 * Tag — Styled Components
 *
 * Misma paleta que Badge para coherencia visual.
 * Añade TagIcon y RemoveButton como elementos adicionales.
 */
import styled, { css } from 'styled-components';
import type { TTagColor, TTagVariant, TTagSize } from './Tag.types';
import {
  getBadgeBackgroundColor,
  getBadgeColorIfDark,
  getTokens,
} from '@infra/components/ui/common/Badge/Badge.styles';
import { getContrastText } from '@infra/styles/themes/theme.helpers';

// ─── Size tokens ───────────────────────────────────────────────────────────

const SZ: Record<TTagSize, { py: string; px: string; gap: string; icon: string }> = {
  sm: { py: '2px', px: '7px', gap: '4px', icon: '12px' },
  md: { py: '4px', px: '9px', gap: '5px', icon: '14px' },
  lg: { py: '6px', px: '11px', gap: '6px', icon: '16px' },
};

/**
 * ─── Tag Root
 */
export const TagRoot = styled.span<{
  $color: TTagColor;
  $variant: TTagVariant;
  $size: TTagSize;
}>`
  ${({ $variant, $color, $size, theme }) => {
    const { border } = theme;
    const size = SZ[$size];
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
          ? getBadgeColorIfDark(theme, tokens.softFg, 300)
          : getContrastText(theme, tokens.softFg, 100)};
      `,
      outline: css`
        background: transparent;
        border-color: ${getBadgeColorIfDark(theme, tokens.outlineFg, 600)};
        color: ${theme.isDark
          ? getBadgeColorIfDark(theme, tokens.outlineFg, 200)
          : getBadgeColorIfDark(theme, tokens.outlineFg, 600)};
      `,
    };

    return css`
      display: inline-flex;
      align-items: center;
      gap: ${size.gap};
      padding: ${size.py} ${size.px};
      border-radius: ${border.radius.xs};
      border: 1px solid transparent;
      line-height: 1;
      white-space: nowrap;
      flex-shrink: 0;
      vertical-align: middle;

      ${variants[$variant]}
    `;
  }}
`;

/**
 * ─── Icon wrapper
 */
export const TagIcon = styled.span<{ $size: TTagSize }>`
  ${({ $size }) => {
    const size = SZ[$size].icon;

    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size};
      height: ${size};
      flex-shrink: 0;
      color: inherit;
      svg {
        width: 100%;
        height: 100%;
      }
    `;
  }}
`;

/**
 * ─── Remove button
 */
export const RemoveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  margin-left: 1px;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  flex-shrink: 0;
  transition: opacity ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    opacity: 1;
  }
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 1px;
    opacity: 1;
  }
  svg {
    display: block;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
