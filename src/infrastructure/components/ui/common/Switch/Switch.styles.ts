/**
 * Switch — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css, keyframes } from 'styled-components';
import type { SwitchSize, SwitchVariant, SwitchColor } from './Switch.types';

// ─── Size tokens ──────────────────────────────────────────────────────────────

interface SizeTokens {
  trackW: string;
  trackH: string;
  thumbSize: string;
  thumbOffset: string;
  fontSize: string;
  gap: string;
  iconSize: string;
}

const SIZES: Record<SwitchSize, SizeTokens> = {
  sm: {
    trackW: '32px',
    trackH: '18px',
    thumbSize: '12px',
    thumbOffset: '3px',
    fontSize: '0.8125rem',
    gap: '8px',
    iconSize: '8px',
  },
  md: {
    trackW: '44px',
    trackH: '24px',
    thumbSize: '18px',
    thumbOffset: '3px',
    fontSize: '0.875rem',
    gap: '10px',
    iconSize: '10px',
  },
  lg: {
    trackW: '56px',
    trackH: '30px',
    thumbSize: '22px',
    thumbOffset: '4px',
    fontSize: '1rem',
    gap: '12px',
    iconSize: '13px',
  },
};

// ─── Color tokens ─────────────────────────────────────────────────────────────

const COLORS: Record<SwitchColor, { on: string; onSoft: string; onSoftBorder: string }> = {
  primary: {
    on: 'var(--sw-primary)',
    onSoft: 'var(--sw-primary-soft)',
    onSoftBorder: 'var(--sw-primary-soft-border)',
  },
  success: {
    on: 'var(--sw-success)',
    onSoft: 'var(--sw-success-soft)',
    onSoftBorder: 'var(--sw-success-soft-border)',
  },
  warning: {
    on: 'var(--sw-warning)',
    onSoft: 'var(--sw-warning-soft)',
    onSoftBorder: 'var(--sw-warning-soft-border)',
  },
  danger: {
    on: 'var(--sw-danger)',
    onSoft: 'var(--sw-danger-soft)',
    onSoftBorder: 'var(--sw-danger-soft-border)',
  },
};

// ─── Animations ───────────────────────────────────────────────────────────────

// Solo iconFade — el thumb usa transition pura (sin keyframes) para evitar
// el conflicto transform + animation que causa el salto al activar.
const iconFade = keyframes`
  from { opacity: 0; transform: scale(0.6) rotate(-15deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
`;

// ─── Root ─────────────────────────────────────────────────────────────────────

export const SwitchRoot = styled.div`
  /* CSS custom props para color tokens */
  --sw-primary: ${({ theme }) => theme.color.primary[500]};
  --sw-primary-soft: ${({ theme }) => theme.color.primary[50]};
  --sw-primary-soft-border: ${({ theme }) => theme.color.primary[200]};
  --sw-success: ${({ theme }) => theme.color.success[500]};
  --sw-success-soft: ${({ theme }) => theme.color.success[50]};
  --sw-success-soft-border: ${({ theme }) => theme.color.success[200]};
  --sw-warning: ${({ theme }) => theme.color.warning[400]};
  --sw-warning-soft: ${({ theme }) =>
    theme.isDark ? theme.color.warning[900] : theme.color.warning[50]};
  --sw-warning-soft-border: ${({ theme }) =>
    theme.isDark ? theme.color.warning[700] : theme.color.warning[200]};
  --sw-danger: ${({ theme }) => theme.color.intent.error};
  --sw-danger-soft: ${({ theme }) =>
    theme.isDark ? theme.color.intent.errorZone : theme.color.error[50]};
  --sw-danger-soft-border: ${({ theme }) => theme.color.intent.errorSubtle};

  display: inline-flex;
  flex-direction: column;
  gap: 0;
`;

// ─── Wrapper (label nativo para hit-area) ─────────────────────────────────────

export const Label = styled.label<{
  $variant: SwitchVariant;
  $checked: boolean;
  $disabled: boolean;
  $size: SwitchSize;
}>`
  display: inline-flex;
  align-items: ${({ $variant }) => ($variant === 'card' ? 'flex-start' : 'center')};
  gap: ${({ $size }) => SIZES[$size].gap};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  user-select: none;
  transition: opacity 0.15s;

  /* variant: card */
  ${({ $variant, $checked, theme }) =>
    $variant === 'card' &&
    css`
      width: 100%;
      padding: ${theme.spacing.md};
      border-radius: ${theme.border.radius.lg};
      border: 1.5px solid
        ${$checked && theme.isDark ? theme.color.primary[800] : theme.color.neutral[200]};
      background: ${$checked && theme.isDark
        ? theme.color.primary[900]
        : theme.color.background.light};
      transition:
        border-color 0.2s,
        background 0.2s;
      justify-content: space-between;
      flex-direction: row-reverse;
    `}
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

// ─── Track ────────────────────────────────────────────────────────────────────

export const Track = styled.span<{
  $size: SwitchSize;
  $checked: boolean;
  $disabled: boolean;
  $variant: SwitchVariant;
  $color: SwitchColor;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: ${({ $size }) => SIZES[$size].trackW};
  height: ${({ $size }) => SIZES[$size].trackH};
  border-radius: 999px;
  transition:
    background 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  /* ── default: fondo sólido ── */
  ${({ $variant, $checked, $disabled, $color, theme }) =>
    $variant !== 'soft' &&
    css`
      background: ${$checked
        ? $disabled
          ? theme.color.neutral[400]
          : COLORS[$color].on
        : theme.color.neutral[200]};
      /* Focus ring visible via parent :focus-within */
    `}

  /* ── soft: borde + fondo suave cuando ON ── */
  ${({ $variant, $checked, $disabled, $color, theme }) =>
    $variant === 'soft' &&
    css`
      background: ${$checked
        ? $disabled
          ? theme.color.neutral[100]
          : COLORS[$color].onSoft
        : theme.color.neutral[100]};
      border: 1.5px solid
        ${$checked
          ? $disabled
            ? theme.color.neutral[300]
            : COLORS[$color].onSoftBorder
          : theme.color.neutral[200]};
    `}

  /* Focus ring en el Track cuando el input hermano tiene foco */
  ${HiddenInput}:focus-visible + & {
    box-shadow: 0 0 0 3px
      ${({ theme }) => (theme.isDark ? theme.color.primary[800] : theme.color.primary[100])};
  }
`;

// ─── Thumb ────────────────────────────────────────────────────────────────────

export const Thumb = styled.span<{
  $size: SwitchSize;
  $checked: boolean;
  $color: SwitchColor;
}>`
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => SIZES[$size].thumbSize};
  height: ${({ $size }) => SIZES[$size].thumbSize};
  border-radius: 50%;
  background: ${({ theme }) => theme.color.background.card};
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.12);
  left: ${({ $size }) => SIZES[$size].thumbOffset};

  /* Translate puro — un solo transform, sin keyframes que lo pisen */
  transform: translateX(
    ${({ $size, $checked }) =>
      $checked
        ? `calc(${SIZES[$size].trackW} - ${SIZES[$size].thumbSize} - ${SIZES[$size].thumbOffset} * 2)`
        : '0'}
  );

  /*
   * easeInOut suave en ambas direcciones.
   * will-change evita que el compositor recalcule layout en el slide.
   */
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.15s ease;
  will-change: transform;

  /* Color del thumb ON para variante soft */
  color: ${({ $color }) => COLORS[$color].on};
`;

// ─── Icono dentro del thumb ───────────────────────────────────────────────────

export const ThumbIcon = styled.span<{ $size: SwitchSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => SIZES[$size].iconSize};
  height: ${({ $size }) => SIZES[$size].iconSize};
  animation: ${iconFade} 0.18s ease both;
  svg {
    width: 100%;
    height: 100%;
  }
`;

// ─── Track labels (OFF / ON text inside track) ────────────────────────────────

export const TrackLabel = styled.span<{
  $side: 'on' | 'off';
  $size: SwitchSize;
  $checked: boolean;
}>`
  position: absolute;
  font-size: ${({ $size }) =>
    $size === 'sm' ? '0.5rem' : $size === 'md' ? '0.625rem' : '0.75rem'};
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.inverse};
  letter-spacing: 0.04em;
  pointer-events: none;
  transition: opacity 0.18s;

  ${({ $side }) =>
    $side === 'on' &&
    css`
      left: 7px;
    `}
  ${({ $side }) =>
    $side === 'off' &&
    css`
      right: 6px;
    `}

  opacity: ${({ $side, $checked }) =>
    ($side === 'on' && $checked) || ($side === 'off' && !$checked) ? 1 : 0};

  /* off label: color gris */
  ${({ $side, theme }) =>
    $side === 'off' &&
    css`
      color: ${theme.color.neutral[500]};
    `}
`;

// ─── Label content ────────────────────────────────────────────────────────────

export const LabelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const LabelText = styled.span<{ $size: SwitchSize }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => SIZES[$size].fontSize};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.3;
`;

export const Description = styled.span<{ $size: SwitchSize }>`
  font-size: ${({ $size }) => ($size === 'lg' ? '0.875rem' : '0.75rem')};
  color: ${({ theme }) => theme.color.text.tertiary};
  line-height: 1.4;
`;

// ─── Hint / Error ─────────────────────────────────────────────────────────────

export const Hint = styled.p`
  margin: 4px 0 0;
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
`;

export const ErrorMsg = styled.p`
  margin: 4px 0 0;
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.error};
`;
