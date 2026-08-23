/**
 * Checkbox — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css, type DefaultTheme, keyframes } from 'styled-components';
import type { TCheckboxOrientation, TCheckboxSize, TCheckboxVariant } from './Checkbox.types';
import { ALPHAS, toRgba } from '@infra/styles/themes/theme.helpers';

// ─── Tokens por tamaño ────────────────────────────────────────────────────────

const SIZE_BOX: Record<TCheckboxSize, string> = {
  sm: '14px',
  md: '18px',
  lg: '22px',
};
const SIZE_FONT: Record<TCheckboxSize, string> = {
  sm: '0.8125rem',
  md: '0.875rem',
  lg: '1rem',
};
const SIZE_GAP: Record<TCheckboxSize, string> = {
  sm: '8px',
  md: '10px',
  lg: '12px',
};

// Typed accessors — explicit ternaries to satisfy ESLint no-unsafe-member-access
const getSizeBox = (s: TCheckboxSize): string =>
  s === 'sm' ? SIZE_BOX.sm : s === 'md' ? SIZE_BOX.md : SIZE_BOX.lg;
const getSizeFont = (s: TCheckboxSize): string =>
  s === 'sm' ? SIZE_FONT.sm : s === 'md' ? SIZE_FONT.md : SIZE_FONT.lg;
const getSizeGap = (s: TCheckboxSize): string =>
  s === 'sm' ? SIZE_GAP.sm : s === 'md' ? SIZE_GAP.md : SIZE_GAP.lg;

/* ------------------ Helpers ------------------ */

const isActive = ($checked?: boolean, $indeterminate?: boolean) =>
  Boolean($checked) || Boolean($indeterminate);

const getMinHeight = ($size: TCheckboxSize): string =>
  $size === 'sm' ? '32px' : $size === 'md' ? '38px' : '44px';

const getPadding = ($size: TCheckboxSize, theme: DefaultTheme): string => {
  if ($size === 'sm') return `${theme.spacing.sm} ${theme.spacing.md}`;
  if ($size === 'md') return `${theme.spacing.md} ${theme.spacing.lg}`;
  return `${theme.spacing.lg} ${theme.spacing.xl}`;
};

const getBorderColor = (
  $checked: boolean,
  $disabled: boolean,
  theme: DefaultTheme,
  $indeterminate?: boolean,
) => {
  if ($disabled) return theme.color.neutral[200];
  if (isActive($checked, $indeterminate))
    return theme.isDark ? theme.color.primary[800] : theme.color.primary[500];
  return theme.isDark ? theme.color.neutral[800] : theme.color.neutral[200];
};

const getBackground = (
  isOnlyCheckbox: boolean,
  $checked: boolean,
  $disabled: boolean,
  theme: DefaultTheme,
  $indeterminate?: boolean,
) => {
  if ($disabled && isActive($checked, $indeterminate)) {
    return theme.color.neutral[200];
  }
  if (isOnlyCheckbox && isActive($checked, $indeterminate)) {
    return theme.isDark ? toRgba(theme.color.primary[500], ALPHAS[32]) : theme.color.primary[500];
  }
  if (isActive($checked, $indeterminate)) {
    return theme.isDark ? toRgba(theme.color.primary[900], ALPHAS[32]) : theme.color.primary[200];
  }
  return 'transparent';
};

const getFontWeight = ($checked: boolean, theme: DefaultTheme) =>
  $checked ? theme.typography.weight.semibold : theme.typography.weight.medium;

const getTextColor = (
  $checked: boolean,
  $disabled: boolean,
  $error = false,
  theme: DefaultTheme,
) => {
  if ($disabled) return theme.color.text.disabled;
  if ($error) return theme.color.error[500];
  if ($checked) return theme.isDark ? theme.color.primary[200] : theme.color.primary[600];
  return theme.color.text.secondary;
};

const getIconStyles = ($checked: boolean, $indeterminate: boolean) => {
  const active = isActive($checked, $indeterminate);

  return css`
    display: ${active ? 'block' : 'none'};
    animation: ${active
      ? css`
          ${popIn} 0.2s cubic-bezier(0.34,1.56,0.64,1) both
        `
      : 'none'};
  `;
};

const getActiveIndicator = ($checked: boolean, theme: DefaultTheme) =>
  $checked &&
  css`
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 2px;
      background: ${theme.color.primary[500]};
      border-radius: 2px 2px 0 0;
    }
  `;

const getDivider = ($orientation: TCheckboxOrientation, theme: DefaultTheme) => {
  const dir = $orientation === 'vertical' ? 'top' : 'left';

  return `
    & + & {
      border-${dir}: 1.5px solid ${theme.color.neutral[200]};
    }
  `;
};

const getHoverStyles = ($checked: boolean, $disabled: boolean, theme: DefaultTheme) => {
  return (
    !$checked &&
    !$disabled &&
    css`
      &:hover {
        border-color: ${theme.color.primary[300]};
        background: ${theme.color.neutral[50]};
      }
    `
  );
};

const getFlexDirection = ($orientation: TCheckboxOrientation, $variant: TCheckboxVariant) =>
  $variant === 'button' || $orientation === 'horizontal' ? 'row' : 'column';

const getGap = ($variant: TCheckboxVariant, theme: DefaultTheme) =>
  $variant === 'button' ? '0' : theme.spacing.sm;

const getFlexWrap = ($orientation: TCheckboxOrientation) =>
  $orientation === 'horizontal' ? 'wrap' : 'nowrap';

// ─── Animación del check ──────────────────────────────────────────────────────

const popIn = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
`;

// ─── Hidden native input ──────────────────────────────────────────────────────

export const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// ─── Caja visual ─────────────────────────────────────────────────────────────

export const CheckBox = styled.span<{
  $size: TCheckboxSize;
  $checked: boolean;
  $indeterminate: boolean;
  $disabled: boolean;
}>`
  ${({ theme, $checked, $indeterminate, $disabled, $size }) => {
    return css`
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: ${getSizeBox($size)};
      height: ${getSizeBox($size)};
      border-radius: ${theme.border.radius.xs};
      border: 1px solid ${getBorderColor($checked, $disabled, theme, $indeterminate)};
      background: ${getBackground(true, $checked, $disabled, theme, $indeterminate)};
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;

      svg {
        ${getIconStyles($checked, $indeterminate)};

        color: ${$disabled ? theme.color.neutral[400] : theme.color.text.inverse};
      }
    `;
  }}
`;

// ─── variant: default — label wrapper ────────────────────────────────────────

export const DefaultWrap = styled.label<{
  $size: TCheckboxSize;
  $disabled: boolean;
}>`
  ${({ theme, $disabled, $size }) => {
    return css`
      display: inline-flex;
      align-items: flex-start;
      gap: ${getSizeGap($size)};
      cursor: ${$disabled ? 'not-allowed' : 'pointer'};
      opacity: ${$disabled ? 0.5 : 1};
      user-select: none;
      -webkit-tap-highlight-color: transparent;

      &:focus-within ${CheckBox} {
        box-shadow: 0 0 0 3px ${theme.color.primary[100]};
        border-color: ${theme.color.primary[400]};
      }

      ${!$disabled &&
      css`
        &:hover ${CheckBox} {
          border-color: ${theme.color.primary[400]};
        }
      `}
    `;
  }}
`;

export const LabelContent = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const LabelRow = styled.span<{ $size: TCheckboxSize }>`
  ${({ theme, $size }) => {
    return css`
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: ${theme.typography.font.body};
      font-size: ${getSizeFont($size)};
      font-weight: ${theme.typography.weight.medium};
      color: ${theme.color.text.primary};
      line-height: 1.3;

      svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: ${theme.color.text.secondary};
      }
    `;
  }}
`;

export const Description = styled.span`
  ${({ theme }) => {
    return css`
      font-family: ${theme.typography.type.caption2.fontFamily};
      font-size: ${theme.typography.type.caption2.fontSize.sm};
      color: ${theme.color.text.tertiary};
      line-height: 1.4;
    `;
  }}
`;

// ─── variant: card ────────────────────────────────────────────────────────────

export const ButtonCardWrap = styled.label<{
  $size: TCheckboxSize;
  $checked: boolean;
  $disabled: boolean;
}>`
  ${({ theme, $checked, $disabled, $size }) => {
    return css`
      display: flex;
      align-items: flex-start;
      gap: ${getSizeGap($size)};
      padding: ${getPadding($size, theme)};

      border-radius: ${theme.border.radius.lg};
      border: 1.5px solid ${getBorderColor($checked, $disabled, theme)};
      background: ${getBackground(false, $checked, $disabled, theme)};

      cursor: ${$disabled ? 'not-allowed' : 'pointer'};
      opacity: ${$disabled ? 0.55 : 1};
      user-select: none;

      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;

      -webkit-tap-highlight-color: transparent;

      &:focus-within {
        box-shadow: 0 0 0 3px ${theme.isDark ? theme.color.primary[600] : theme.color.primary[100]};
        border-color: ${theme.isDark ? theme.color.primary[600] : theme.color.primary[400]};
      }

      ${getHoverStyles($checked, $disabled, theme)}
    `;
  }}
`;

export const ButtonCardIcon = styled.span<{ $checked: boolean }>`
  ${({ theme, $checked }) => {
    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${$checked ? theme.color.primary[500] : theme.color.text.tertiary};
      transition: color 0.15s ease;
      svg {
        width: 18px;
        height: 18px;
      }
    `;
  }}
`;

// ─── variant: button (multi-select strip) ────────────────────────────────────

export const ButtonStrip = styled.div<{
  $orientation: TCheckboxOrientation;
}>`
  ${({ theme, $orientation }) => {
    return css`
      display: inline-flex;
      flex-direction: ${$orientation === 'vertical' ? 'column' : 'row'};
      border: 1.5px solid ${theme.color.neutral[200]};
      border-radius: ${theme.border.radius.md};
      overflow: hidden;
      background: ${theme.color.neutral[50]};
      flex-wrap: wrap;

      :first-child {
        border-top-right-radius: ${theme.border.radius.md};
        border-top-left-radius: ${theme.border.radius.md};
        :hover {
          border-top-right-radius: ${theme.border.radius.md};
          border-top-left-radius: ${theme.border.radius.md};
        }
      }

      :last-child {
        border-bottom-right-radius: ${theme.border.radius.md};
        border-bottom-left-radius: ${theme.border.radius.md};
        :hover {
          border-bottom-right-radius: ${theme.border.radius.md};
          border-bottom-left-radius: ${theme.border.radius.md};
        }
      }
    `;
  }}
`;

export const ButtonItem = styled.label<{
  $size: TCheckboxSize;
  $checked: boolean;
  $disabled: boolean;
  $orientation: TCheckboxOrientation;
}>`
  ${({ theme, $size, $checked, $disabled, $orientation }) => {
    return css`
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      gap: 6px;
      padding: ${getPadding($size, theme)};
      min-height: ${getMinHeight($size)};

      font-family: ${theme.typography.font.body};
      font-size: ${getSizeFont($size)};
      font-weight: ${getFontWeight($checked, theme)};
      color: ${getTextColor($checked, $disabled, false, theme)};

      background: ${getBackground(false, $checked, $disabled, theme)};

      cursor: ${$disabled ? 'not-allowed' : 'pointer'};
      user-select: none;
      white-space: nowrap;

      transition:
        background 0.15s ease,
        color 0.15s ease;

      -webkit-tap-highlight-color: transparent;

      ${getDivider($orientation, theme)}
      ${getActiveIndicator($checked, theme)}
      ${getHoverStyles($checked, $disabled, theme)}

      svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: inherit;
      }

      &:focus-within {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: -2px;
        z-index: 1;
      }
    `;
  }}
`;

// ─── Group wrappers ───────────────────────────────────────────────────────────

export const GroupRoot = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
  min-width: 0;
`;

export const GroupLegend = styled.legend`
  ${({ theme }) => {
    return css`
      margin-bottom: ${theme.spacing.sm};
      float: left;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 4px;

      font-family: ${theme.typography.type.body.fontFamily};
      font-size: ${theme.typography.type.body.fontSize.sm};
      font-weight: ${theme.typography.type.body.fontWeight};
      color: ${theme.color.text.primary};

      &::after {
        content: '';
        display: block;
        clear: both;
      }
    `;
  }}
`;

export const RequiredMark = styled.span`
  color: ${({ theme }) => theme.color.error[500]};
  font-size: 0.9em;
`;

export const OptionsWrap = styled.div<{
  $orientation: TCheckboxOrientation;
  $variant: TCheckboxVariant;
}>`
  ${({ theme, $orientation, $variant }) => {
    return css`
      display: flex;
      flex-direction: ${getFlexDirection($orientation, $variant)};
      flex-wrap: ${getFlexWrap($orientation)};
      gap: ${getGap($variant, theme)};
      clear: both;
    `;
  }}
`;

export const HintText = styled.p<{ $error?: boolean }>`
  ${({ theme, $error }) => {
    return css`
      margin-top: ${theme.spacing.xs};
      display: flex;
      align-items: center;
      gap: 5px;

      font-family: ${theme.typography.font.body};
      font-size: ${theme.typography.size.xs};
      color: ${getTextColor(false, false, $error, theme)};
    `;
  }}
`;
