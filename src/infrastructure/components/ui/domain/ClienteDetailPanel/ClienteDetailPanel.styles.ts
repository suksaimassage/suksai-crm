/**
 * ClienteDetailPanel.styles.ts
 */

import styled, { keyframes } from 'styled-components';

// ── Skeleton shimmer ──────────────────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

// ── Panel shell ───────────────────────────────────────────────────────────────

export const StyledPanel = styled.aside`
  height: 100%;
  background: ${({ theme }) => theme.color.background.card};
  border-left: 1px solid ${({ theme }) => theme.color.text.tertiary}20;
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-width: 380px;
  box-shadow: 0 2px 16px oklch(0.11 0.03 204 / 0.06); /* [TOKEN GAP] panel elevation shadow — no theme.shadow token yet */
`;

// ── Shared section wrapper ────────────────────────────────────────────────────

export const StyledPanelSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.color.text.tertiary}15;

  &:last-child {
    border-bottom: none;
  }
`;

export const StyledPanelSectionLabel = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.tertiary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

// ── Header ────────────────────────────────────────────────────────────────────

export const StyledPanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.color.background.card};
  border-bottom: 1px solid ${({ theme }) => theme.color.text.tertiary}15;
  transition: box-shadow 200ms ${({ theme }) => theme.transition.timing.easeOut};

  &[data-scrolled='true'] {
    box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
  }
`;

export const StyledCloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.color.text.tertiary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  transition:
    color 120ms ease-out,
    background 120ms ease-out;

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
    background: ${({ theme }) => theme.color.background.neutral};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledAvatarRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const StyledNameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const StyledClientName = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1.5rem;
  font-weight: 400;
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.2;
`;

export const StyledClientMeta = styled.span`
  color: ${({ theme }) => theme.color.text.tertiary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
`;

export const StyledBadgeRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const StyledAvatarRing = styled.div<{
  $segment: 'vip' | 'activo' | 'nuevo' | 'en_riesgo' | 'inactivo';
}>`
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.border.radius.full};
  outline: 2.5px solid
    ${({ $segment, theme }) => {
      const map: Record<string, string> = {
        vip: theme.color.intent.warning,
        activo: theme.color.intent.success,
        nuevo: theme.color.intent.info,
        en_riesgo: theme.color.intent.error,
        inactivo: theme.color.text.tertiary,
      };
      return map[$segment] ?? theme.color.text.tertiary;
    }};
  outline-offset: 2px;
`;

// ── Contact ───────────────────────────────────────────────────────────────────

export const StyledContactRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StyledContactIcon = styled.span`
  color: ${({ theme }) => theme.color.text.tertiary};
  font-size: ${({ theme }) => theme.typography.size.sm};
  flex-shrink: 0;
`;

export const StyledContactText = styled.span`
  color: ${({ theme }) => theme.color.text.secondary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
`;

export const StyledContactLink = styled.a`
  color: ${({ theme }) => theme.color.text.link};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// ── Stats grid ────────────────────────────────────────────────────────────────

export const StyledStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledStatCard = styled.div<{
  $intent: 'success' | 'warning' | 'secondary';
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.color.background.neutral};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid
    ${({ $intent, theme }) => {
      const map: Record<string, string> = {
        success: theme.color.intent.success,
        warning: theme.color.intent.warning,
        secondary: theme.color.intent.secondary,
      };
      return `color-mix(in oklch, ${map[$intent] ?? theme.color.intent.primary} 15%, transparent)`;
    }};
  transition:
    box-shadow 150ms ${({ theme }) => theme.transition.timing.easeOut},
    background-color 150ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
      background: ${({ theme }) => theme.color.background.card};
    }
  }
`;

export const StyledStatIcon = styled.span<{
  $intent: 'success' | 'warning' | 'secondary';
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $intent, theme }) => {
    const map: Record<string, string> = {
      success: theme.color.intent.success,
      warning: theme.color.intent.warning,
      secondary: theme.color.intent.secondary,
    };
    return map[$intent] ?? theme.color.intent.primary;
  }};
`;

export const StyledStatValue = styled.span`
  color: ${({ theme }) => theme.color.text.primary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`;

export const StyledStatLabel = styled.span`
  color: ${({ theme }) => theme.color.text.tertiary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
`;

// ── Timeline ──────────────────────────────────────────────────────────────────

export const StyledTimelineItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StyledTimelineNode = styled.div<{ $type: 'next' | 'past' }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
  background: ${({ $type, theme }) =>
    $type === 'past' ? theme.color.text.tertiary : 'transparent'};
  border: ${({ $type, theme }) =>
    $type === 'next' ? `2px solid ${theme.color.intent.primary}` : 'none'};
`;

export const StyledTimelineContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StyledTimelineDate = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledTimelineSub = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledStarRow = styled.div`
  display: flex;
  gap: 1px;
  margin-top: 2px;
`;

export const StyledStar = styled.span<{ $filled: boolean }>`
  font-size: 11px;
  color: ${({ $filled, theme }) =>
    $filled ? theme.color.intent.warning : theme.color.text.tertiary};
`;

// ── Preferences ───────────────────────────────────────────────────────────────

export const StyledPreferenceTags = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledPreferenceTag = styled.span`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.text.secondary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  border: 1px solid ${({ theme }) => theme.color.text.tertiary}20;
`;

// ── Note ─────────────────────────────────────────────────────────────────────

export const StyledNoteBlockquote = styled.blockquote`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.color.background.neutral};
  border-radius: ${({ theme }) => theme.border.radius.md};
  border-left: 2px solid ${({ theme }) => theme.color.intent.primary};
`;

export const StyledNoteText = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.text.secondary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-style: italic;
  line-height: 1.6;
`;

export const StyledNoteAuthor = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  color: ${({ theme }) => theme.color.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// ── Actions ───────────────────────────────────────────────────────────────────

export const StyledPanelActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.color.text.tertiary}15;
`;

export const StyledPrimaryRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  & > * {
    flex: 1;
  }
`;

export const StyledManagementRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  & > * {
    flex: 1;
  }
`;

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const StyledSkeletonBlock = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.background.neutral} 25%,
    ${({ theme }) => theme.color.background.card} 50%,
    ${({ theme }) => theme.color.background.neutral} 75%
  );
  background-size: 800px 100%;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  animation: ${shimmer} 1.6s ease-in-out infinite;
`;

// ── Error ─────────────────────────────────────────────────────────────────────

export const StyledErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

export const StyledErrorMessage = styled.p`
  color: ${({ theme }) => theme.color.text.secondary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  margin: 0;
`;
