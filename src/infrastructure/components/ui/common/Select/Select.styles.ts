/**
 * Select — Styled Components
 *
 * Mismos tokens de tamaño y variante que FormInput para coherencia visual.
 * SRP: solo estilos, cero lógica.
 */

import styled, { css, keyframes, type DefaultTheme } from 'styled-components';
import type { TInputSize, TInputVariant } from '@infra/components/ui/common/Form/Form.types';

// ─── Tokens (idénticos a FormInput.styles para coherencia) ───────────────────

interface IVariantTokens {
  background: string;
  border: string;
  focusBorder: string;
  focusRing: string;
  errorBorder: string;
  errorRing: string;
  placeholderFg: string;
  iconFg: string;
}

const getVariant = (variant: TInputVariant, theme: DefaultTheme): IVariantTokens => {
  const map: Record<TInputVariant, IVariantTokens> = {
    outlined: {
      background: theme.color.background.light || '',
      border: theme.border.color.neutral.medium,
      focusBorder: theme.color.primary[400],
      focusRing: 'rgba(115,91,254,0.12)',
      errorBorder: theme.color.error[400],
      errorRing: theme.color.intent.errorSubtle,
      placeholderFg: theme.color.neutral[400],
      iconFg: theme.color.neutral[400],
    },
    filled: {
      background: theme.color.background.neutral || '',
      border: theme.border.color.neutral.medium,
      focusBorder: theme.color.primary[400],
      focusRing: 'rgba(115,91,254,0.10)',
      errorBorder: theme.color.error[400],
      errorRing: theme.color.intent.errorSubtle,
      placeholderFg: theme.color.neutral[400],
      iconFg: theme.color.neutral[400],
    },
    ghost: {
      background: 'transparent',
      border: 'transparent',
      focusBorder: theme.color.primary[400],
      focusRing: 'transparent',
      errorBorder: theme.color.error[400],
      errorRing: 'transparent',
      placeholderFg: theme.color.neutral[400],
      iconFg: theme.color.neutral[400],
    },
  };
  return map[variant];
};

const SZ: Record<
  TInputSize,
  {
    height: string;
    px: string;
    fontSize: string;
    iconSize: string;
    radius: string;
  }
> = {
  sm: {
    height: '34px',
    px: '11px',
    fontSize: '0.8125rem',
    iconSize: '16px',
    radius: '8px',
  },
  md: {
    height: '42px',
    px: '13px',
    fontSize: '0.875rem',
    iconSize: '18px',
    radius: '10px',
  },
  lg: {
    height: '50px',
    px: '15px',
    fontSize: '1rem',
    iconSize: '20px',
    radius: '12px',
  },
};

const shakeError = keyframes`
  0%, 100% { transform: translateX(0);   }
  25%       { transform: translateX(-3px); }
  75%       { transform: translateX(3px);  }
`;

// ─── Field shell ──────────────────────────────────────────────────────────────

export const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
`;

export const Label = styled.label<{ $required?: boolean }>`
  ${({ theme, $required }) => {
    return css`
      display: block;
      font-family: ${theme.typography.font.body};
      font-size: 0.8125rem;
      font-weight: ${theme.typography.weight.medium};
      color: ${theme.color.text.secondary};
      line-height: 1.2;

      ${$required &&
      css`
        &::after {
          content: ' *';
          color: ${theme.color.error[400]};
        }
      `}
    `;
  }}
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const SubText = styled.span<{ $isError: boolean }>`
  ${({ theme, $isError }) => {
    return css`
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: ${theme.typography.font.body};
      font-size: 0.75rem;
      line-height: 1.4;
      color: ${$isError ? theme.color.error[500] : theme.color.text.tertiary};
      animation: ${fadeIn} 140ms ease both;

      svg {
        flex-shrink: 0;
        width: 12px;
        height: 12px;
        transform: translateY(10%);
      }

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `;
  }}
`;

// ─── Trigger (el "input" del select) ─────────────────────────────────────────

export const TriggerWrap = styled.div`
  position: relative;
  width: 100%;
`;

export const Trigger = styled.button<{
  $size: TInputSize;
  $variant: TInputVariant;
  $hasError: boolean;
  $isOpen: boolean;
  $hasLeft: boolean;
  $disabled: boolean;
}>`
  ${({ theme, $size, $variant, $hasError, $isOpen, $hasLeft, $disabled }) => {
    return css`
      /* Reset */
      appearance: none;
      margin: 0;
      cursor: pointer;
      text-align: left;

      /* Layout */
      display: flex;
      align-items: center;
      width: 100%;
      height: ${SZ[$size].height};
      box-sizing: border-box;

      /* Padding — reserva espacio para icono izquierdo y chevron derecho */
      padding-left: ${$hasLeft ? `calc(${SZ[$size].px} + 22px)` : SZ[$size].px};
      padding-right: calc(${SZ[$size].px} + 20px);

      /* Visual */
      font-family: ${theme.typography.font.body};
      font-size: ${SZ[$size].fontSize};
      color: ${theme.color.text.primary};
      background: ${getVariant($variant, theme).background};
      border: 1px solid
        ${$hasError ? getVariant($variant, theme).errorBorder : getVariant($variant, theme).border};
      border-radius: ${SZ[$size].radius};
      outline: none;

      transition:
        border-color ${theme.transition.duration.fast} ${theme.transition.timing.easeOut},
        box-shadow ${theme.transition.duration.fast} ${theme.transition.timing.easeOut};

      /* Focus / open */
      ${$isOpen &&
      css`
        border-color: ${$hasError
          ? getVariant($variant, theme).errorBorder
          : getVariant($variant, theme).focusBorder};
        box-shadow: 0 0 0 3px
          ${$hasError
            ? getVariant($variant, theme).errorRing
            : getVariant($variant, theme).focusRing};
      `}

      &:focus-visible {
        border-color: ${$hasError
          ? getVariant($variant, theme).errorBorder
          : getVariant($variant, theme).focusBorder};
        box-shadow: 0 0 0 3px
          ${$hasError
            ? getVariant($variant, theme).errorRing
            : getVariant($variant, theme).focusRing};
      }

      /* Error shake */
      ${$hasError &&
      css`
        animation: ${shakeError} 240ms ease both;
      `}

      /* Ghost */
      ${$variant === 'ghost' &&
      css`
        background: transparent;
        border-color: transparent;
        border-bottom-color: ${theme.border.color.neutral.medium};
        border-radius: 0;
        box-shadow: none;
        &:focus-visible {
          border-color: transparent;
          border-bottom-color: ${theme.color.primary[400]};
          box-shadow: none;
        }
      `}

      ${$disabled &&
      css`
        opacity: 0.48;
        cursor: not-allowed;
        pointer-events: none;
      `}

  @media (max-width: 767px) {
        ${($size === 'sm' || $size === 'md') &&
        css`
          font-size: 1rem;
          min-height: 44px;
        `}
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
        animation: none;
      }
    `;
  }}
`;

export const TriggerText = styled.span<{ $isPlaceholder: boolean }>`
  ${({ theme, $isPlaceholder }) => {
    return css`
      min-width: 0;
      flex: 1;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: ${$isPlaceholder ? theme.color.neutral[400] : theme.color.text.primary};
      overflow: hidden;
    `;
  }}
`;

export const TriggerIcon = styled.span<{ $side: 'left' | 'right' }>`
  ${({ theme, $side }) => {
    return css`
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      ${$side === 'left' ? 'left: 11px;' : 'right: 11px;'}
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.color.neutral[400]};
      pointer-events: none;
      z-index: 1;

      svg {
        display: block;
      }
    `;
  }}
`;

export const ChevronIcon = styled.span<{ $open: boolean }>`
  ${({ theme, $open }) => {
    return css`
      display: flex;
      align-items: center;
      position: absolute;
      top: 50%;
      right: 11px;
      color: ${theme.color.neutral[400]};
      pointer-events: none;
      transform: translateY(-50%);
      transition: transform ${theme.transition.duration.fast} ${theme.transition.timing.easeOut};

      ${$open &&
      css`
        transform: translateY(-50%) rotate(180deg);
      `}

      z-index: 1;
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;
  }}
`;

export const ClearBtn = styled.button`
  ${({ theme }) => {
    return css`
      width: 20px;
      height: 20px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      right: 30px;
      transform: translateY(-50%);
      border: none;
      border-radius: 4px;
      background: transparent;
      color: ${theme.color.neutral[400]};
      cursor: pointer;
      z-index: 1;

      &:hover {
        color: ${theme.color.neutral[700]};
        background: ${theme.color.background.neutral};
      }

      svg {
        display: block;
        width: 14px;
        height: 14px;
      }
    `;
  }}
`;

// ─── Search inside popover ────────────────────────────────────────────────────

export const SearchInput = styled.input`
  ${({ theme }) => {
    return css`
      box-sizing: border-box;
      width: 100%;
      padding: 8px 12px;
      display: block;
      border: none;
      border-bottom: 1px solid ${theme.border.color.neutral.light};
      background: ${theme.color.background.light};
      font-family: ${theme.typography.font.body};
      font-size: 0.875rem;
      color: ${theme.color.text.primary};
      outline: none;

      &::placeholder {
        color: ${theme.color.neutral[400]};
      }

      @media (max-width: 767px) {
        font-size: 1rem;
      }
    `;
  }}
`;

// ─── Option list ─────────────────────────────────────────────────────────────

export const OptionList = styled.div`
  padding: 4px 0;
`;

export const GroupLabel = styled.div`
  padding: 6px 12px 4px;
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.color.text.tertiary};
`;

export const OptionItem = styled.button<{
  $active: boolean;
  $selected: boolean;
}>`
  /* Reset */
  appearance: none;
  border: none;
  margin: 0;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;

  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 0.875rem;
  line-height: 1.4;
  color: ${({ $selected, theme }) =>
    $selected ? theme.color.primary[500] : theme.color.text.primary};

  background: ${({ $active, $selected, theme }) =>
    $active || $selected ? theme.color.background.neutral : 'transparent'};

  transition: background ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    background: ${({ theme }) => theme.color.background.neutral};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const OptionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.color.neutral[500]};
  svg {
    width: 16px;
    height: 16px;
    display: block;
  }
`;

export const OptionText = styled.span`
  flex: 1;
  min-width: 0;
`;

export const OptionLabel = styled.span`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const OptionDescription = styled.span`
  display: block;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.color.text.tertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CheckIcon = styled.span<{ $visible: boolean }>`
  flex-shrink: 0;
  margin-left: auto;
  color: ${({ theme }) => theme.color.primary[500]};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  svg {
    width: 14px;
    height: 14px;
    display: block;
  }
`;

export const EmptyState = styled.div`
  padding: 20px 12px;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.color.text.tertiary};
`;

// ─── DropPanel ────────────────────────────────────────────────────────────────
// Se renderiza en document.body vía createPortal.
// El posicionamiento (top, left, z-index, min-width) se aplica con inline
// styles desde useFloatingPanel. Aquí solo estilos visuales.

export const DropPanel = styled.div`
  background: ${({ theme }) => theme.color.background.light};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.medium};
  border-radius: 10px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.07),
    0 10px 24px -4px rgba(0, 0, 0, 0.1);

  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.border.color.neutral.medium} transparent;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border.color.neutral.medium};
    border-radius: 4px;
  }
`;
