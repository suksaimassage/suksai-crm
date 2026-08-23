import styled from 'styled-components';
import type { TAgendaTherapistColor } from '@domain/types';
import type { TTheme } from '@infra/styles/themes/light.theme';

// ── Shell ─────────────────────────────────────────────────────────────────────

export const StyledWeekCal = styled.section`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: 16px;
  overflow: hidden;
`;

/**
 * Shared horizontal-scroll ancestor for StyledWeekHead + StyledWeekBody only
 * (StyledWeekLegend is a sibling of THIS wrapper, not a child — it must stay
 * full-width, not scroll with the grid). Below md both children grow past
 * 100% width via their own minmax floor; scrolling this single wrapper keeps
 * the day-header row and the appointment columns in lock-step (mirrors
 * TherapistWeekGrid's StyledTherWeekScrollArea pattern).
 */
export const StyledWeekScrollArea = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

// ── Header row (day columns) ──────────────────────────────────────────────────

export const StyledWeekHead = styled.div`
  display: grid;
  grid-template-columns: 64px repeat(7, 1fr);
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  /* Reserve the same right gutter as the scrollable body so columns align on
     Windows classic scrollbars (overlay scrollbars have zero width — no effect). */
  scrollbar-gutter: stable;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 64px repeat(7, minmax(80px, 1fr));
    min-width: calc(64px + 7 * 80px);
  }
`;

export const StyledWeekCorner = styled.div`
  width: 64px;
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
`;

export const StyledWeekDayCol = styled.div<{ $isToday: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ $isToday, theme }) =>
    $isToday ? theme.color.brand.agenda.nowTrackBg : 'transparent'};

  &:last-child {
    border-right: none;
  }
`;

export const StyledWeekDayLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[100] : theme.color.brand.ink[500]};
`;

export const StyledWeekDayNumber = styled.span<{ $isToday: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 22px;
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

export const StyledWeekDayCount = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[100] : theme.color.brand.ink[500]};
  min-height: 14px;
`;

// ── Body ──────────────────────────────────────────────────────────────────────

export const StyledWeekBody = styled.div`
  display: grid;
  grid-template-columns: 64px repeat(7, 1fr);
  /* Horizontal scroll lives on StyledWeekScrollArea (shared with
     StyledWeekHead) — this keeps only the vertical (time-of-day) axis. */
  overflow-y: auto;
  max-height: 660px;
  scrollbar-gutter: stable;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 64px repeat(7, minmax(80px, 1fr));
    min-width: calc(64px + 7 * 80px);
  }
`;

export const StyledWeekHourCol = styled.div`
  display: flex;
  flex-direction: column;
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  position: sticky;
  left: 0;
  z-index: 2;
`;

export const StyledWeekHourLbl = styled.div`
  height: 60px;
  padding: 6px 8px 0 10px;
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 11px;
  font-weight: 600;
  text-align: right;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
  box-sizing: border-box;
  flex-shrink: 0;
`;

// ── Day track ─────────────────────────────────────────────────────────────────

export const StyledWeekTrack = styled.div<{ $isToday: boolean; $dropTarget?: boolean }>`
  position: relative;
  border-right: 1px solid
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ $isToday, theme }) =>
    $isToday
      ? theme.isDark
        ? theme.color.brand.jungle.bg
        : theme.color.brand.agenda.nowTrackBg
      : 'transparent'};
  background-image: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 59px,
    ${({ theme }) => theme.color.brand.agenda.gridLine} 59px,
    ${({ theme }) => theme.color.brand.agenda.gridLine} 60px
  );
  transition: box-shadow 150ms ease;

  /* Drop-target orientation wash (Designer §4.3): a subtle, mode-aware column
     tint signalling "this day will receive the cita". Layered via box-shadow
     inset so it composes over the existing background/grid-line image without
     clobbering it. Surface A never pre-validates overlaps → no invalid state. */
  ${({ $dropTarget, theme }) =>
    $dropTarget ? `box-shadow: inset 0 0 0 9999px ${theme.color.overlay.primary};` : ''}

  &:last-child {
    border-right: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StyledWeekTrackInner = styled.div<{ $height: number }>`
  position: relative;
  height: ${({ $height }) => $height}px;
`;

// ── Now line (inside today's track column) ────────────────────────────────────

export const StyledWeekNowLine = styled.div<{ $top: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $top }) => $top}px;
  height: 2px;
  background: ${({ theme }) => theme.color.brand.clay[500]};
  z-index: 10;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    left: -1px;
    top: -4px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: ${({ theme }) => theme.color.brand.clay[500]};
  }
`;

// ── Week appointment block ────────────────────────────────────────────────────

function therapistColorStyles(color: TAgendaTherapistColor, theme: TTheme): string {
  const acc = theme.color.brand.therapistAccent;
  switch (color) {
    case 'a':
      return `background:${acc.aBg};border-color:${acc.a};color:${acc.a};`;
    case 'b':
      return `background:${acc.bBg};border-color:${acc.b};color:${acc.b};`;
    case 'c':
      return `background:${acc.cBg};border-color:${acc.c};color:${acc.c};`;
    case 'd':
      return `background:${acc.dBg};border-color:${acc.d};color:${acc.d};`;
    case 'e':
      return `background:${acc.eBg};border-color:${acc.e};color:${acc.e};`;
    case 'f':
      return `background:${acc.fBg};border-color:${acc.f};color:${acc.f};`;
  }
}

export const StyledWeekEvt = styled.div<{
  $color: TAgendaTherapistColor;
  $top: number;
  $height: number;
  $selected: boolean;
  $optimistic: boolean;
  /** Role permits + non-terminal estado → block can be picked up. */
  $draggable?: boolean;
  /** Pointer is down past the 5px threshold on THIS block. */
  $lifted?: boolean;
  /** This block is the source of the in-flight gesture (ghost is out). */
  $dragging?: boolean;
  /** A reschedule is pending/in-flight → no new drag may start. */
  $dragDisabled?: boolean;
}>`
  position: absolute;
  left: 4px;
  right: 4px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height - 4, 18)}px;
  border-radius: 8px;
  padding: 6px 9px;
  border: 1px solid;
  overflow: hidden;
  /* Grab affordance only when draggable (fine pointer). Disabled-busy wins. */
  cursor: ${({ $draggable, $dragDisabled }) =>
    $dragDisabled ? 'not-allowed' : $draggable ? 'grab' : 'pointer'};
  /* Prevent the browser's native touch-scroll from hijacking a vertical drag. */
  touch-action: ${({ $draggable }) => ($draggable ? 'none' : 'auto')};
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition:
    opacity 150ms,
    box-shadow 150ms,
    transform 120ms ${({ theme }) => theme.transition.timing.easeOut};
  /* Lifted block rides above neighbours; selection keeps its existing priority. */
  z-index: ${({ $selected, $lifted }) => ($lifted ? 4 : $selected ? 3 : 1)};
  opacity: ${({ $optimistic, $dragging }) => ($dragging ? 0.4 : $optimistic ? 0.6 : 1)};

  ${({ $color, theme }) => therapistColorStyles($color, theme)}

  /* Persistent selection ring — mirrors the day-grid pattern. Selection's only
     persistent cue, so the ring must meet WCAG 1.4.11 (≥3:1 non-text). Uses the
     mode-aware intent.focusRing (≥3.5:1 light / ≥7.5:1 dark) — never brand.gold,
     which is scattered <3:1. Therapist identity stays on the accent border-color
     (therapistColorStyles). Matches StyledShiftBlock (Designer §9 follow-up). */
  ${({ $selected, theme }) =>
    $selected ? `box-shadow: 0 0 0 2px ${theme.color.intent.focusRing};` : ''}

  /* Dragging source: a dashed ring in intent.focusRing reads as "ghosted origin"
     — the non-color cue (dashed pattern) pairs with the reduced opacity above so
     the state never relies on dimming alone (WCAG 1.4.1). */
  ${({ $dragging, theme }) =>
    $dragging
      ? `box-shadow: 0 0 0 1px ${theme.color.intent.focusRing} inset, 0 0 0 1px ${theme.color.intent.focusRing}; border-style: dashed;`
      : ''}

  /* Lift on grab (past threshold): elevation + scale = "the grab was registered".
     transform is dropped under reduced-motion below. */
  ${({ $lifted, theme }) =>
    $lifted
      ? `box-shadow: ${theme.effect.shadow.outer.md}; transform: scale(1.02); cursor: grabbing;`
      : ''}

  /* Hover lift — a low-frequency affordance signal ("grabbable"). Fine pointer
     only; never on coarse/touch (no hover there). */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      opacity: ${({ $optimistic, $dragging }) => ($dragging ? 0.4 : $optimistic ? 0.6 : 0.82)};
      ${({ $draggable, $lifted, $dragDisabled, theme }) =>
        $draggable && !$lifted && !$dragDisabled
          ? `transform: translateY(-1px); box-shadow: ${theme.effect.shadow.outer.sm};`
          : ''}
    }
  }

  @media not all and (hover: hover) {
    &:hover {
      opacity: ${({ $optimistic, $dragging }) => ($dragging ? 0.4 : $optimistic ? 0.6 : 0.82)};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  /* Coarse-pointer 44px press/drag target without inflating the resting visual
     (≥18px floor). Stays within the left:4/right:4 inset so it never overlaps a
     neighbouring slot's hit area (Designer §2.2 — mirrors the cluster idiom). */
  @media (pointer: coarse) {
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      min-height: 44px;
      height: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      opacity 150ms,
      box-shadow 150ms;
    transform: none;

    ${({ $lifted, theme }) =>
      $lifted ? `box-shadow: ${theme.effect.shadow.outer.md}; transform: none;` : ''}

    &:hover {
      transform: none;
    }
  }
`;

/**
 * Lock badge on a terminal-estado (non-draggable) block — a non-color "can't
 * move" cue (Designer §4.1). Pinned to the block's top-right corner so it never
 * disturbs the column text layout. Decorative: `aria-hidden`; the meaning is
 * carried by the block's aria-label suffix (`a11y.lockedHint`).
 */
export const StyledWeekEvtLock = styled.span`
  position: absolute;
  top: 5px;
  right: 6px;
  font-size: 10px;
  line-height: 1;
  opacity: 0.7;
  pointer-events: none;
`;

export const StyledWeekEvtTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
  flex-shrink: 0;
`;

export const StyledWeekEvtClient = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

export const StyledWeekEvtService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Week cluster ("folder") ─────────────────────────────────────────────────────
// One control standing in for N overlapping citas (Designer §1.1–§1.2). Reuses
// StyledWeekEvt's geometry (absolute left:4/right:4, top, Math.max(height-4,18))
// and — for the homogeneous variant — the same `therapistColorStyles` accent
// helper, so the folder reads as a native sibling of the single block.

type TWeekClusterVariant = 'homogeneous' | 'heterogeneous';

function clusterHeterogeneousStyles(theme: TTheme): string {
  const surface = theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[100];
  const border = theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[300];
  const text = theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[700];
  return `background:${surface};border-color:${border};color:${text};`;
}

/**
 * Layered back-card rims peeking behind the front card — the non-color "stack"
 * cue (WCAG 1.4.1: "multiple" reads without relying on hue). Decorative only
 * (aria-hidden, pointer-events:none). Suppressed under 24px height by the grid.
 *
 * Rendered as TRACK-level siblings of the folder card (not its children), so
 * these absolute coords resolve against StyledWeekTrackInner (position:relative)
 * and stay inside the column behind the card (Bug 1 fix). z-index is a small
 * NON-NEGATIVE value below the card (closed card z-index:2): depth 1 → 1,
 * depth 2 → 0. The previous `1 - $depth` yielded -1 for depth 2, which could
 * fall behind the track's stacking context and vanish.
 */
export const StyledWeekClusterStackEdge = styled.div<{
  $top: number;
  $height: number;
  $variant: TWeekClusterVariant;
  $color: TAgendaTherapistColor;
  $depth: 1 | 2;
}>`
  position: absolute;
  left: ${({ $depth }) => 4 + $depth * 2}px;
  right: ${({ $depth }) => 4 - $depth * 2}px;
  top: ${({ $top, $depth }) => $top + $depth * 2}px;
  height: ${({ $height }) => Math.max($height - 4, 18)}px;
  border-radius: 8px;
  border: 1px solid;
  pointer-events: none;
  z-index: ${({ $depth }) => 2 - $depth};
  opacity: ${({ $depth }) => ($depth === 1 ? 0.7 : 0.45)};

  ${({ $variant, $color, theme }) =>
    $variant === 'homogeneous'
      ? therapistColorStyles($color, theme)
      : clusterHeterogeneousStyles(theme)}
`;

export const StyledWeekCluster = styled.div<{
  $variant: TWeekClusterVariant;
  $color: TAgendaTherapistColor;
  $top: number;
  $height: number;
  $open: boolean;
  $optimistic: boolean;
}>`
  position: absolute;
  left: 4px;
  right: 4px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height - 4, 18)}px;
  border-radius: 8px;
  padding: 6px 9px;
  border: 1px solid;
  overflow: visible;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    opacity 150ms,
    box-shadow 150ms,
    transform 120ms ${({ theme }) => theme.transition.timing.easeOut};
  z-index: ${({ $open }) => ($open ? 3 : 2)};
  opacity: ${({ $optimistic }) => ($optimistic ? 0.6 : 1)};

  ${({ $variant, $color, theme }) =>
    $variant === 'homogeneous'
      ? therapistColorStyles($color, theme)
      : clusterHeterogeneousStyles(theme)}

  /* Persistent open ring — identical idiom to StyledWeekEvt $selected (mode-aware
     intent.focusRing, never brand.gold; identity stays on the accent border). */
  ${({ $open, theme }) => ($open ? `box-shadow: 0 0 0 2px ${theme.color.intent.focusRing};` : '')}

  @media (hover: hover) {
    &:hover {
      box-shadow: ${({ $open, theme }) =>
        $open
          ? `0 0 0 2px ${theme.color.intent.focusRing}, ${theme.effect.shadow.outer.md}`
          : theme.effect.shadow.outer.md};
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  /* Coarse-pointer 44px hit area without inflating the resting visual (≥18px
     floor). Stays within the left:4/right:4 inset so it never overlaps a
     neighbouring slot's hit area (Designer §2.2). */
  @media (pointer: coarse) {
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      min-height: 44px;
      height: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      opacity 150ms,
      box-shadow 150ms;

    &:active {
      transform: none;
    }
  }
`;

/** Stacked-folder mark (aria-hidden) — reinforces "folder of items" at the floor. */
export const StyledWeekClusterGlyph = styled.span<{ $variant: TWeekClusterVariant }>`
  flex-shrink: 0;
  font-size: 13px;
  line-height: 1;
  color: ${({ $variant, theme }) =>
    $variant === 'heterogeneous'
      ? theme.isDark
        ? theme.color.text.tertiary
        : theme.color.brand.ink[500]
      : 'inherit'};
`;

/** Count pill — the folder's loudest element (the payload). */
export const StyledWeekClusterCount = styled.span<{ $variant: TWeekClusterVariant }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ $variant, theme }) =>
    $variant === 'heterogeneous'
      ? theme.isDark
        ? theme.color.text.secondary
        : theme.color.brand.ink[700]
      : 'inherit'};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.dark : theme.color.neutralWarm[50]};
`;

/** Earliest-start micro-label (mono) — shown only when height ≥ ~34px. */
export const StyledWeekClusterLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Legend strip ──────────────────────────────────────────────────────────────

export const StyledWeekLegend = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 16px;
  padding: 12px 16px;
  border-top: 1px solid
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
`;

export const StyledWeekLegendItem = styled.div<{ $color: TAgendaTherapistColor }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  color: ${({ theme }) => theme.color.brand.ink[500]};

  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
    background: ${({ $color, theme }) => {
      const acc = theme.color.brand.therapistAccent;
      const map: Record<string, string> = {
        a: acc.a,
        b: acc.b,
        c: acc.c,
        d: acc.d,
        e: acc.e,
        f: acc.f,
      };
      return map[$color] ?? acc.a;
    }};
  }
`;

// ── Drag preview ghost (singleton) ──────────────────────────────────────────────
// The pessimistic-commit signal (Designer §4.2): the real block never moves
// during the gesture, so this snapped silhouette shows WHERE + WHEN the cita will
// land. Mirrors StyledWeekEvt geometry exactly (left:4/right:4, snapped top,
// durationToHeight height) so it reads as the same object in its future home. An
// outline + low-fill (not an opaque duplicate) keeps grid lines + any underlying
// block legible. New ring uses intent.focusRing (never brand.gold). No pulse.

export const StyledWeekGhost = styled.div<{
  $top: number;
  $height: number;
  /** Advisory client-detected visual overlap → amber fill instead of sage. */
  $overlap?: boolean;
}>`
  position: absolute;
  left: 4px;
  right: 4px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height - 4, 18)}px;
  border-radius: 8px;
  padding: 4px 8px;
  outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
  outline-offset: -1px;
  background: ${({ $overlap, theme }) =>
    $overlap ? theme.color.intent.warningZone : theme.color.intent.successZone};
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  overflow: hidden;
  /* Follows the pointer via top/left updates; entrance has no transition so the
     tracking feels 1:1 (Designer §7). */

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Insert/move glyph (top-left) — the non-color cue that this is a landing slot. */
export const StyledWeekGhostGlyph = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.4;
  color: ${({ theme }) => theme.color.intent.focusRing};
`;

/** Snapped HH:MM–HH:MM chip — mono, matches StyledWeekEvtTime sizing. */
export const StyledWeekGhostChip = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.text.secondary)};
`;
