/**
 * Toast — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css, keyframes } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { TToastPosition, TToastType } from './Toast.types';

// ─── Animations ───────────────────────────────────────────────────────────────

const slideInRight = keyframes`
  from { transform: translateX(calc(100% + 16px)); opacity: 0; }
  to   { transform: translateX(0);                  opacity: 1; }
`;
const slideInLeft = keyframes`
  from { transform: translateX(calc(-100% - 16px)); opacity: 0; }
  to   { transform: translateX(0);                   opacity: 1; }
`;
const slideInDown = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
`;
const slideInUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;
const fadeOut = keyframes`
  from { opacity: 1; transform: scale(1);    max-height: 120px; margin-bottom: 8px; }
  to   { opacity: 0; transform: scale(0.94); max-height: 0;     margin-bottom: 0;  }
`;

// ─── Color tokens per type ────────────────────────────────────────────────────

interface TToastColorEntry {
  bar: string;
  bg: string;
  icon: string;
}

const getToastTypeColors = (theme: DefaultTheme): Record<TToastType, TToastColorEntry> => ({
  success: {
    bar: theme.color.intent.success,
    bg: theme.color.intent.success,
    icon: theme.color.intent.success,
  },
  error: {
    bar: theme.color.intent.error,
    bg: theme.color.intent.error,
    icon: theme.color.intent.error,
  },
  warning: {
    bar: theme.color.intent.warning,
    bg: theme.color.intent.warning,
    icon: theme.color.intent.warning,
  },
  info: {
    bar: theme.color.intent.info,
    bg: theme.color.intent.info,
    icon: theme.color.intent.info,
  },
  default: {
    bar: theme.color.intent.primary,
    bg: theme.color.intent.primary,
    icon: theme.color.intent.primary,
  },
});

// ─── Container (portal root) ──────────────────────────────────────────────────

const POSITION_STYLES: Record<TToastPosition, ReturnType<typeof css>> = {
  'top-right': css`
    top: 16px;
    right: 16px;
    align-items: flex-end;
  `,
  'top-left': css`
    top: 16px;
    left: 16px;
    align-items: flex-start;
  `,
  'top-center': css`
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  `,
  'bottom-right': css`
    bottom: 16px;
    right: 16px;
    align-items: flex-end;
    flex-direction: column-reverse;
  `,
  'bottom-left': css`
    bottom: 16px;
    left: 16px;
    align-items: flex-start;
    flex-direction: column-reverse;
  `,
  'bottom-center': css`
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
    flex-direction: column-reverse;
  `,
};

export const ToastContainer = styled.div<{ $position: TToastPosition }>`
  ${({ theme, $position }) => {
    return css`
      width: calc(100vw - 32px);
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      position: fixed;
      ${POSITION_STYLES[$position]}
      pointer-events: none;

      z-index: ${theme.zIndex.toast};
      @media (min-width: ${theme.breakpoint.sm}) {
        width: 380px;
      }
    `;
  }}
`;

// ─── Animation selector ───────────────────────────────────────────────────────

function getEntryAnimation(position: TToastPosition) {
  if (position.includes('right')) return slideInRight;
  if (position.includes('left')) return slideInLeft;
  if (position.startsWith('top')) return slideInDown;
  return slideInUp;
}

// ─── Toast item ───────────────────────────────────────────────────────────────

export const ToastItem = styled.div<{
  $type: TToastType;
  $position: TToastPosition;
  $exiting: boolean;
}>`
  ${({ theme, $type, $exiting, $position }) => {
    const { border, color, effect } = theme;
    const t = getToastTypeColors(theme)[$type];

    const background = css`
    color-mix(
      in srgb,
      ${color.background.light} 92%,
      ${t.bar} 8%
    )
  `;
    const animation = $exiting
      ? css`
          ${fadeOut} 0.25s ease forwards
        `
      : css`
          ${getEntryAnimation($position)} 0.3s cubic-bezier(0.21,1.02,0.73,1) both
        `;

    return css`
      padding: 14px 14px 14px 16px;
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      overflow: hidden;
      border: 1px solid ${background};
      border-radius: ${border.radius.md};
      background: ${background};
      box-shadow: ${effect.shadow.outer.lg};
      pointer-events: auto;
      position: relative;
      animation: ${animation};

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 8px;
        border-radius: 0 2px 2px 0;
        background: ${t.bar};
      }
    `;
  }}
`;

// ─── Icon wrapper ─────────────────────────────────────────────────────────────

export const ToastIcon = styled.span<{ $type: TToastType }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  color: ${({ theme, $type }) => getToastTypeColors(theme)[$type].icon};

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ─── Content ──────────────────────────────────────────────────────────────────

export const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ToastTitle = styled.p`
  ${({ theme }) => {
    const { typography, color } = theme;

    return css`
      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      font-weight: ${typography.weight.semibold};
      color: ${color.text.primary};
    `;
  }}
  line-height: 1.3;
  margin: 0;
`;

export const ToastDescription = styled.p`
  ${({ theme }) => {
    const { typography, color } = theme;

    return css`
      font-family: ${typography.font.body};
      font-size: ${typography.size.xs};
      color: ${color.text.secondary};
    `;
  }}
  line-height: 1.5;
  margin: 0;
`;

export const ToastAction = styled.button`
  ${({ theme }) => {
    const { typography, color } = theme;

    return css`
      margin-top: 6px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      text-align: left;
      font-family: ${typography.font.body};
      font-size: ${typography.size.xs};
      font-weight: ${typography.weight.semibold};
      color: ${color.primary[500]};
      transition: color 0.15s;

      &:hover {
        color: ${color.primary[700]};
      }
    `;
  }}
`;

// ─── Close button ─────────────────────────────────────────────────────────────

export const CloseBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.text.tertiary};
  cursor: pointer;
  padding: 0;
  margin: -2px -2px 0 0;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.color.neutral[100]};
    color: ${({ theme }) => theme.color.text.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

// ─── Progress bar ─────────────────────────────────────────────────────────────

const progressShrink = keyframes`
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
`;

export const ProgressBar = styled.span.attrs<{
  $duration: number;
  $paused: boolean;
}>(({ $duration, $paused }) => ({
  style: {
    animationDuration: `${$duration}ms`,
    animationPlayState: $paused ? 'paused' : 'running',
  },
}))<{ $type: TToastType; $duration: number; $paused: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: ${({ theme, $type }) => getToastTypeColors(theme)[$type].bar};
  transform-origin: left center;
  opacity: 0.4;
  animation: ${progressShrink} linear forwards;
`;
