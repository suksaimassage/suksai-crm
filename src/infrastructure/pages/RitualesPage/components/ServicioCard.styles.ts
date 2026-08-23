import styled from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { TTone } from '../RitualesPage.styles';

// ── Tone helpers (re-exported from root styles) ────────────────────────────────
// These functions are defined in RitualesPage.styles.ts and imported here so
// ServicioCard.styles.ts does not duplicate the logic.

export { getHeroBg, getHeroIconColor } from '../RitualesPage.styles';
export type { TTone } from '../RitualesPage.styles';

// ── Service grid ───────────────────────────────────────────────────────────────

export const StyledServiceGrid = styled.div`
  display: grid;
  /* Mobile: columna única */
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
`;

// ── Service card ───────────────────────────────────────────────────────────────

export const StyledServicioCard = styled.article<{ $tone: TTone }>`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition:
    box-shadow ${({ theme }) => theme.transition.duration.base}
      ${({ theme }) => theme.transition.timing.ease},
    transform ${({ theme }) => theme.transition.duration.base}
      ${({ theme }) => theme.transition.timing.ease};

  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${({ theme }) => theme.effect.elevation.raised};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledCardHero = styled.div<{ $tone: TTone }>`
  height: 96px;
  position: relative;
  display: grid;
  place-items: center;
  background: ${({ theme, $tone }: { theme: DefaultTheme; $tone: TTone }) => {
    // inline import avoided — getHeroBg is imported by the component layer
    // This styled component receives the resolved bg as a prop is not feasible
    // without a helper. Use the same switch inline to keep styles self-contained.
    switch ($tone) {
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
  }};
`;

export const StyledCardGlyph = styled.div<{ $tone: TTone }>`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: ${({ theme, $tone }: { theme: DefaultTheme; $tone: TTone }) => {
    switch ($tone) {
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
  }};
`;

export const StyledStatusPill = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
`;

export const StyledPricePill = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: ${({ theme }) => theme.color.background.overlay};
  color: ${({ theme }) => theme.color.text.inverse};
  font-family: ${({ theme }) => theme.typography.font.display};
  font-style: italic;
  font-size: 16px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  padding: 5px 10px;
  line-height: 1;
`;

export const StyledCardBody = styled.div`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  flex: 1;
`;

export const StyledCardName = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const StyledCardCode = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledCardDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  line-height: 1.55;
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const StyledCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: auto;
`;

export const StyledDurationPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.display};
  font-style: italic;
  font-size: 13px;
  color: ${({ theme }) => theme.color.text.secondary};
`;

// ── Add-new card ───────────────────────────────────────────────────────────────

export const StyledAddCard = styled.button`
  border-radius: ${({ theme }) => theme.border.radius.lg};
  border: 2px dashed ${({ theme }) => theme.border.color.neutral.subtle};
  background: transparent;
  display: grid;
  place-items: center;
  min-height: 280px;
  cursor: pointer;
  width: 100%;
  transition: border-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};
  color: ${({ theme }) => theme.color.text.tertiary};

  @media (hover: hover) {
    &:hover {
      border-color: ${({ theme }) => theme.color.intent.primary};
      color: ${({ theme }) => theme.color.intent.primary};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledAddCardInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

export const StyledAddCardIcon = styled.i`
  font-size: 32px;
`;

// ── Grid empty states ──────────────────────────────────────────────────────────

export const StyledGridEmpty = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.color.text.tertiary};
  text-align: center;
`;

export const StyledGridEmptyIcon = styled.i`
  font-size: 32px;
  color: ${({ theme }) => theme.color.text.tertiary};
`;

export const StyledGridEmptyTitle = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
`;

export const StyledGridEmptyDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
  margin: 0;
`;

// ── Skeleton ───────────────────────────────────────────────────────────────────

export const StyledSkeletonCard = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
`;

export const StyledSkeletonHero = styled.div`
  height: 96px;
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.color.background.neutral} 25%, ${theme.color.background.card} 50%, ${theme.color.background.neutral} 75%)`};
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 0;

  @keyframes shimmer {
    0% {
      background-position: -400px 0;
    }
    100% {
      background-position: 400px 0;
    }
  }
`;

export const StyledSkeletonBody = styled.div`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;
