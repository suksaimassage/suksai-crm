import styled, { css, keyframes } from 'styled-components';
import type { IKPICard } from './KPI.types';

// ============================================================
// ANIMATIONS
// ============================================================
const fadeSlideUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const valuePop = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.04); }
  100% { transform: scale(1); }
`;

// ============================================================
// COLOR MAP → theme tokens
// ============================================================
type TColor = NonNullable<IKPICard['color']>;

const colorAccentMap: Record<TColor, string> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

// ============================================================
// CARD WRAPPER
// ============================================================
export const KPICardWrapper = styled.article<{
  $updated: boolean;
  $color: TColor;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.color.background.card};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
  overflow: hidden;
  animation: ${fadeSlideUp} 0.35s ${({ theme }) => theme.effect.easing.out} both;
  transition:
    box-shadow ${({ theme }) => theme.transition.duration.fast} ease,
    transform ${({ theme }) => theme.transition.duration.fast} ease;

  /* Hover lift only on real pointer devices; no hover dependency on touch. */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      box-shadow: ${({ theme }) => theme.effect.shadow.outer.md};
      transform: translateY(-1px);
    }
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.99);
  }

  /* Real-time update pulse — accent glow at alpha, token-backed (no hardcoded rgba). */
  ${({ $updated, theme }) =>
    $updated
      ? css`
          box-shadow: ${theme.effect.glow.primary?.md ?? theme.effect.shadow.outer.md};
        `
      : ''}

  /* Top accent bar — the single committed brand moment; kept subtle. */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: ${({ theme }) => theme.border.radius.lg} ${({ theme }) => theme.border.radius.lg}
      0 0;
    background: ${({ theme, $color }) =>
      theme.color.gradient[colorAccentMap[$color] as keyof typeof theme.color.gradient]};
    opacity: 0.35;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

// ============================================================
// TOP ROW — micro-label (left) + bare sparkline (right)
// ============================================================
export const KPITopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const KPITitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  line-height: 1.4;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Sparkline visibility is band-gated to protect the title's legibility:
 *   xs        — hidden (card title needs the whole row).
 *   sm → md   — 72px (cards are wide enough to share the top row).
 *   lg        — hidden again: at 1024px the KPI grid is 2-up and each card's
 *               top row is too cramped for both a 72px chart and the longest
 *               ES title ("Citas completadas (mes)").
 *   xl+       — 96px: the grid goes 4-up but each card is wide once more.
 * KPISkeletonSparkline mirrors this EXACTLY so skeleton↔final have no CLS.
 */
export const KPISparklineSlot = styled.div`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: block;
    flex-shrink: 0;
    width: 72px;
    height: 28px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.xl}) {
    display: block;
    width: 96px;
  }
`;

// ============================================================
// VALUE ROW — large serif value + muted unit
// ============================================================
export const KPIValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

export const KPIValue = styled.p<{ $pop: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: clamp(2rem, 1.4rem + 2.2vw, 2.75rem);
  font-weight: ${({ theme }) => theme.typography.weight.light};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
  margin: 0;
  letter-spacing: -0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${({ $pop, theme }) =>
    $pop &&
    css`
      animation: ${valuePop} 0.2s ${theme.transition.timing.easeOut} both;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const KPIUnit = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.md};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.tertiary};
`;

// ============================================================
// COMPARISON / TREND
// ============================================================
export const KPIComparisonRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const KPITrendBadge = styled.span<{ $trend: 'up' | 'down' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-family: ${({ theme }) => theme.typography.font.body};
  letter-spacing: 0.02em;

  ${({ $trend, theme }) => {
    if ($trend === 'up')
      return css`
        background: ${theme.isDark ? theme.color.success[900] : theme.color.success[50]};
        color: ${theme.isDark ? theme.color.success[300] : theme.color.success[700]};
      `;
    if ($trend === 'down')
      return css`
        background: ${theme.isDark ? theme.color.error[900] : theme.color.error[50]};
        color: ${theme.isDark ? theme.color.error[300] : theme.color.error[700]};
      `;
    return css`
      background: ${theme.isDark ? theme.color.background.elevated : theme.color.neutral[100]};
      color: ${theme.isDark ? theme.color.text.secondary : theme.color.text.tertiary};
    `;
  }}
`;

export const KPIComparisonLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
`;

// ============================================================
// DESCRIPTION
// ============================================================
export const KPIDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  line-height: 1.5;
`;

// ============================================================
// SKELETON LOADER — mirrors the new layout (no CLS)
// ============================================================
export const KPISkeletonBase = styled.div`
  border-radius: ${({ theme }) => theme.border.radius.xs};
  background: ${({ theme }) =>
    theme.isDark
      ? `linear-gradient(
          90deg,
          ${theme.color.background.card} 0%,
          ${theme.color.background.elevated} 50%,
          ${theme.color.background.card} 100%
        )`
      : `linear-gradient(
          90deg,
          ${theme.color.neutral[100]} 0%,
          ${theme.color.neutral[50]} 50%,
          ${theme.color.neutral[100]} 100%
        )`};
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.neutral : theme.color.neutral[100]};
  }
`;

export const KPISkeletonTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const KPISkeletonTitle = styled(KPISkeletonBase)`
  height: 14px;
  width: 55%;
`;

// Mirrors KPISparklineSlot's band-gating EXACTLY (hidden at lg, 96px at xl) so
// the loading skeleton and the final card occupy identical space — zero CLS.
export const KPISkeletonSparkline = styled(KPISkeletonBase)`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: block;
    flex-shrink: 0;
    width: 72px;
    height: 28px;
    border-radius: ${({ theme }) => theme.border.radius.sm};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.xl}) {
    display: block;
    width: 96px;
  }
`;

export const KPISkeletonValue = styled(KPISkeletonBase)`
  height: 40px;
  width: 40%;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const KPISkeletonTrend = styled(KPISkeletonBase)`
  height: 22px;
  width: 84px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  margin-top: ${({ theme }) => theme.spacing.md};
`;
