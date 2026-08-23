/**
 * Radio — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css } from 'styled-components';
import type { RadioSize, RadioVariant } from './Radio.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SIZE_DOT: Record<RadioSize, string> = {
  sm: '14px',
  md: '18px',
  lg: '22px',
};

const SIZE_INNER: Record<RadioSize, string> = {
  sm: '6px',
  md: '8px',
  lg: '10px',
};

const SIZE_FONT: Record<RadioSize, string> = {
  sm: '0.8125rem', // 13px
  md: '0.875rem', // 14px
  lg: '1rem', // 16px
};

const SIZE_GAP: Record<RadioSize, string> = {
  sm: '8px',
  md: '10px',
  lg: '12px',
};

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

// ════════════════════════════════════════════════════════════════════════════
// VARIANT: default + card  ─  comparten el círculo personalizado
// ════════════════════════════════════════════════════════════════════════════

// ─── Círculo visual ───────────────────────────────────────────────────────────

export const RadioCircle = styled.span<{
  $size: RadioSize;
  $checked: boolean;
  $disabled: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size }) => SIZE_DOT[$size]};
  height: ${({ $size }) => SIZE_DOT[$size]};
  border-radius: 50%;
  border: 2px solid
    ${({ $checked, $disabled, theme }) =>
      $disabled
        ? theme.color.neutral[300]
        : $checked
          ? theme.color.primary[500]
          : theme.color.neutral[400]};
  background: ${({ $checked, $disabled, theme }) =>
    $disabled && $checked ? theme.color.neutral[200] : 'transparent'};
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;

  /* Inner dot */
  &::after {
    content: '';
    position: absolute;
    width: ${({ $size }) => SIZE_INNER[$size]};
    height: ${({ $size }) => SIZE_INNER[$size]};
    border-radius: 50%;
    background: ${({ $disabled, theme }) =>
      $disabled ? theme.color.neutral[400] : theme.color.primary[500]};
    transform: scale(${({ $checked }) => ($checked ? 1 : 0)});
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
`;

// ─── Label wrapper — variant: default ────────────────────────────────────────

export const DefaultWrap = styled.label<{
  $size: RadioSize;
  $disabled: boolean;
}>`
  display: inline-flex;
  align-items: flex-start;
  gap: ${({ $size }) => SIZE_GAP[$size]};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  /* Focus ring on circle when input is focused */
  &:focus-within ${RadioCircle} {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.primary[100]};
    border-color: ${({ theme }) => theme.color.primary[400]};
  }

  /* Hover (no disabled) */
  &:not([data-disabled]) ${RadioCircle} {
    &:hover {
      border-color: ${({ theme }) => theme.color.primary[400]};
    }
  }
`;

export const LabelContent = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 1px;
`;

export const LabelRow = styled.span<{ $size: RadioSize }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => SIZE_FONT[$size]};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.3;

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.text.secondary};
  }
`;

export const Description = styled.span<{ $size: RadioSize }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => ($size === 'lg' ? '0.875rem' : '0.75rem')};
  color: ${({ theme }) => theme.color.text.tertiary};
  line-height: 1.4;
`;

// ─── variant: card ────────────────────────────────────────────────────────────

export const CardWrap = styled.label<{
  $size: RadioSize;
  $checked: boolean;
  $disabled: boolean;
}>`
  display: flex;
  align-items: flex-start;
  gap: ${({ $size }) => SIZE_GAP[$size]};
  padding: ${({ $size, theme }) =>
    $size === 'sm'
      ? `${theme.spacing.sm} ${theme.spacing.md}`
      : $size === 'lg'
        ? `${theme.spacing.lg} ${theme.spacing.xl}`
        : `${theme.spacing.md} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  border: 1.5px solid
    ${({ $checked, $disabled, theme }) =>
      $disabled
        ? theme.color.neutral[200]
        : $checked
          ? theme.color.primary[400]
          : theme.color.neutral[200]};
  background: ${({ $checked, $disabled, theme }) =>
    $disabled
      ? theme.color.neutral[50]
      : $checked
        ? theme.color.primary[50]
        : theme.color.background.light};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
  user-select: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  &:focus-within {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.primary[100]};
    border-color: ${({ theme }) => theme.color.primary[400]};
  }

  ${({ $checked, $disabled, theme }) =>
    !$checked &&
    !$disabled &&
    css`
      &:hover {
        border-color: ${theme.color.primary[300]};
        background: ${theme.color.neutral[50]};
      }
    `}
`;

export const CardIcon = styled.span<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  color: ${({ $checked, theme }) =>
    $checked ? theme.color.primary[500] : theme.color.text.tertiary};
  transition: color 0.15s ease;

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// VARIANT: button  ─  RadioGroup como strip de botones
// ════════════════════════════════════════════════════════════════════════════

export const ButtonStrip = styled.div<{
  $orientation: 'horizontal' | 'vertical';
}>`
  display: inline-flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'vertical' ? 'column' : 'row')};
  border: 1.5px solid ${({ theme }) => theme.color.neutral[200]};
  border-radius: ${({ theme }) => theme.border.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.color.neutral[50]};
`;

export const ButtonItem = styled.label<{
  $size: RadioSize;
  $checked: boolean;
  $disabled: boolean;
  $orientation: 'horizontal' | 'vertical';
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: ${({ $size, theme }) =>
    $size === 'sm'
      ? `${theme.spacing.xs} ${theme.spacing.md}`
      : $size === 'lg'
        ? `${theme.spacing.md} ${theme.spacing.xl}`
        : `${theme.spacing.sm} ${theme.spacing.lg}`};
  min-height: ${({ $size }) => ($size === 'sm' ? '32px' : $size === 'lg' ? '44px' : '38px')};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => SIZE_FONT[$size]};
  font-weight: ${({ $checked, theme }) =>
    $checked ? theme.typography.weight.semibold : theme.typography.weight.medium};
  color: ${({ $checked, $disabled, theme }) =>
    $disabled
      ? theme.color.text.disabled
      : $checked
        ? theme.color.primary[600]
        : theme.color.text.secondary};
  background: ${({ $checked, theme }) => ($checked ? theme.color.primary[50] : 'transparent')};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  /* Separador entre ítems */
  & + & {
    border-${({ $orientation }) => ($orientation === 'vertical' ? 'top' : 'left')}:
      1.5px solid ${({ theme }) => theme.color.neutral[200]};
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: inherit;
  }

  ${({ $checked, theme }) =>
    $checked &&
    css`
      &::before {
        content: '';
        position: absolute;
        ${/* underline indicator */ ''}
        bottom: 0;
        left: 10%;
        width: 80%;
        height: 2px;
        background: ${theme.color.primary[500]};
        border-radius: 2px 2px 0 0;
      }
    `}

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.color.primary[400]};
    outline-offset: -2px;
    z-index: 1;
  }

  ${({ $checked, $disabled, theme }) =>
    !$checked &&
    !$disabled &&
    css`
      &:hover {
        background: ${theme.color.neutral[100]};
        color: ${theme.color.text.primary};
      }
    `}
`;

// ════════════════════════════════════════════════════════════════════════════
// RadioGroup wrappers
// ════════════════════════════════════════════════════════════════════════════

export const GroupRoot = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
  min-width: 0;
`;

export const GroupLegend = styled.legend`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 4px;
  float: left;
  width: 100%;

  &::after {
    content: '';
    display: block;
    clear: both;
  }
`;

export const RequiredMark = styled.span`
  color: ${({ theme }) => theme.color.error[500]};
  font-size: 0.9em;
`;

export const OptionsWrap = styled.div<{
  $orientation: 'horizontal' | 'vertical';
  $variant: RadioVariant;
}>`
  display: flex;
  flex-direction: ${({ $orientation, $variant }) =>
    $variant === 'button'
      ? 'row' // button strip always row (handled internally)
      : $orientation === 'horizontal'
        ? 'row'
        : 'column'};
  gap: ${({ $variant, theme }) => ($variant === 'button' ? '0' : theme.spacing.sm)};
  flex-wrap: ${({ $orientation }) => ($orientation === 'horizontal' ? 'wrap' : 'nowrap')};
  clear: both;
`;

export const HintText = styled.p<{ $error?: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ $error, theme }) => ($error ? theme.color.error[500] : theme.color.text.tertiary)};
  margin-top: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: 5px;
`;
