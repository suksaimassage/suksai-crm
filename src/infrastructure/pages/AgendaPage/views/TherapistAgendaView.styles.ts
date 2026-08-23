import styled from 'styled-components';
import type { TAgendaTimelineState } from '@domain/types';

export const StyledTherHero = styled.section`
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  border-radius: 18px;
  background:
    radial-gradient(
      ellipse at 90% 20%,
      ${({ theme }) =>
        theme.isDark ? theme.color.brand.gold.bgHero : theme.color.brand.gold.glow},
      transparent 55%
    ),
    radial-gradient(
      ellipse at 8% 90%,
      ${({ theme }) =>
        theme.isDark ? 'oklch(0.25 0.03 143 / 0.18)' : theme.color.brand.jungle.bg},
      transparent 60%
    ),
    linear-gradient(
      135deg,
      ${({ theme }) => (theme.isDark ? 'oklch(0.16 0.03 204)' : theme.color.neutralWarm[50])} 0%,
      ${({ theme }) => (theme.isDark ? 'oklch(0.23 0.04 204)' : theme.color.neutralWarm[100])} 100%
    );
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 20px;
  }
`;

export const StyledHeroText = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  max-width: 640px;
  gap: 8px;
`;

export const StyledHeroEyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledHeroTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: 300;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.2;
`;

export const StyledHeroParagraph = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13.5px;
  color: ${({ theme }) => theme.color.text.muted};
  margin: 0;
  line-height: 1.55;
`;

export const StyledHeroStats = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 28px;
  min-width: 280px;
  align-content: start;

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    min-width: 0;
    gap: 12px;
  }
`;

export const StyledHeroStatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledHeroStatValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: 400;
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.1;
`;

export const StyledHeroStatLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledHeroLotus = styled.div`
  position: absolute;
  right: -30px;
  bottom: -50px;
  width: 220px;
  color: ${({ theme }) => theme.color.brand.gold[400]};
  opacity: 0.14;
  pointer-events: none;
`;

export const StyledTherGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledTherapistFilterStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: transparent;
  border: none;
  padding: 0 4px;
`;

export const StyledTimelinePanel = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  padding: 16px 10px 16px 26px;
`;

export const StyledTimelinePanelHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 6px 16px 6px 0;
  margin-bottom: 8px;
`;

export const StyledTimelinePanelTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: 400;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;

  em {
    font-style: italic;
    color: ${({ theme }) =>
      theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
  }
`;

export const StyledRoomPill = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.elevated : theme.color.background.neutral};
  color: ${({ theme }) => theme.color.text.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledTimeline = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0;
  list-style: none;
  margin: 0;
  padding: 0;
`;

// Three-column rail geometry (Designer FINAL): [time 60px][spine 24px][card 1fr].
// The spine column holds the vertical rail + node; folding the old 22px gap into
// it removes the collision between the time gutter and the card. The px literals
// for the rail (60 / 24 / 72 / 65 / 14) are an accepted exception for spine
// geometry — colours/typography stay tokenised.
export const StyledTimelineItem = styled.li<{ $state: TAgendaTimelineState }>`
  display: grid;
  grid-template-columns: 60px 24px 1fr;
  gap: 0;
  position: relative;
  padding: 14px 0;
  opacity: ${({ $state }) => ($state === 'done' ? 0.65 : 1)};

  /* Vertical rail centred on the 24px spine column: 60 + 24/2 = 72. */
  &::before {
    content: '';
    position: absolute;
    left: 72px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: ${({ theme }) => theme.border.color.neutral.light};
  }

  &:last-child::before {
    bottom: 50%;
  }
`;

// Node dot centred on the rail at x=72: left 65 + 14/2 = 72.
export const StyledTimelineNode = styled.div<{ $state: TAgendaTimelineState }>`
  position: absolute;
  left: 65px;
  top: 22px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  z-index: 1;

  background: ${({ $state, theme }) => {
    switch ($state) {
      case 'done':
        return theme.color.brand.gold[400];
      case 'now':
        return theme.color.brand.clay[500];
      case 'pending':
        return theme.color.background.card;
      case 'break':
        return theme.color.background.card;
    }
  }};
  border: 2px solid
    ${({ $state, theme }) => {
      switch ($state) {
        case 'done':
          return theme.color.brand.gold[400];
        case 'now':
          return theme.color.brand.clay[500];
        case 'pending':
          return theme.color.brand.gold[400];
        case 'break':
          return theme.border.color.neutral.medium;
      }
    }};
  box-shadow: ${({ $state, theme }) =>
    $state === 'now' ? `0 0 0 4px ${theme.color.brand.gold.glow}` : 'none'};
`;

export const StyledTimelineWhen = styled.div`
  grid-column: 1;
  text-align: right;
  padding-top: 6px;
  position: relative;
`;

export const StyledTimelineTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.text.primary};
  display: block;
`;

export const StyledTimelineDuration = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  color: ${({ theme }) => theme.color.text.muted};
  display: block;
  margin-top: 2px;
`;

// Now an activatable <button> (native Enter/Space) — the whole card opens the
// quick-edit modal. Native button chrome is reset; the $state visual language
// (background / border / now-glow / gradient) is preserved unchanged.
export const StyledTimelineCard = styled.button<{ $state: TAgendaTimelineState }>`
  /* Reset native button chrome */
  appearance: none;
  /* The node is position:absolute (out of flow), so the only in-flow grid items
     are [when] and [card]. Pin the card to column 3 explicitly — otherwise it
     auto-places into the empty 24px spine column (column 2) and collapses. */
  grid-column: 3;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: block;

  background: ${({ $state, theme }) =>
    $state === 'done'
      ? theme.isDark
        ? theme.color.background.light
        : theme.color.neutralWarm[50]
      : theme.color.background.card};
  border: 1px solid
    ${({ $state, theme }) =>
      $state === 'now' ? theme.color.brand.gold[400] : theme.border.color.neutral.light};
  border-radius: 14px;
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ $state, theme }) =>
    $state === 'now' ? `0 0 0 4px ${theme.color.brand.gold.glow}` : 'none'};
  background-image: ${({ $state, theme }) =>
    $state === 'now'
      ? `linear-gradient(180deg, ${theme.color.background.card} 0%, ${theme.color.brand.gold.bgNow} 100%)`
      : 'none'};
  transition:
    border-color 140ms ease,
    transform 140ms ease,
    box-shadow 140ms ease;

  /* Hover affordance — only on real pointers. Suppressed for 'now' (it already
     carries a glow ring) to avoid double emphasis. */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: ${({ $state, theme }) =>
        $state === 'now' ? theme.color.brand.gold[400] : theme.color.brand.gold[300]};
      transform: ${({ $state }) => ($state === 'now' ? 'none' : 'translateY(-1px)')};
      box-shadow: ${({ $state, theme }) =>
        $state === 'now'
          ? `0 0 0 4px ${theme.color.brand.gold.glow}`
          : theme.effect.shadow.outer.sm};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

export const StyledTimelineCardNowBadge = styled.span`
  position: absolute;
  top: 14px;
  right: 16px;
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10px;
  letter-spacing: 0.07em;
  font-weight: 600;
  color: ${({ theme }) => theme.color.brand.clay[500]};
  padding: 3px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.brand.clay.tint};
`;

export const StyledCardClient = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.text.primary};
  display: block;
  padding-right: 80px;
`;

export const StyledCardService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  color: ${({ theme }) => theme.color.text.muted};
  display: block;
  margin-top: 3px;
`;

export const StyledCardNote = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  color: ${({ theme }) => theme.color.brand.gold[700]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold.bg : theme.color.brand.gold[50]};
  padding: 7px 10px;
  border-radius: 8px;
  margin: 8px 0 0;
  border-left: 3px solid ${({ theme }) => theme.color.brand.gold[300]};
`;

export const StyledBreakCard = styled.div`
  grid-column: 3;
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.border.color.neutral.medium};
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 14px;
  color: ${({ theme }) => theme.color.text.muted};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
`;

export const StyledTRail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StyledTRailPanel = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  padding: 20px 20px 18px;
`;

export const StyledTRailPanelTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: 400;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0 0 14px;

  em {
    font-style: italic;
    color: ${({ theme }) =>
      theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
  }
`;

export const StyledMicroStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

export const StyledMicroStatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[50]};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledMicroStatValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: 400;
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
`;

export const StyledMicroStatLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledReview = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.border.color.neutral.light};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

export const StyledReviewStars = styled.span`
  color: ${({ theme }) => theme.color.brand.gold[400]};
  letter-spacing: 1px;
  font-size: 13px;
`;

export const StyledReviewBody = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 4px 0;
  line-height: 1.5;
`;

export const StyledReviewMeta = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledNoteBlock = styled.blockquote`
  margin: 0;
  padding: 12px 14px;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold.bg : theme.color.brand.gold[50]};
  border-left: 3px solid ${({ theme }) => theme.color.brand.gold[400]};
  border-radius: 0 10px 10px 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1.55;
`;

export const StyledNoteMeta = styled.span`
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledModeEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  text-align: center;
`;
