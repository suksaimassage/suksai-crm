import styled from 'styled-components';
import type { TAgendaEvtVariant } from '@domain/types';
import type { TTheme } from '@infra/styles/themes/light.theme';

// ── Shell ─────────────────────────────────────────────────────────────────────

export const StyledTherWeekGrid = styled.section`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  overflow: hidden;
`;

// ── Shared horizontal scroll area (header + rows scroll together) ─────────────

export const StyledTherWeekScrollArea = styled.div`
  overflow-x: auto;
`;

// ── Time header ───────────────────────────────────────────────────────────────

// No border-bottom here: a border on this block-level grid container is clipped
// to the horizontal-scroll viewport width, so the divider never reaches the end
// of the 1440px track. The border is painted on the definite-width children
// instead — the sticky corner (column 1) + the time row (column 2) — so it spans
// the full width and survives horizontal scroll. Same fix as the row band.
export const StyledTherWeekTimeHeader = styled.div<{ $trackWidth: number }>`
  display: grid;
  grid-template-columns: 100px ${({ $trackWidth }) => $trackWidth}px;
`;

export const StyledTherWeekTimeCorner = styled.div`
  width: 100px;
  border-right: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  /* Header divider lives on the definite-width children (corner + time row) so it
     spans the full width under horizontal scroll — see StyledTherWeekTimeHeader. */
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  position: sticky;
  left: 0;
  z-index: 3;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 400;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
  text-align: center;
  line-height: 1.25;
`;

export const StyledTherWeekTimeRow = styled.div<{ $slotCount: number; $slotWidthPx: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $slotCount }) => $slotCount},
    ${({ $slotWidthPx }) => $slotWidthPx}px
  );
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  /* Header divider — see StyledTherWeekTimeHeader (full-width under scroll). */
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.light};
`;

/**
 * Single cell in the header time ruler.
 * $isHour  — true for :00 cells, false for :30 cells
 * $isLast  — true for the last cell (suppress right border overflow)
 */
export const StyledTherWeekTimeCell = styled.div<{ $isHour: boolean; $isLast: boolean }>`
  padding: 7px 4px 7px 6px;
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 9.5px;
  font-weight: ${({ $isHour }) => ($isHour ? 700 : 400)};
  color: ${({ $isHour, theme }) =>
    $isHour
      ? theme.isDark
        ? theme.color.text.primary
        : theme.color.brand.ink[700]
      : theme.isDark
        ? theme.color.text.muted
        : theme.color.brand.ink[500]};
  border-right: ${({ $isLast }) => ($isLast ? 'none' : '1px solid')};
  border-color: ${({ $isHour, theme }) =>
    $isHour ? theme.border.color.neutral.medium : theme.color.brand.agenda.gridLine};
  white-space: nowrap;
  overflow: hidden;
`;

// ── Day swimlane rows ─────────────────────────────────────────────────────────

export const StyledTherWeekRows = styled.div``;

// No background here: a background on this block-level grid container is clipped
// to the horizontal-scroll viewport width, so the today/day-off tint never spans
// the full 1440px track. The band is now painted on the definite-width children
// instead — the sticky label (column 1) + the track (column 2) — so it survives
// horizontal scroll. This mirrors the time-header pattern.
export const StyledTherWeekRow = styled.div<{
  $trackWidth: number;
  $laneCount: number;
}>`
  display: grid;
  grid-template-columns: 100px ${({ $trackWidth }) => $trackWidth}px;
  min-height: ${({ $laneCount }) => Math.max(86, $laneCount * 58)}px;
  &:last-child {
    border-bottom: none;
  }
`;

// The sticky label must paint the SAME band as the row track, otherwise its own
// opaque bg creates a vertical seam at the 100px boundary. $isToday/$isDayOff
// drive a band-matching fill + a softened right border so the tint crosses the
// boundary unbroken (Designer 3a). The today band uses an OPAQUE warm value
// (nowTrackBg is translucent → would let scrolled events bleed through the
// sticky label); brand has no dark override so isDark is gated explicitly.
export const StyledTherWeekRowLabel = styled.div<{ $isToday: boolean; $isDayOff: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 10px 6px;
  border-right: 1px solid
    ${({ $isToday, $isDayOff, theme }) =>
      $isToday || $isDayOff ? theme.color.brand.agenda.gridLine : theme.border.color.neutral.light};
  background: ${({ $isToday, $isDayOff, theme }) => {
    if ($isDayOff)
      return theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[100];
    if ($isToday)
      // Opaque equivalent of brand.agenda.nowTrackBg (which is translucent).
      return theme.isDark ? 'oklch(0.255 0.03 150)' : 'oklch(0.975 0.018 75)';
    return theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50];
  }};
  position: sticky;
  left: 0;
  z-index: 1;
  width: 100px;
`;

// $tinted = the row sits on a today/day-off band. On those light-mode bands,
// ink[500] (9px) falls below WCAG AA (4.5:1), so tinted rows step down to
// ink[700]. Dark-mode bands keep text.muted (already ≥4.9:1).
export const StyledTherWeekRowDayName = styled.span<{ $tinted: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $tinted, theme }) =>
    theme.isDark
      ? theme.color.text.muted
      : $tinted
        ? theme.color.brand.ink[700]
        : theme.color.brand.ink[500]};
`;

export const StyledTherWeekRowDayNumber = styled.span<{ $isToday: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 22px;
  font-weight: 300;
  line-height: 1;
  color: ${({ $isToday, theme }) =>
    $isToday
      ? theme.color.brand.clay[500]
      : theme.isDark
        ? theme.color.text.primary
        : theme.color.brand.ink[900]};
`;

// On a today/day-off band ($isDayOff || $isToday) the light-mode meta text steps
// down to ink[700] for WCAG AA on the tinted fill (ink[500] 9px is < 4.5:1 there).
export const StyledTherWeekRowMeta = styled.span<{ $isDayOff?: boolean; $isToday?: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 9px;
  line-height: 1.45;
  text-align: center;
  font-style: ${({ $isDayOff }) => ($isDayOff ? 'italic' : 'normal')};
  color: ${({ $isDayOff, $isToday, theme }) =>
    theme.isDark
      ? theme.color.text.muted
      : $isDayOff || $isToday
        ? theme.color.brand.ink[700]
        : theme.color.brand.ink[500]};
`;

// ── Swimlane track ────────────────────────────────────────────────────────────
//
// The track renders a CSS grid of individual slot cells for accurate DOM
// structure, then positions events via absolute lanes that overlay the grid.

// The track uses position:relative as the containing block for all absolute children
// (slot cells, lanes, sunday label, hatch ::after). No display:grid here — slot cells
// are positioned absolutely so their height derives from the track's containing block
// (top:0/bottom:0), not from an inner grid row whose auto-height would collapse to 0.
export const StyledTherWeekTrack = styled.div<{
  $isDayOff: boolean;
  $isToday: boolean;
  $isPast: boolean;
}>`
  position: relative;
  opacity: ${({ $isPast, $isDayOff }) => ($isPast && !$isDayOff ? 0.65 : 1)};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.light};

  /* Base paint layer for the today/day-off band (day-off wins over today, same
     precedence as the sticky label). This is the block's own background, so it
     spans the full 1440px definite width and survives horizontal scroll — unlike
     a background on the parent row, which was clipped to the scroll viewport.
     It stays BELOW the hatch (::after z-index:0), the absolute slot cells, the
     lanes (z-index:1) and the events (z-index:2) — no z-index needed here. */
  background: ${({ $isDayOff, $isToday, theme }) => {
    if ($isDayOff)
      return theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[100];
    if ($isToday)
      // Opaque equivalent of brand.agenda.nowTrackBg (translucent) — must match the
      // sticky label band exactly so there's no tone seam at the 100px boundary.
      return theme.isDark ? 'oklch(0.255 0.03 150)' : 'oklch(0.975 0.018 75)';
    return 'transparent';
  }};

  /* Day-off hatch overlay — hairline weight (gridLine) so it reads as a subtle
     texture over the continuous band, not a patchwork that segments it. */
  &::after {
    content: '';
    display: ${({ $isDayOff }) => ($isDayOff ? 'block' : 'none')};
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      -45deg,
      transparent 0px,
      transparent 9px,
      ${({ theme }) => theme.color.brand.agenda.gridLine} 9px,
      ${({ theme }) => theme.color.brand.agenda.gridLine} 11px
    );
    z-index: 0;
  }
`;

/**
 * One 30-minute slot column inside the track.
 * Absolutely positioned so height = track height regardless of content.
 * $slotIndex    — zero-based column index (drives left offset)
 * $slotWidthPx  — column width in pixels (matches header tick width)
 * $isHour       — true for :00 slots → stronger right border
 * $isLast       — true for the last slot → suppress right border
 */
export const StyledTherWeekSlotCell = styled.div<{
  $slotIndex: number;
  $slotWidthPx: number;
  $isHour: boolean;
  $isLast: boolean;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $slotIndex, $slotWidthPx }) => $slotIndex * $slotWidthPx}px;
  width: ${({ $slotWidthPx }) => $slotWidthPx}px;
  border-right: ${({ $isLast }) => ($isLast ? 'none' : '1px solid')};
  border-color: ${({ $isHour, theme }) =>
    $isHour
      ? theme.isDark
        ? theme.border.color.neutral.light
        : theme.color.brand.agenda.gridLine
      : theme.color.brand.agenda.gridLine};
  pointer-events: none;
  user-select: none;
`;

// ── Event lane ────────────────────────────────────────────────────────────────
//
// One horizontal lane layer — absolute, spans the full track width.
// $laneIndex  — 0-based lane index (0 = top-most lane)
// $laneCount  — total number of lanes for this day row
//
// Height is derived from the row's min-height:
//   each lane = (row min-height) / laneCount, minimum 54px.

export const StyledTherWeekLane = styled.div<{ $laneIndex: number; $laneCount: number }>`
  position: absolute;
  left: 0;
  right: 0;
  /* stack lanes evenly; row min-height drives the calculation via percentage */
  top: ${({ $laneIndex, $laneCount }) => ($laneIndex / $laneCount) * 100}%;
  height: ${({ $laneCount }) => 100 / $laneCount}%;
  z-index: 1;
`;

export const StyledTherWeekSundayLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  user-select: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  padding: 4px 12px;
  border-radius: 999px;
  /* Contrasting fill: the row band is now neutralWarm[100]/elevated, so the pill
     uses the card surface to lift off the band instead of blending in. */
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.medium};
`;

// ── Mini appointment block ────────────────────────────────────────────────────

function therEvtVariantStyles(variant: TAgendaEvtVariant, theme: TTheme): string {
  const isDark = theme.isDark;

  switch (variant) {
    case 'gold':
      return `background:${theme.color.brand.gold.bg};border-color:${theme.color.brand.gold.border};color:${isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};`;
    case 'jungle':
      return `background:${theme.color.brand.jungle.bg};border-color:${theme.color.brand.jungle.border};color:${isDark ? theme.color.intent.success : theme.color.brand.jungle[700]};`;
    case 'clay':
      return `background:${theme.color.brand.clay.bg};border-color:${theme.color.brand.clay.border};color:${isDark ? 'oklch(0.82 0.10 40)' /* dark clay text */ : theme.color.brand.clay[600]};`;
    case 'lotus':
      return `background:${theme.color.brand.lotus.bg};border-color:${theme.color.brand.lotus.border};color:${isDark ? theme.color.tertiary[300] : theme.color.brand.lotus.text};`;
    case 'sand':
      return `background:${isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};border-color:${theme.border.color.neutral.medium};color:${isDark ? theme.color.text.muted : theme.color.brand.ink[500]};`;
    case 'pending':
      return `background:${isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};border-style:dashed;border-color:${theme.color.brand.gold.pendingBorder};color:${isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};`;
    case 'break':
      return `background:transparent;border-style:dashed;border-color:${theme.border.color.neutral.medium};color:${isDark ? theme.color.text.muted : theme.color.brand.ink[500]};`;
    case 'unassigned':
      return `background:${isDark ? theme.color.background.dark : theme.color.neutralWarm[50]};border-style:dashed;border-color:${theme.border.color.neutral.light};color:${theme.color.text.muted};`;
  }
}

/**
 * Mini appointment block.
 *
 * Positioning is computed in the component via grid slot geometry:
 *   left  = ($slotStart * $slotWidthPx) + ($intraOffset * $slotWidthPx)
 *   width = max($slotSpan * $slotWidthPx - 4, 28)
 *
 * $slotStart     — grid column index where the event begins (0-based)
 * $slotSpan      — how many 30-min slots the event occupies (ceil)
 * $intraOffset   — fractional offset within the first slot (0.0–1.0)
 * $slotWidthPx   — slot width in pixels (from constants)
 * $delay         — animation stagger delay in ms
 */
export const StyledTherMiniEvt = styled.div<{
  $variant: TAgendaEvtVariant;
  $slotStart: number;
  $slotSpan: number;
  $intraOffset: number;
  $slotWidthPx: number;
  $delay: number;
}>`
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: ${({ $slotStart, $intraOffset, $slotWidthPx }) =>
    ($slotStart + $intraOffset) * $slotWidthPx}px;
  width: ${({ $slotSpan, $slotWidthPx }) => Math.max($slotSpan * $slotWidthPx - 4, 28)}px;
  border-radius: 8px;
  padding: 5px 8px;
  border: 1px solid;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 2;

  ${({ $variant, theme }) => therEvtVariantStyles($variant, theme)}

  /* Entry animation via @starting-style (CSS Transitions Level 2) */
  @starting-style {
    opacity: 0;
    transform: scale(0.95);
  }

  opacity: 1;
  transform: scale(1);
  transition:
    opacity 160ms ease-out ${({ $delay }) => $delay}ms,
    transform 160ms ease-out ${({ $delay }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    opacity: 1;
    transform: none;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      opacity: 0.82;
      transition: opacity 120ms ease-out;
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledTherMiniEvtTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
  flex-shrink: 0;
  white-space: nowrap;
`;

export const StyledTherMiniEvtClient = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Legend footer ─────────────────────────────────────────────────────────────

function legendDotStyles(variant: TAgendaEvtVariant, theme: TTheme): string {
  const isDark = theme.isDark;
  switch (variant) {
    case 'gold':
      return `background:${theme.color.brand.gold.bg};border-color:${theme.color.brand.gold.border};`;
    case 'jungle':
      return `background:${theme.color.brand.jungle.bg};border-color:${theme.color.brand.jungle.border};`;
    case 'clay':
      return `background:${theme.color.brand.clay.bg};border-color:${theme.color.brand.clay.border};`;
    case 'lotus':
      return `background:${theme.color.brand.lotus.bg};border-color:${theme.color.brand.lotus.border};`;
    case 'sand':
      return `background:${isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};border-color:${theme.border.color.neutral.medium};`;
    case 'pending':
      return `background:${isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};border-style:dashed;border-color:${theme.color.brand.gold.pendingBorder};`;
    case 'break':
      return `background:transparent;border-style:dashed;border-color:${theme.border.color.neutral.medium};`;
    case 'unassigned':
      return `background:${isDark ? theme.color.background.dark : theme.color.neutralWarm[50]};border-style:dashed;border-color:${theme.border.color.neutral.light};`;
  }
}

export const StyledTherWeekLegend = styled.footer`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
`;

export const StyledTherWeekLegendTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
`;

export const StyledTherWeekLegendItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
`;

export const StyledTherWeekLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StyledTherWeekLegendDot = styled.span<{ $variant: TAgendaEvtVariant }>`
  width: 12px;
  height: 12px;
  border-radius: 4px;
  border: 1px solid;
  flex-shrink: 0;
  ${({ $variant, theme }) => legendDotStyles($variant, theme)}
`;

export const StyledTherWeekLegendLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  font-weight: 500;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[700])};
`;
