/**
 * RitualesPage.styles.ts — ROOT-LEVEL PRIMITIVES ONLY
 *
 * This file now contains only the styled primitives consumed by RitualesPage.tsx
 * (the page shell), plus the shared shimmer animation + TTone type that
 * sub-components import.
 *
 * Sub-component styled primitives live alongside their consumers:
 *   components/RitualesPageHeader.styles.ts  — header eyebrow / h1 / description
 *   components/RitualesKPIStrip.styles.ts    — KPI strip cells + skeleton
 *   components/RitualesToolbar.styles.ts     — tabs + search
 *   components/CategoryRail.styles.ts        — rail rows + footer
 *   components/ServicioCard.styles.ts        — card, grid, add-card, skeleton, empty states
 *   components/ComplementosSection.styles.ts — section divider + title
 */

import styled, { keyframes, css } from 'styled-components';
import type { DefaultTheme } from 'styled-components';

// ── Tone system ────────────────────────────────────────────────────────────────
// Exported so sub-components (ServicioCard.styles.ts) can import the type and
// tone resolver functions from a single source of truth.

export type TTone = 'bamboo' | 'gold' | 'lotus' | 'ink' | 'clay' | 'default';

export function getHeroBg(tone: TTone, theme: DefaultTheme): string {
  switch (tone) {
    case 'bamboo':
      return theme.color.background.neutral;
    case 'gold':
      return theme.color.overlay.primary;
    case 'lotus':
      return `color-mix(in oklch, ${theme.color.intent.tertiary} 8%, transparent)`;
    case 'ink':
      return theme.color.background.dark;
    case 'clay':
      return `color-mix(in oklch, ${theme.color.text.warning} 10%, transparent)`;
    default:
      return theme.color.background.card;
  }
}

export function getHeroIconColor(tone: TTone, theme: DefaultTheme): string {
  switch (tone) {
    case 'bamboo':
      return theme.color.text.tertiary;
    case 'gold':
      return theme.color.intent.primary;
    case 'lotus':
      return theme.color.intent.tertiary;
    case 'ink':
      return theme.color.text.inverse;
    case 'clay':
      return theme.color.text.warning;
    default:
      return theme.color.text.secondary;
  }
}

// ── Skeleton shimmer animation ─────────────────────────────────────────────────
// Exported for re-use by StyledSkeletonRect (used by KPIStrip + ServiceGridSection).

export const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

export const shimmerMixin = css`
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.color.background.neutral} 25%, ${theme.color.background.card} 50%, ${theme.color.background.neutral} 75%)`};
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
  border-radius: ${({ theme }) => theme.border.radius.sm};
`;

// ── Shared utility ─────────────────────────────────────────────────────────────

/** Used in skeleton cells (KPIStrip + ServiceGridSection). */
export const StyledSkeletonRect = styled.div<{
  $width?: string;
  $height?: string;
}>`
  width: ${({ $width }) => $width ?? '100%'};
  height: ${({ $height }) => $height ?? '16px'};
  ${shimmerMixin}
`;

/** Screen-reader–only visually-hidden helper. */
export const StyledSrOnly = styled.span`
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

// ── Page shell ─────────────────────────────────────────────────────────────────

export const StyledRitualesPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

// ── Content layout grid (rail + service grid) ──────────────────────────────────

export const StyledContentGrid = styled.div`
  display: grid;
  /* Mobile: columna única — rail arriba, grid de servicios debajo */
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 220px 1fr;
  }
`;
