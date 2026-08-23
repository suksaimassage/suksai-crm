import styled from 'styled-components';

/**
 * AgendaCalendarOverlay.styles — the overlay's own modal surface + 2×2 grid.
 *
 * The overlay is NOT the generic `Modal` (its `lg` size cannot host the full-width
 * grid), so it replicates the Modal a11y contract with its own scrim + card. The
 * grid uses `minmax(0, 1fr)` tracks (non-negotiable: without them the kanban/form
 * overflow) and `min-height: 0` on the second row so each quadrant scrolls
 * internally instead of the card. Only theme tokens; focus ring is always
 * `intent.focusRing`.
 */

export const StyledOverlayScrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.color.background.overlay};

  /* Edge-to-edge below md — the card itself goes full-screen there, so the
     scrim shouldn't reserve its own inset around it. */
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    padding: 0;
  }
`;

export const StyledOverlayCard = styled.div`
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 1200px;
  max-height: calc(100dvh - 2 * ${({ theme }) => theme.spacing.xl});
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.color.background.elevated};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  box-shadow: ${({ theme }) => theme.effect.shadow.outer.md};
  overflow: hidden;

  /* Full-screen sheet on phones/small tablets — the fixed spacing.xl (32px)
     padding on both this card AND the scrim otherwise eats ~1/3 of a phone's
     width in pure padding before any content renders. */
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    max-width: 100%;
    height: 100%;
    max-height: 100dvh;
    padding: ${({ theme }) => theme.spacing.md};
    border-radius: 0;
    padding-bottom: max(${({ theme }) => theme.spacing.md}, env(safe-area-inset-bottom, 16px));
  }
`;

// ── Header (outside the grid): title + subtitle, week nav, close ──────────────

export const StyledOverlayClose = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: transparent;
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  transition: background 150ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (hover: hover) {
    &:hover {
      background: ${({ theme }) =>
        theme.isDark ? theme.color.background.dark : theme.color.background.neutral};
    }
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StyledOverlayHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding-right: ${({ theme }) => theme.spacing.xl};
`;

export const StyledOverlayHeaderMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const StyledOverlayTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledOverlaySubtitle = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledOverlayNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledOverlayNavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.card};
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  transition: background 150ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (hover: hover) {
    &:hover {
      background: ${({ theme }) =>
        theme.isDark ? theme.color.background.dark : theme.color.background.neutral};
    }
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StyledOverlayTodayChip = styled.button`
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.color.brand.gold.border};
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.brand.gold.bg};
  color: ${({ theme }) => theme.color.text.primary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

// ── 2×2 grid ────────────────────────────────────────────────────────────────

export const StyledOverlayGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    'week week'
    'kanban form';
  gap: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  min-height: 0;
  overflow: hidden;

  /* kanban | form stay SIDE BY SIDE down to true phone-narrow widths — a
     tablet in portrait or a short desktop window is constrained on HEIGHT,
     not width, and stacking three full-width sections only makes that worse.
     Two columns let each get the FULL available height (kanban scrolls its
     own x/y as needed — see CalendarDayKanban.styles.ts — and the inline
     CitaModal pane scrolls its own column) instead of splitting height
     three ways. Only below the sm breakpoint does a real column stop making
     sense. */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: minmax(0, 1fr);
    /* kanban and form each get a BOUNDED fractional share (not "auto") — an
       "auto" row grows to fit ALL of kanban's cards with no cap, starving
       form (the actual reason the overlay is open) of any visible space.
       Each half scrolls internally (StyledKanbanList / the inline CitaModal
       pane already have their own overflow-y:auto) instead of one section
       silently consuming the other's height. */
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'week'
      'kanban'
      'form';
    overflow-y: auto;
  }
`;

/** Host quadrant for the embedded inline `CitaModal` (its own pane scrolls). */
export const StyledFormArea = styled.div`
  grid-area: form;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.color.background.card};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};
  overflow: hidden;

  & > * {
    flex: 1;
    min-height: 0;
  }
`;

/** Visually hidden polite live region — announces day changes to screen readers. */
export const StyledLiveRegion = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;
