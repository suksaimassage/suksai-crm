/**
 * Chip — Styled Components
 *
 * idle     → borde gris, fondo transparente
 * hover    → borde y fondo sutiles del color
 * selected → fondo soft + borde del color
 * disabled → opacidad 0.45, cursor not-allowed
 *
 * El estado visual se resuelve íntegramente en CSS mediante props transient.
 * Sin lógica condicional en el componente.
 */
import styled, { css } from 'styled-components';
import type { TChipColor, TChipSize } from './Chip.types';
import {
  getBadgeBackgroundColor,
  getBadgeColorIfDark,
  getTokens,
} from '@infra/components/ui/common/Badge/Badge.styles';

// ─── Size tokens ───────────────────────────────────────────────────────────

const SZ: Record<TChipSize, { py: string; px: string; gap: string; icon: string }> = {
  xs: { py: '1px', px: '6px', gap: '2px', icon: '10px' },
  sm: { py: '4px', px: '10px', gap: '4px', icon: '12px' },
  md: { py: '6px', px: '13px', gap: '5px', icon: '14px' },
  lg: { py: '8px', px: '16px', gap: '6px', icon: '16px' },
};

// ─── Root ──────────────────────────────────────────────────────────────────

export const ChipRoot = styled.button<{
  $color: TChipColor;
  $size: TChipSize;
  $selected: boolean;
}>`
  ${({ $color, $size, $selected, theme }) => {
    const t = getTokens($color);
    const transition = theme.transition;
    return css`
      min-width: 0;
      /* Reset */
      appearance: none;
      cursor: pointer;
      /* Layout */
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: ${SZ[$size].gap};
      padding: ${`${SZ[$size].py} ${SZ[$size].px}`};
      /* Color */
      background: ${$selected
        ? getBadgeBackgroundColor(theme, t.solidBg, 500, true)
        : 'transparent'};
      color: ${$selected
        ? theme.isDark
          ? getBadgeColorIfDark(theme, t.solidBg, 300)
          : $color === 'neutral'
            ? getBadgeColorIfDark(theme, t.solidBg, 800)
            : getBadgeColorIfDark(theme, t.solidBg, 600)
        : theme.color.text.secondary};
      /* Shape */
      border-radius: ${theme.border.radius.full};
      border: 1.5px solid
        ${$selected
          ? getBadgeColorIfDark(theme, t.border, 500, true)
          : getBadgeColorIfDark(theme, t.border, 300)};
      /* Typography */
      line-height: 1;
      white-space: nowrap;
      flex-shrink: 0;
      vertical-align: middle;
      /* Transitions */
      transition: ${() => {
        return css`
        background ${transition.duration.fast} ${transition.timing.easeOut},
        border-color ${transition.duration.fast} ${transition.timing.easeOut},
        color ${transition.duration.fast} ${transition.timing.easeOut}
      `;
      }};
      /* Hover — solo cuando no está selected ni disabled */
      &:hover:not(:disabled) {
        ${!$selected &&
        css`
          background: ${getBadgeBackgroundColor(theme, t.solidBg, 200, true)};
          border-color: ${getBadgeColorIfDark(theme, t.border, 300, true)};
        `}
      }

      /* Focus ring */
      &:focus-visible {
        outline: 2px solid ${getBadgeColorIfDark(theme, t.outlineFg)};
        outline-offset: 2px;
      }

      /* Disabled */
      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;
  }}
`;

// ─── Icon wrapper ──────────────────────────────────────────────────────────

export const ChipIcon = styled.span<{ $size: TChipSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => SZ[$size].icon};
  height: ${({ $size }) => SZ[$size].icon};
  flex-shrink: 0;
  color: inherit;
  svg {
    width: 100%;
    height: 100%;
  }
`;
