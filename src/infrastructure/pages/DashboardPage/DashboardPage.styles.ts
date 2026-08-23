/**
 * DashboardPage.styles.ts
 *
 * Styled components for the Suksai CRM dashboard shell.
 *
 * OKLCH palette (concept → OKLCH):
 *   sand-50        oklch(0.98 0.01 67)           #FAF7F2 — page / header bg base
 *   sand-100       oklch(0.95 0.02 67)           #F4EFE6 — hover surfaces
 *   sand-200       oklch(0.89 0.03 67)           #E8DFCE — borders
 *   ink-300        oklch(0.74 0.02 67)           #BCB6A8 — separators / crumb sep
 *   ink-500        oklch(0.54 0.03 67)           #847F75 — muted text
 *   ink-700        oklch(0.33 0.02 67)           #4A4A45 — body text / icon color
 *   ink-900        oklch(0.12 0.01 67)           #1A1A17 — headings / current crumb
 *   gold-400       oklch(0.74 0.10 75)           #C9A96E — notification dot / avatar bg
 *   jungle-700     oklch(0.25 0.03 143)          #2E3D31 — user avatar bg
 */

import styled, { css } from 'styled-components';
import { safeArea } from '@infra/styles/safeArea';

// ─── Main content wrapper ───────────────────────────────────────────────────

export const StyledMainContent = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
`;

// ─── Dashboard topbar (glassmorphism header) ────────────────────────────────

export const StyledDashboardTopbar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing['2xl']};
  height: 80px;

  background: ${({ theme }) =>
    theme.isDark ? 'oklch(0.14 0.03 204 / 0.85)' : 'oklch(0.98 0.01 67 / 0.82)'};
  backdrop-filter: ${({ theme }) =>
    theme.isDark ? 'blur(20px) saturate(180%)' : 'blur(20px) saturate(140%)'};
  -webkit-backdrop-filter: ${({ theme }) =>
    theme.isDark ? 'blur(20px) saturate(180%)' : 'blur(20px) saturate(140%)'};
  border-bottom: 1px solid
    ${({ theme }) => (theme.isDark ? 'oklch(0.97 0.01 67 / 0.06)' : 'oklch(0.12 0.01 67 / 0.06)')};

  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    padding: 0 ${({ theme }) => theme.spacing.lg};
  }

  @media (max-width: 600px) {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

// ─── Breadcrumbs ────────────────────────────────────────────────────────────

export const StyledBreadcrumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-weight: 500;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 600px) {
    /* hide the home + first separator on very small screens */
    .crumb-home,
    .crumb-sep-first {
      display: none;
    }
  }
`;

export const StyledCrumbLink = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.color.text.muted};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transition.duration.fast};
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
    border-radius: 3px;
  }
`;

export const StyledCrumbSep = styled.span`
  color: ${({ theme }) => theme.color.text.disabled};
  user-select: none;
  flex-shrink: 0;
`;

export const StyledCrumbCurrent = styled.span`
  color: ${({ theme }) => theme.color.text.primary};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ─── Topbar right-side action strip ────────────────────────────────────────

export const StyledTopbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;
  margin-left: ${({ theme }) => theme.spacing.lg};
`;

// ─── Round icon button (search, help, bell) ─────────────────────────────────

export const StyledIconBtn = styled.button`
  ${({ theme }) => css`
    width: 38px;
    height: 38px;
    border-radius: ${theme.border.radius.full};
    border: none;
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: ${theme.color.text.secondary};
    transition:
      background ${theme.transition.duration.fast},
      color ${theme.transition.duration.fast};
    position: relative;

    &:hover {
      background: ${theme.isDark ? 'oklch(0.23 0.04 204)' : 'oklch(0.95 0.02 67)'};
      color: ${theme.color.text.primary};
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }

    svg {
      width: 20px;
      height: 20px;
      display: block;
    }
  `}
`;

// ─── Language toggle pill ────────────────────────────────────────────────────

export const StyledTopbarLangToggle = styled.div`
  display: flex;
  align-items: center;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: transparent;
  overflow: hidden;
  flex-shrink: 0;
`;

export const StyledTopbarLangBtn = styled.button<{ $active: boolean }>`
  height: 100%;
  padding: 0 10px;
  border: none;
  background: ${({ theme, $active }) =>
    $active ? theme.border.color.neutral.light : 'transparent'};
  color: ${({ theme, $active }) => ($active ? theme.color.text.primary : theme.color.text.muted)};
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1;
  transition:
    background ${({ theme }) => theme.transition.duration.fast},
    color ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    background: ${({ theme, $active }) =>
      $active
        ? theme.border.color.neutral.light
        : theme.isDark
          ? 'oklch(0.23 0.04 204)'
          : 'oklch(0.95 0.02 67)'};
    color: ${({ theme }) => theme.color.text.secondary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: -2px;
  }
`;

// ─── User menu pill ─────────────────────────────────────────────────────────

export const StyledUserMenuPill = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    padding: 6px 10px 6px 6px;
    margin-left: ${theme.spacing.xs};
    border-radius: ${theme.border.radius.full};
    border: 1px solid ${theme.border.color.neutral.light};
    background: ${theme.color.background.card};
    cursor: pointer;
    transition:
      background ${theme.transition.duration.fast},
      border-color ${theme.transition.duration.fast};
    user-select: none;

    &:hover {
      background: ${theme.isDark ? 'oklch(0.23 0.04 204)' : 'oklch(0.95 0.02 67)'};
      border-color: ${theme.border.color.neutral.medium};
    }

    &:focus,
    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }

    @media (max-width: 600px) {
      /* collapse to avatar only on very small screens */
      padding: 4px;
    }
  `}
`;

export const StyledPillAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  /* jungle-700 bg, gold-400 text */
  background: oklch(0.25 0.03 143);
  color: oklch(0.74 0.1 75);
  display: grid;
  place-items: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  font-size: 12px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
`;

export const StyledPillMeta = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;

  strong {
    font-family: ${({ theme }) => theme.typography.font.body};
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.color.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-family: ${({ theme }) => theme.typography.font.body};
    font-size: 11px;
    color: ${({ theme }) => theme.color.text.muted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

export const StyledPillCaret = styled.span`
  color: ${({ theme }) => theme.color.text.muted};
  display: flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

// ─── Shell footer ───────────────────────────────────────────────────────────

export const StyledDashboardFooter = styled.footer`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing.sm};
    text-align: center;
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    border-top: 1px solid ${theme.border.color.neutral.light};
    background: ${theme.color.background.light};

    @media (min-width: ${theme.breakpoint.lg}) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }
  `}
`;

export const StyledDashboardFooterCopyright = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledDashboardFooterLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  a {
    font-family: ${({ theme }) => theme.typography.font.body};
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ theme }) => theme.color.text.secondary};
    text-decoration: underline;
    text-decoration-color: transparent;
    transition:
      color ${({ theme }) => theme.transition.duration.fast}
        ${({ theme }) => theme.transition.timing.easeOut},
      text-decoration-color ${({ theme }) => theme.transition.duration.fast}
        ${({ theme }) => theme.transition.timing.easeOut};

    &:hover {
      color: ${({ theme }) => theme.color.text.primary};
      text-decoration-color: currentColor;
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
      outline-offset: 2px;
    }
  }
`;

// ─── Mobile menu toggle (fixed FAB) ─────────────────────────────────────────

export const StyledMobileFab = styled.button`
  ${({ theme }) => css`
    position: fixed;
    bottom: calc(${theme.spacing.md} + ${safeArea.bottom});
    right: calc(${theme.spacing.md} + ${safeArea.right});
    z-index: ${theme.zIndex.fixed};

    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: ${theme.border.radius.full};
    border: none;
    background: oklch(0.15 0.022 143); /* jungle-900 */
    color: oklch(0.98 0.01 67); /* sand-50 */
    box-shadow: ${theme.effect.shadow.outer.lg};
    cursor: pointer;
    transition: background ${theme.transition.duration.fast};

    svg {
      display: block;
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: oklch(0.25 0.03 143); /* jungle-700 */
    }

    &:focus-visible {
      outline: 2px solid oklch(0.74 0.1 75);
      outline-offset: 3px;
    }

    /* Ocultar en desktop — visible en mobile y tablet (< lg) */
    @media (min-width: ${theme.breakpoint.lg}) {
      display: none;
    }
  `}
`;
