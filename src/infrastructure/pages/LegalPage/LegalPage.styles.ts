import styled, { keyframes } from 'styled-components';
import { safeArea } from '@infra/styles/safeArea';

// ── ZEN entrance keyframes ────────────────────────────────────────────────────
// Copied verbatim from LoginPage.styles.ts — styled-components keyframes are
// not cross-file importable without a shared module, and none exists yet.
// Local duplication is correct here (same convention LoginPage itself uses).

const zenFadeUpHeading = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const zenFadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const zenFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ── Root ──────────────────────────────────────────────────────────────────────

export const StyledLegalPage = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: ${({ theme }) => theme.color.background.light};

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;

// ── Header (banner) ───────────────────────────────────────────────────────────

export const StyledLegalHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  background: ${({ theme }) => theme.color.background.light};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing['2xl']};
  }
`;

export const StyledLegalBrandLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.xs};
  opacity: 1;
  transition: opacity ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledLegalBrandLogo = styled.img`
  display: block;
  height: 22px;
  width: auto;
  /* Source asset is black wordmark on transparent bg — invert to white in dark
     mode rather than shipping a second logo file. */
  filter: ${({ theme }) => (theme.isDark ? 'invert(1)' : 'none')};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    height: 24px;
  }
`;

export const StyledLegalHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`;

export const StyledLegalThemeToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: transparent;
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  transition:
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    border-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
    border-color: ${({ theme }) => theme.border.color.neutral.medium};
    background: ${({ theme }) => theme.color.background.neutral};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledLegalLangToggle = styled.div`
  display: flex;
  align-items: center;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.full};
  overflow: hidden;
  flex-shrink: 0;
`;

export const StyledLegalLangBtn = styled.button<{ $active: boolean }>`
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

// ── Main ──────────────────────────────────────────────────────────────────────

/*
 * Plain styled.main (not wrapping Typography/Layout's PageLayout) so it can
 * accept a ref + tabIndex for the "focus main content on mount" a11y pattern —
 * ITypographyProps has no ref/tabIndex prop to forward.
 */
export const StyledLegalMain = styled.main`
  flex: 1;
  width: 100%;

  &:focus-visible {
    outline: none;
  }
`;

// ── Hero ──────────────────────────────────────────────────────────────────────
// Centered as a block on the page (title/dateline/content per product decision) —
// paragraph body text inside the article stays left-aligned for readability.

const LEGAL_CONTENT_MAX_WIDTH = '720px';

export const StyledLegalHero = styled.div`
  max-width: ${LEGAL_CONTENT_MAX_WIDTH};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.lg} 0;
  text-align: center;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing['2xl']} 0;
  }
`;

export const StyledLegalTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  text-align: center;
  animation: ${zenFadeUpHeading} 550ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: 40px;
  }
`;

export const StyledLegalDateline = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  text-align: center;
  animation: ${zenFadeUp} 500ms cubic-bezier(0.22, 1, 0.36, 1) 90ms both;
`;

// ── Body (ToC + Article, single centered column) ──────────────────────────────
// A 2-column ToC-sidebar layout can't be centered as one block, so the ToC
// stays inline/collapsible at every breakpoint (previously desktop-only had a
// sticky sidebar treatment) and the whole column sits centered on the page.

export const StyledLegalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: ${LEGAL_CONTENT_MAX_WIDTH};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['3xl']};
  text-align: left;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: 0 ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['3xl']};
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

/*
 * ToC wrapper — a native <details>/<summary> collapsible, at every breakpoint
 * (content is a single centered column now, so there's no longer a sidebar
 * rail for it to live in as a sticky column).
 */
export const StyledLegalTocWrapper = styled.details`
  animation: ${zenFadeUp} 480ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
    border-radius: ${({ theme }) => theme.border.radius.md};
    cursor: pointer;
    list-style: none;
    font-family: ${({ theme }) => theme.typography.font.body};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    color: ${({ theme }) => theme.color.text.primary};

    &::-webkit-details-marker {
      display: none;
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
      outline-offset: 2px;
    }

    svg {
      transition: transform ${({ theme }) => theme.transition.duration.fast}
        ${({ theme }) => theme.transition.timing.easeOut};
    }
  }

  &[open] summary svg {
    transform: rotate(180deg);
  }

  nav {
    padding: ${({ theme }) => theme.spacing.md} 0 0;
  }
`;

// ── Back to top ────────────────────────────────────────────────────────────────

export const StyledBackToTop = styled.button<{ $visible: boolean }>`
  position: fixed;
  bottom: calc(${({ theme }) => theme.spacing.md} + ${safeArea.bottom});
  right: calc(${({ theme }) => theme.spacing.md} + ${safeArea.right});
  z-index: ${({ theme }) => theme.zIndex.fixed};

  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.background.dark};
  /* Documented exception: dark pill uses hardcoded light text for contrast in both themes */
  color: oklch(0.97 0.01 67);
  cursor: pointer;

  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transform: ${({ $visible }) => ($visible ? 'translateY(0)' : 'translateY(8px)')};

  transition:
    opacity ${({ theme }) => theme.transition.duration.base}
      ${({ theme }) => theme.transition.timing.easeOut},
    transform ${({ theme }) => theme.transition.duration.base}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  svg {
    display: block;
    width: 20px;
    height: 20px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: ${({ $visible }) => ($visible ? 'translateY(-2px)' : 'translateY(8px)')};
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity ${({ theme }) => theme.transition.duration.fast} linear;
    transform: none !important;
  }
`;

// ── Footer (contentinfo) ──────────────────────────────────────────────────────

export const StyledLegalFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  background: ${({ theme }) => theme.color.background.light};
  animation: ${zenFadeIn} 350ms ease both;
`;

/*
 * BackLink — copied from ErrorPage.styles.ts (same background/hover/reduced-
 * motion values). Small acceptable duplication per the established
 * convention: Styled-prefixed primitives are scoped per page, not shared
 * across pages via a common module. Focus ring uses intent.focusRing (the
 * mandatory mode-aware token) rather than ErrorPage's primary[300], which is
 * not validated for dark-mode contrast as a standalone outline color.
 */
export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.primary[500]};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.border.radius.md};
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all ${({ theme }) => theme.transition.duration.base}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    background: ${({ theme }) => theme.color.primary[600]};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.effect.shadow.primary?.md};
    text-decoration: none;
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:active {
      transform: none;
    }
  }
`;
