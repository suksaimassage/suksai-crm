import styled from 'styled-components';

// ── Shell ─────────────────────────────────────────────────────────────────────

export const StyledMonth = styled.section`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

// ── Weekday header row (LUN · MAR · … · DOM) ─────────────────────────────────

export const StyledMonthDowRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
`;

export const StyledMonthDowCell = styled.div`
  padding: 10px 0;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
`;

// ── Month grid ────────────────────────────────────────────────────────────────

export const StyledMonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
`;

export const StyledMonthCell = styled.article<{
  $isCurrentMonth: boolean;
  $isToday: boolean;
  /** Pointer is over this cell during a chip drag → orientation wash. */
  $isDropTarget?: boolean;
}>`
  position: relative;
  min-height: 100px;
  padding: 8px 10px 10px;
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ $isCurrentMonth, $isToday, theme }) => {
    if ($isToday)
      return theme.isDark ? theme.color.brand.gold.bg : theme.color.brand.agenda.nowTrackBg;
    if (!$isCurrentMonth)
      return theme.isDark ? theme.color.brand.lotus.bg : theme.color.neutralWarm[50];
    return theme.color.background.card;
  }};
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.5)};
  overflow: hidden;
  transition: box-shadow 150ms ease;

  /* Drop-target orientation wash (mirrors StyledTrack in the day grid): a subtle,
     mode-aware tint + focus-ring inset signalling "this day will receive the cita".
     Layered via box-shadow inset so it composes over the cell background. */
  ${({ $isDropTarget, theme }) =>
    $isDropTarget
      ? `box-shadow: inset 0 0 0 9999px ${theme.color.overlay.primary}, inset 0 0 0 2px ${theme.color.intent.focusRing};`
      : ''}

  &:nth-child(7n) {
    border-right: none;
  }

  /* Mobile-first: 7 columns stay (the "month" mental model), cells just get
     shorter — per-cita chips are hidden (StyledMonthChipList) in favour of a
     compact citaCount badge; tap the day to drill into the full Day view
     (already wired via onDayClick), matching how mobile calendar apps
     summarize a day instead of listing each event inline. */
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    min-height: 64px;
    padding: 6px 6px 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// Today accent bar — absolute div at top to avoid border-image limitations
export const StyledMonthTodayAccentBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.brand.clay[500]},
    ${({ theme }) => theme.color.brand.gold[400]}
  );
  border-radius: 3px 3px 0 0;
`;

export const StyledMonthCellDateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

/** Groups the density dot + mobile citaCount badge so they sit together on
    the trailing edge of StyledMonthCellDateRow (not spread apart by its
    own space-between). */
export const StyledMonthCellMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const StyledMonthCellDate = styled.span<{ $isToday: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 17px;
  font-weight: 300;
  line-height: 1;
  color: ${({ $isToday, theme }) =>
    $isToday
      ? theme.isDark
        ? theme.color.text.primary[100]
        : theme.color.brand.clay[500]
      : theme.isDark
        ? theme.color.brand.gold[300]
        : theme.color.brand.ink[900]};
`;

export const StyledMonthDensityDot = styled.span<{ $level: 0 | 1 | 2 | 3 | 4 | 5 }>`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: ${({ $level, theme }) => {
    if ($level === 0) return 'transparent';
    if ($level <= 2) return theme.color.brand.gold[300];
    if ($level <= 4) return theme.color.brand.gold[400];
    return theme.color.brand.clay[500];
  }};
`;

/**
 * Mobile-only day summary (citaCount) shown instead of the chip list —
 * decorative (aria-hidden): the cell's own aria-label already states the
 * count. Hidden above md, where the real chip list takes over.
 */
export const StyledMonthCitaCountBadge = styled.span`
  display: none;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[200]};
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[700]};

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    display: inline-flex;
  }
`;

// ── Chip list ─────────────────────────────────────────────────────────────────

export const StyledMonthChipList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;

  /* Per-cita chips give way to StyledMonthCitaCountBadge on mobile — the
     domain layer pre-slices chips/overflowCount to a fixed max (see
     AgendaEnrichmentService), so hiding a SUBSET via CSS would desync the
     "+N" overflow label from what's actually hidden. Hiding the whole list
     avoids that mismatch entirely. */
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    display: none;
  }
`;

export const StyledMonthChip = styled.div<{
  /** Role permits + non-terminal estado → chip can be picked up and moved. */
  $draggable?: boolean;
  /** This chip is the source of the in-flight gesture. */
  $dragging?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 7px; /* min-height ~24px for WCAG 2.5.8 target size */
  min-height: 24px;
  border-radius: 6px;
  background: ${({ theme }) => theme.color.neutralWarm[100]};
  border: 1px solid ${({ theme }) => theme.color.neutralWarm[200]};
  overflow: hidden;
  /* Grab affordance only when draggable; otherwise a plain click target. */
  cursor: ${({ $draggable }) => ($draggable ? 'grab' : 'pointer')};
  /* Prevent native touch-scroll from hijacking a drag on touch devices. */
  touch-action: ${({ $draggable }) => ($draggable ? 'none' : 'auto')};
  transition:
    background 150ms ease,
    box-shadow 150ms ease,
    opacity 150ms ease;
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};

  &:hover {
    background: ${({ theme }) => theme.color.neutralWarm[200]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  /* Dragging source: dashed focus-ring + reduced opacity (non-color cue pairs with
     the dim so the state never relies on opacity alone — WCAG 1.4.1). */
  ${({ $dragging, theme }) =>
    $dragging
      ? `box-shadow: 0 0 0 1px ${theme.color.intent.focusRing}; border-style: dashed; cursor: grabbing;`
      : ''}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StyledMonthChipTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.brand.ink[500]};
  flex-shrink: 0;
`;

export const StyledMonthChipClient = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.brand.ink[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledMonthOverflow = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.brand.ink[500]};
  padding: 2px 6px;
`;

// ── Footer KPI strip ──────────────────────────────────────────────────────────

export const StyledMonthFooter = styled.footer`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 20px;
  border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  flex-wrap: wrap;
`;

export const StyledMonthFooterKpi = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledMonthFooterLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
`;

export const StyledMonthFooterValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 20px;
  font-weight: 300;
  line-height: 1;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[100] : theme.color.brand.ink[900]};
`;

export const StyledMonthFooterPeaks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

export const StyledMonthFooterPeakBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 700;
  background: ${({ theme }) => theme.color.brand.clay.tint};
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.clay[500] : theme.color.brand.clay[600]};
`;
