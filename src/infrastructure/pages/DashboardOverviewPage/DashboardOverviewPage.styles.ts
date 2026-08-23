/**
 * DashboardOverviewPage.styles.ts
 *
 * All styled primitives for the overview page.
 * Zero hardcoded values — every token via ({ theme }) =>.
 */

import styled, { keyframes } from 'styled-components';

// ── Page root ────────────────────────────────────────────────────────────────

export const StyledOverviewRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
    gap: ${({ theme }) => theme.spacing.lg};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

// ── Welcome banner ───────────────────────────────────────────────────────────

export const StyledBanner = styled.section`
  position: relative;
  overflow: hidden;
  background: ${({ theme }) =>
    theme.isDark
      ? `linear-gradient(5deg, oklch(0.17 0.04 132) 0%, oklch(0.23 0.04 204) 45%, oklch(0.26 0.04 67) 100%)`
      : `linear-gradient(5deg, ${theme.color.success[50]} 0%, ${theme.color.neutralWarm[100]} 45%, ${theme.color.primary[100]} 100%)`};
  min-height: 160px;
  border-radius: ${({ theme }) => theme.border.radius['2xl']};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xl};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    min-height: 180px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    border-radius: ${({ theme }) => theme.border.radius.xl};
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    height: 200px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}) {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  }
`;

export const StyledBannerTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.base};
  flex: 1;
  min-width: 0;
`;

export const StyledBannerGreeting = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['5xl']};
  font-weight: ${({ theme }) => theme.typography.weight.light};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.15;
  margin: 0;
  letter-spacing: -0.01em;
  overflow-wrap: break-word;
  word-break: break-word;

  & > em {
    font-style: italic;
    color: ${({ theme }) => theme.color.intent.primary};
    font-weight: inherit;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}) {
    font-size: ${({ theme }) => theme.typography.size.xl};
  }
`;

export const StyledBannerDateLine = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: '';
    display: block;
    width: 1.5rem;
    height: 1px;
    background-color: ${({ theme }) => theme.color.primary[400]};
    flex-shrink: 0;
  }
`;

export const StyledBannerTagline = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1.65;
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  max-width: 52ch;

  strong {
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    color: ${({ theme }) => theme.color.text.primary};
  }
`;

export const StyledBannerRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.base};

  @media (max-width: calc(${({ theme }) => theme.breakpoint.md} - 1px)) {
    align-items: flex-start;
    padding-top: ${({ theme }) => theme.spacing.xs};
    border-top: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  }
`;

export const StyledBannerDateText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-style: italic;
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: ${({ theme }) => theme.typography.weight.light};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
  letter-spacing: 0.01em;
  white-space: nowrap;

  @media (max-width: calc(${({ theme }) => theme.breakpoint.md} - 1px)) {
    white-space: normal;
  }
`;

export const StyledBannerWeatherText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  white-space: nowrap;
`;

export const StyledBannerOrnament = styled.div`
  position: absolute;
  bottom: calc(-1 * ${({ theme }) => theme.spacing['2xl']});
  right: ${({ theme }) => theme.spacing.xl};
  pointer-events: none;
  user-select: none;
  opacity: 0.07;
  color: ${({ theme }) => theme.color.primary[600]};

  svg {
    width: 240px;
    height: 240px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    bottom: calc(-1 * ${({ theme }) => theme.spacing.xl});
    right: ${({ theme }) => theme.spacing.md};
    opacity: 0.05;

    svg {
      width: 180px;
      height: 180px;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}) {
    display: none;
  }
`;

// ── Body two-column grid ─────────────────────────────────────────────────────

export const StyledBodyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 1fr;
  }
`;

// ── Section panel (card wrapper) ─────────────────────────────────────────────

export const StyledPanel = styled.section`
  background: ${({ theme }) => theme.color.background.card};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
  overflow: hidden;
`;

export const StyledSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg}
    ${({ theme }) => theme.spacing.md};
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
`;

export const StyledSectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}) {
    font-size: ${({ theme }) => theme.typography.size.lg};
  }
`;

export const StyledSectionLink = styled.a`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.link};
  text-decoration: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.text.linkHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.border.radius.xs};
  }
`;

export const StyledPanelBody = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

// ── Client rows ───────────────────────────────────────────────────────────────

export const StyledClientRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  transition: background-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    background-color: ${({ theme }) =>
      theme.isDark ? theme.color.background.neutral : theme.color.primary[50]};
  }

  & + & {
    border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.border.color.neutral.subtle};
  }
`;

export const StyledClientInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  flex: 1;
`;

export const StyledClientName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.md};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledClientMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xxs};
  flex-shrink: 0;
`;

export const StyledClientLTV = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledClientNextAppt = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  white-space: nowrap;
`;

// ── Appointment rows ──────────────────────────────────────────────────────────

export const StyledAppointmentRow = styled.div`
  & + & {
    border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.border.color.neutral.subtle};
  }
`;

export const StyledAppointmentTime = styled.time`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
  width: 3.5rem;
  flex-shrink: 0;
  padding-top: ${({ theme }) => theme.spacing.xxs};
`;

export const StyledAppointmentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  flex: 1;
`;

export const StyledAppointmentClientName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.md};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledAppointmentService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledAppointmentMeta = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledAppointmentBadgeWrapper = styled.div`
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: ${({ theme }) => theme.spacing.xxs};
`;

// ── Empty state ───────────────────────────────────────────────────────────────

export const StyledEmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.lg};
  text-align: center;
  color: ${({ theme }) => theme.color.text.muted};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
`;

// ── Responsive layout helpers for ClientRow ───────────────────────────────────

export const StyledClientIdentityRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

export const StyledClientNameCol = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  flex: 1;
`;

export const StyledClientTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledClientMetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

// ── Responsive layout helpers for AppointmentRow ──────────────────────────────

export const StyledApptTimeCol = styled.div`
  flex-shrink: 0;
`;

export const StyledApptAvatarWrap = styled.div`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: contents;
  }
`;

export const StyledApptDurationWrap = styled.div`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: contents;
  }
`;

export const StyledApptBadgeWrap = styled.div`
  flex-shrink: 0;
  align-self: center;
`;

// ── CalendarVolume skeleton ───────────────────────────────────────────────────

const calShimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

export const StyledCalendarSkeleton = styled.div`
  height: 200px;
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) =>
    theme.isDark
      ? `linear-gradient(90deg, oklch(0.23 0.04 204) 0%, oklch(0.32 0.05 204) 50%, oklch(0.23 0.04 204) 100%)`
      : `linear-gradient(90deg, ${theme.color.neutral[100]} 0%, ${theme.color.neutral[50]} 50%, ${theme.color.neutral[100]} 100%)`};
  background-size: 200% 100%;
  animation: ${calShimmer} 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${({ theme }) =>
      theme.isDark ? 'oklch(0.23 0.04 204)' : theme.color.neutral[100]};
  }
`;
