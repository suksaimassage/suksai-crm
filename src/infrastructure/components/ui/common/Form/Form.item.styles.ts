/**
 * Form.item.styles.ts
 *
 * Styled Components for FormInput variants.
 *
 * Architecture:
 *  <span InputWrap>   — layout only (position:relative, flex)
 *    <input>          — visual owner (border, focus ring, bg)
 *    <span IconSlot>  — static icon overlay
 *    <button IconBtn> — interactive icon overlay
 *  </span>
 *
 * SearchInput overlay components live at the bottom of this file.
 * They are rendered via createPortal — portal components use position:fixed.
 *
 * Naming convention for portal components:
 *   SearchPortalPopover  — desktop dropdown (position:fixed)
 *   SearchBackdrop       — mobile full-screen scrim
 *   SearchBottomSheet    — mobile result panel
 *   SearchResultList     — shared scrollable listbox (desktop + mobile)
 */

import styled, { css, type DefaultTheme, keyframes } from 'styled-components';
import type { InputVariant, InputSize } from './Form.item.types';

// ─── Animations ──────────────────────────────────────────────────────────────

const shakeError = keyframes`
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-3px); }
  75%       { transform: translateX(3px); }
`;

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** Dropdown opening downward */
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/** Dropdown opening upward (top-placement) */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(0.98) translateY(-100%); }
  to   { opacity: 1; transform: translateY(0) scale(1) translateY(-100%); }
`;

/** Bottom-sheet sliding up from viewport bottom */
const sheetSlideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

/** Backdrop fade */
const backdropFade = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─── Variant tokens ──────────────────────────────────────────────────────────

interface IVariantTokens {
  background: string;
  border: string;
  focusBorder: string;
  focusRing: string;
  errorBorder: string;
  errorRing: string;
  placeholderFg: string;
  iconFg: string;
  iconFgHover: string;
}

const getVariant = (variant: InputVariant, theme: DefaultTheme): IVariantTokens => {
  const map: Record<InputVariant, IVariantTokens> = {
    outlined: {
      background: theme.color.background.light || '',
      border: theme.color.neutral[200],
      focusBorder: theme.color.primary[400],
      focusRing: 'rgba(115,91,254,0.12)',
      errorBorder: theme.color.error[400],
      errorRing: 'rgba(255,56,119,0.10)',
      placeholderFg: theme.color.neutral[400],
      iconFg: theme.color.neutral[400],
      iconFgHover: theme.color.neutral[700],
    },
    filled: {
      background: theme.color.neutral[50] || '',
      border: theme.color.neutral[200],
      focusBorder: theme.color.primary[400],
      focusRing: 'rgba(115,91,254,0.10)',
      errorBorder: theme.color.error[400],
      errorRing: 'rgba(255,56,119,0.08)',
      placeholderFg: theme.color.neutral[400],
      iconFg: theme.color.neutral[400],
      iconFgHover: theme.color.neutral[700],
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
      iconFgHover: theme.color.neutral[700],
    },
  };
  return map[variant];
};

// ─── Size tokens ─────────────────────────────────────────────────────────────

const SZ: Record<
  InputSize,
  {
    height: string;
    px: string;
    py: string;
    fontSize: string;
    iconSize: string;
    slotSize: string;
    iconGap: string;
    radius: string;
    countBottom: string;
  }
> = {
  sm: {
    height: '34px',
    px: '11px',
    py: '7px',
    fontSize: '0.8125rem',
    iconSize: '16px',
    slotSize: '28px',
    iconGap: '6px',
    radius: '8px',
    countBottom: '7px',
  },
  md: {
    height: '42px',
    px: '13px',
    py: '10px',
    fontSize: '0.875rem',
    iconSize: '18px',
    slotSize: '32px',
    iconGap: '7px',
    radius: '10px',
    countBottom: '8px',
  },
  lg: {
    height: '50px',
    px: '15px',
    py: '12px',
    fontSize: '1rem',
    iconSize: '20px',
    slotSize: '36px',
    iconGap: '8px',
    radius: '12px',
    countBottom: '10px',
  },
};

// ─── FieldWrapper ────────────────────────────────────────────────────────────

export const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
`;

// ─── Label ───────────────────────────────────────────────────────────────────

export const Label = styled.label<{ $required?: boolean }>`
  display: block;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 0.8125rem;
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1.2;

  ${({ $required, theme }) =>
    $required &&
    css`
      &::after {
        content: ' *';
        color: ${theme.color.error[400]};
      }
    `}
`;

// ─── InputWrap ────────────────────────────────────────────────────────────────
// Layout-only wrapper — no visual styles of its own.
// position:relative is the anchor for portal position calculation.

export const InputWrap = styled.span<{ $disabled: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: stretch;
  width: 100%;

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.48;
      pointer-events: none;
    `}
`;

// ─── NativeInput ─────────────────────────────────────────────────────────────
// Visual owner: border, focus ring, bg, error state.

export const NativeInput = styled.input<{
  $size: InputSize;
  $variant: InputVariant;
  $hasError: boolean;
  $hasLeft: boolean;
  $hasRight: boolean;
}>`
  /* Reset */
  appearance: none;
  outline: none;
  margin: 0;

  /* Layout */
  display: block;
  width: 100%;
  height: ${({ $size }) => SZ[$size].height};
  min-width: 0;
  box-sizing: border-box;

  /* Typography */
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => SZ[$size].fontSize};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.5;

  /* Visual */
  background: ${({ $variant, theme }) => getVariant($variant, theme).background};
  border: 1px solid
    ${({ $variant, $hasError, theme }) =>
      $hasError ? getVariant($variant, theme).errorBorder : getVariant($variant, theme).border};
  border-radius: ${({ $size }) => SZ[$size].radius};

  /* Padding: compensate for icon slots */
  padding-top: 0;
  padding-bottom: 0;
  padding-left: ${({ $hasLeft, $size }) =>
    $hasLeft ? `calc(${SZ[$size].slotSize} + ${SZ[$size].iconGap})` : SZ[$size].px};
  padding-right: ${({ $hasRight, $size }) =>
    $hasRight ? `calc(${SZ[$size].slotSize} + ${SZ[$size].iconGap})` : SZ[$size].px};

  /* Placeholder */
  &::placeholder {
    color: ${({ $variant, theme }) => getVariant($variant, theme).placeholderFg};
  }

  /* Focus ring */
  &:focus {
    border-color: ${({ $variant, $hasError, theme }) =>
      $hasError
        ? getVariant($variant, theme).errorBorder
        : getVariant($variant, theme).focusBorder};
    box-shadow: 0 0 0 3px
      ${({ $variant, $hasError, theme }) =>
        $hasError ? getVariant($variant, theme).errorRing : getVariant($variant, theme).focusRing};
  }

  /* Error shake */
  ${({ $hasError }) =>
    $hasError &&
    css`
      animation: ${shakeError} 240ms ease both;
    `}

  /* Disabled */
  &:disabled {
    cursor: not-allowed;
    opacity: 1; /* opacity handled by InputWrap */
  }

  /* Ghost variant */
  ${({ $variant, theme }) =>
    $variant === 'ghost' &&
    css`
      background: transparent;
      border-color: transparent;
      border-bottom-color: ${theme.color.neutral[200]};
      border-radius: 0;
      box-shadow: none;
      &:focus {
        border-color: transparent;
        border-bottom-color: ${theme.color.primary[400]};
        box-shadow: none;
      }
    `}

  /* Remove native browser search/number chrome */
  &[type="search"]::-webkit-search-cancel-button,
  &[type="search"]::-webkit-search-decoration {
    display: none;
  }
  &[type='number']::-webkit-inner-spin-button,
  &[type='number']::-webkit-outer-spin-button {
    appearance: none;
  }

  transition:
    border-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

// ─── NativeTextarea ───────────────────────────────────────────────────────────

export const NativeTextarea = styled.textarea<{
  $size: InputSize;
  $variant: InputVariant;
  $hasError: boolean;
  $hasLeft: boolean;
  $hasRight: boolean;
  $minRows: number;
  $hasCount: boolean;
}>`
  appearance: none;
  outline: none;
  margin: 0;

  display: block;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  resize: vertical;

  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => SZ[$size].fontSize};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.6;

  background: ${({ $variant, theme }) => getVariant($variant, theme).background};
  border: 1px solid
    ${({ $variant, $hasError, theme }) =>
      $hasError ? getVariant($variant, theme).errorBorder : getVariant($variant, theme).border};
  border-radius: ${({ $size }) => SZ[$size].radius};

  padding-top: ${({ $size }) => SZ[$size].py};
  padding-left: ${({ $hasLeft, $size }) =>
    $hasLeft ? `calc(${SZ[$size].slotSize} + ${SZ[$size].iconGap})` : SZ[$size].px};
  padding-right: ${({ $hasRight, $size }) =>
    $hasRight ? `calc(${SZ[$size].slotSize} + ${SZ[$size].iconGap})` : SZ[$size].px};
  padding-bottom: ${({ $size, $hasCount }) =>
    $hasCount ? `calc(${SZ[$size].py} + 22px)` : SZ[$size].py};

  min-height: calc(${({ $minRows }) => $minRows} * 1.6em + 28px);
  height: auto;

  &::placeholder {
    color: ${({ $variant, theme }) => getVariant($variant, theme).placeholderFg};
  }

  &:focus {
    border-color: ${({ $variant, $hasError, theme }) =>
      $hasError
        ? getVariant($variant, theme).errorBorder
        : getVariant($variant, theme).focusBorder};
    box-shadow: 0 0 0 3px
      ${({ $variant, $hasError, theme }) =>
        $hasError ? getVariant($variant, theme).errorRing : getVariant($variant, theme).focusRing};
  }

  ${({ $hasError }) =>
    $hasError &&
    css`
      animation: ${shakeError} 240ms ease both;
    `}

  &:disabled {
    cursor: not-allowed;
  }

  ${({ $variant, theme }) =>
    $variant === 'ghost' &&
    css`
      background: transparent;
      border-color: transparent;
      border-bottom-color: ${theme.color.neutral[200]};
      border-radius: 0;
      box-shadow: none;
      &:focus {
        border-color: transparent;
        border-bottom-color: ${theme.color.primary[400]};
        box-shadow: none;
      }
    `}

  transition:
    border-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

// ─── IconSlot / IconButton ────────────────────────────────────────────────────

const iconSlotBase = css<{ $size: InputSize; $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  /* z-index needed: NativeInput shake animation creates a stacking context */
  z-index: 1;
  ${({ $side, $size }) =>
    $side === 'left'
      ? css`
          left: ${SZ[$size].iconGap};
        `
      : css`
          right: ${SZ[$size].iconGap};
        `}

  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => SZ[$size].slotSize};
  height: ${({ $size }) => SZ[$size].slotSize};
  flex-shrink: 0;

  svg {
    width: ${({ $size }) => SZ[$size].iconSize};
    height: ${({ $size }) => SZ[$size].iconSize};
    display: block;
    flex-shrink: 0;
  }
`;

export const IconSlot = styled.span<{
  $size: InputSize;
  $side: 'left' | 'right';
  $variant: InputVariant;
}>`
  ${iconSlotBase}
  color: ${({ $variant, theme }) => getVariant($variant, theme).iconFg};
  pointer-events: none;
`;

export const IconButton = styled.button<{
  $size: InputSize;
  $side: 'left' | 'right';
  $variant: InputVariant;
}>`
  ${iconSlotBase}

  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;

  color: ${({ $variant, theme }) => getVariant($variant, theme).iconFg};
  border-radius: 6px;

  transition:
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.neutral[700]};
    background: ${({ theme }) => theme.color.neutral[100]};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.primary[400]};
    outline-offset: 1px;
    color: ${({ theme }) => theme.color.neutral[700]};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── CharCountOverlay ─────────────────────────────────────────────────────────

export const CharCountOverlay = styled.span<{
  $near: boolean;
  $over: boolean;
  $size: InputSize;
}>`
  position: absolute;
  bottom: ${({ $size }) => SZ[$size].countBottom};
  right: ${({ $size }) => SZ[$size].px};
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 0.6875rem;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  color: ${({ $over, $near, theme }) =>
    $over ? theme.color.error[500] : $near ? theme.color.warning[600] : theme.color.neutral[400]};
  transition: color ${({ theme }) => theme.transition.duration.fast};
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── BottomRow / SubText ──────────────────────────────────────────────────────

export const BottomRow = styled.div`
  display: flex;
  align-items: flex-start;
  min-height: 16px;
`;

export const SubText = styled.span<{ $isError: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 0.75rem;
  line-height: 1.4;
  color: ${({ $isError, theme }) =>
    $isError ? theme.color.error[500] : theme.color.text.tertiary};
  animation: ${fadeSlideIn} 140ms ease both;

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

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH OVERLAY COMPONENTS
// All portal-rendered: escape overflow:hidden by mounting in document.body.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SearchPortalPopover ──────────────────────────────────────────────────────
// Desktop dropdown.
// position:fixed so it is never clipped by ancestor overflow.
// top / left / width / maxHeight are injected as inline style by SearchInput.
// transform: translateY(-100%) is applied for 'top' placement via inline style.

export const SearchPortalPopover = styled.div<{
  $placement: 'bottom' | 'top';
}>`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.popover};

  background: ${({ theme }) => theme.color.background.light};
  border: 1px solid ${({ theme }) => theme.color.neutral[200]};
  border-radius: 10px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.07),
    0 12px 28px -6px rgba(0, 0, 0, 0.12);

  overflow: hidden;

  /* Animate in — direction depends on placement */
  animation: ${({ $placement }) => ($placement === 'top' ? slideUp : slideDown)} 160ms
    cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─── SearchResultList ─────────────────────────────────────────────────────────
// The scrollable listbox. Used inside both desktop popover and mobile sheet.
// max-height is constrained by the parent (SearchPortalPopover or SearchBottomSheet).

export const SearchResultList = styled.div`
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  /* Thin scrollbar */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.color.neutral[200]} transparent;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.color.neutral[200]};
    border-radius: 4px;
  }
`;

// ─── SearchBackdrop ───────────────────────────────────────────────────────────
// Mobile: full-screen translucent scrim rendered before the bottom-sheet.
// Clicking it closes the overlay.

export const SearchBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.overlay};
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  animation: ${backdropFade} 200ms ease both;
  touch-action: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─── SearchBottomSheet ────────────────────────────────────────────────────────
// Mobile: panel that slides up from the bottom of the viewport.
// Contains the SearchResultList.

export const SearchBottomSheet = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};

  /* Respect device safe area (notch, home indicator) */
  padding-bottom: env(safe-area-inset-bottom, 0px);

  background: ${({ theme }) => theme.color.background.light};
  border-top: 1px solid ${({ theme }) => theme.color.neutral[100]};
  border-radius: 16px 16px 0 0;
  box-shadow:
    0 -4px 16px rgba(0, 0, 0, 0.08),
    0 -1px 4px rgba(0, 0, 0, 0.04);

  /* Limit height; allow scrolling inside */
  max-height: min(60vh, 480px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  animation: ${sheetSlideUp} 260ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─── SearchBottomSheetHandle ──────────────────────────────────────────────────
// Visual drag handle at the top of the bottom-sheet.

export const SearchBottomSheetHandle = styled.span`
  display: block;
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.color.neutral[200]};
  margin: 10px auto 6px;
  flex-shrink: 0;
`;

// ─── SearchResultItem ─────────────────────────────────────────────────────────

export const SearchResultItem = styled.button<{ $active: boolean }>`
  appearance: none;
  border: none;
  margin: 0;
  text-align: left;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  /* Touch-friendly minimum tap target */
  min-height: 44px;
  padding: 9px 12px;

  background: ${({ $active, theme }) => ($active ? theme.color.primary[50] : 'transparent')};
  color: ${({ theme }) => theme.color.text.primary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 0.875rem;
  line-height: 1.4;

  transition: background ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    background: ${({ theme }) => theme.color.neutral[50]};
  }
  &:focus-visible {
    outline: none;
    background: ${({ theme }) => theme.color.primary[50]};
  }

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.neutral[100]};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── SearchResultIcon ─────────────────────────────────────────────────────────

export const SearchResultIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.color.neutral[100]};
  color: ${({ theme }) => theme.color.neutral[500]};

  svg {
    width: 16px;
    height: 16px;
    display: block;
  }
`;

// ─── SearchResultText ─────────────────────────────────────────────────────────

export const SearchResultText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

export const SearchResultLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  mark {
    background: transparent;
    color: ${({ theme }) => theme.color.primary[500]};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
  }
`;

export const SearchResultDescription = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.color.text.tertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ─── SearchEmptyState ─────────────────────────────────────────────────────────

export const SearchEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 16px;
  color: ${({ theme }) => theme.color.text.tertiary};

  svg {
    width: 28px;
    height: 28px;
    opacity: 0.4;
  }
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const skeletonBg = css`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.neutral[100]} 25%,
    ${({ theme }) => theme.color.neutral[50]} 50%,
    ${({ theme }) => theme.color.neutral[100]} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${({ theme }) => theme.color.neutral[100]};
  }
`;

export const SearchSkeletonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  min-height: 44px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.neutral[100]};
  }
`;

export const SearchSkeletonCircle = styled.span`
  ${skeletonBg}
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
`;

export const SearchSkeletonLine = styled.span<{ $width: string }>`
  ${skeletonBg}
  height: 12px;
  width: ${({ $width }) => $width};
  border-radius: 6px;
`;
