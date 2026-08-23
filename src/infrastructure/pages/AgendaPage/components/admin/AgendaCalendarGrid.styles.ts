import styled from 'styled-components';
import type { TAgendaEvtVariant } from '@domain/types';
import type { TTheme } from '@infra/styles/themes/light.theme';

// ── Calendar shell ─────────────────────────────────────────────────────────────

export const StyledCal = styled.section`
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  overflow: hidden;

  /* Below md, StyledCalHead/StyledCalBody grow past 100% width (their own
     minmax floor) — StyledCal is their single shared ancestor (no other
     siblings), so it owns horizontal scroll for BOTH at once. This keeps the
     therapist-name header and the appointment columns in lock-step when
     scrolled (a single native scrollbar, no JS scroll-sync needed) — mirrors
     TherapistWeekGrid's StyledTherWeekScrollArea pattern. */
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    mask-image: linear-gradient(to right, black calc(100% - 32px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black calc(100% - 32px), transparent 100%);
  }
`;

// ── Column header row ──────────────────────────────────────────────────────────

export const StyledCalHead = styled.div<{ $trackCount: number }>`
  display: grid;
  grid-template-columns: 64px repeat(${({ $trackCount }) => $trackCount}, 1fr);
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  scrollbar-gutter: stable;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 64px repeat(${({ $trackCount }) => $trackCount}, minmax(120px, 1fr));
    min-width: calc(64px + ${({ $trackCount }) => $trackCount} * 120px);
  }
`;

export const StyledCalCorner = styled.div`
  width: 64px;
  border-right: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  flex-shrink: 0;
`;

export const StyledTherapistColHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border-right: 1px solid ${({ theme }) => theme.border.color.neutral.light};

  &:last-child {
    border-right: none;
  }
`;

export const StyledTherapistAvatar = styled.div<{ $inactive: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
  background: ${({ $inactive, theme }) => {
    if ($inactive)
      return theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[200];
    return theme.isDark ? theme.color.background.elevated : theme.color.brand.jungle[900];
  }};
  color: ${({ $inactive, theme }) =>
    $inactive
      ? theme.isDark
        ? theme.color.text.muted
        : theme.color.brand.ink[500]
      : theme.color.brand.gold[400]};
`;

export const StyledTherapistColMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const StyledTherapistColName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  font-weight: 600;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.ink[900])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledTherapistColRoom = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  white-space: nowrap;
`;

export type TTherapistStatusVariant = 'none' | 'next' | 'done';

export const StyledTherapistColStatus = styled.span<{ $variant: TTherapistStatusVariant }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme, $variant }) => {
    if ($variant === 'done')
      return theme.isDark ? theme.color.intent.success : theme.color.brand.jungle[700];
    if ($variant === 'next')
      return theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700];
    return theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500];
  }};
`;

// ── "Sin asignación" primary column header ───────────────────────────────────
// Distinct from a therapist header: a clay attention accent (left bar + badge)
// marks it as the day's primary "needs attention" column.

export const StyledUnassignedColHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border-right: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-left: 3px solid ${({ theme }) => theme.color.brand.clay[500]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.brand.clay.bg : theme.color.brand.clay.tint};
`;

export const StyledUnassignedColBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: 700;
  font-size: 18px;
  line-height: 1;
  background: ${({ theme }) => theme.color.brand.clay[500]};
  color: ${({ theme }) => theme.color.text.inverse};
`;

export const StyledUnassignedColMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const StyledUnassignedColTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.clay[600])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledUnassignedColCount = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  white-space: nowrap;
`;

// ── Empty state ────────────────────────────────────────────────────────────────

export const StyledCalEmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 40px 24px;
`;

// ── Calendar body grid ─────────────────────────────────────────────────────────

export const StyledCalBody = styled.div<{ $trackCount: number }>`
  display: grid;
  grid-template-columns: 64px repeat(${({ $trackCount }) => $trackCount}, 1fr);
  min-height: 600px;
  position: relative;
  /* Horizontal scroll lives on StyledCal (shared with StyledCalHead) — this
     keeps only the vertical (time-of-day) scroll axis. */
  overflow-y: auto;
  max-height: 660px;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 64px repeat(${({ $trackCount }) => $trackCount}, minmax(120px, 1fr));
    min-width: calc(64px + ${({ $trackCount }) => $trackCount} * 120px);
  }
`;

// ── Hour ruler column (sticky left) ───────────────────────────────────────────

export const StyledHourColWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  position: sticky;
  left: 0;
  z-index: 1;
`;

export const StyledHourLbl = styled.div`
  height: 60px;
  padding: 6px 8px 0 10px;
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 11px;
  text-align: right;
  font-weight: 600;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  box-sizing: border-box;
  flex-shrink: 0;
`;

// ── Therapist track ────────────────────────────────────────────────────────────

export const StyledTrack = styled.div<{
  $isToday: boolean;
  $dropTarget?: boolean;
  /** The leading "Sin asignación" column — a faint clay tint + left accent bar. */
  $unassigned?: boolean;
}>`
  position: relative;
  border-right: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-left: ${({ $unassigned, theme }) =>
    $unassigned ? `3px solid ${theme.color.brand.clay[500]}` : 'none'};
  background: ${({ $isToday, $unassigned, theme }) =>
    $unassigned
      ? theme.isDark
        ? theme.color.brand.clay.bg
        : theme.color.brand.clay.tint
      : $isToday
        ? theme.color.brand.agenda.nowTrackBg
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
     tint signalling "this therapist will receive the cita". Layered via box-shadow
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

export const StyledTrackInner = styled.div<{ $height: number }>`
  position: relative;
  height: ${({ $height }) => $height}px;
`;

// ── Now indicator line ─────────────────────────────────────────────────────────

export const StyledNowLine = styled.div<{ $top: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $top }) => $top}px;
  height: 2px;
  background: ${({ theme }) => theme.color.brand.clay[500]};
  z-index: 2;
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

// ── Event variant styles (plain function — receives resolved theme) ─────────────

function evtVariantStyles(variant: TAgendaEvtVariant, theme: TTheme): string {
  const isDark = theme.isDark;

  switch (variant) {
    case 'gold':
      return `
        background: ${theme.color.brand.gold.bg};
        border-color: ${theme.color.brand.gold.border};
        color: ${isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
      `;
    case 'jungle':
      return `
        background: ${theme.color.brand.jungle.bg};
        border-color: ${theme.color.brand.jungle.border};
        color: ${isDark ? theme.color.intent.success : theme.color.brand.jungle[700]};
      `;
    case 'clay':
      return `
        background: ${theme.color.brand.clay.bg};
        border-color: ${theme.color.brand.clay.border};
        color: ${isDark ? 'oklch(0.82 0.10 40)' /* dark clay text */ : theme.color.brand.clay[600]};
      `;
    case 'lotus':
      return `
        background: ${theme.color.brand.lotus.bg};
        border-color: ${theme.color.brand.lotus.border};
        color: ${isDark ? theme.color.tertiary[300] : theme.color.brand.lotus.text};
      `;
    case 'sand':
      return `
        background: ${isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};
        border-color: ${theme.border.color.neutral.medium};
        color: ${isDark ? theme.color.text.primary : theme.color.brand.ink[900]};
      `;
    case 'pending':
      return `
        background: repeating-linear-gradient(
          135deg,
          ${isDark ? theme.color.background.elevated : theme.color.background.light} 0px,
          ${isDark ? theme.color.background.elevated : theme.color.background.light} 6px,
          ${isDark ? theme.color.background.dark : theme.color.neutralWarm[100]} 6px,
          ${isDark ? theme.color.background.dark : theme.color.neutralWarm[100]} 12px
        );
        border-style: dashed;
        border-color: ${theme.color.brand.gold.pendingBorder};
        color: ${isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
      `;
    case 'break':
      return `
        background: transparent;
        border-style: dashed;
        border-color: ${theme.border.color.neutral.medium};
        color: ${isDark ? theme.color.text.muted : theme.color.brand.ink[500]};
      `;
    case 'unassigned':
      return `
        background: ${isDark ? theme.color.background.dark : theme.color.neutralWarm[50]};
        border-style: dashed;
        border-color: ${theme.border.color.neutral.light};
        color: ${theme.color.text.muted};
      `;
  }
}

// ── Appointment event block ────────────────────────────────────────────────────

export const StyledEvt = styled.div<{
  $variant: TAgendaEvtVariant;
  $top: number;
  $height: number;
  $selected: boolean;
  $optimistic: boolean;
  /** Role permits + non-terminal estado → block can be picked up (Surface A). */
  $draggable?: boolean;
  /** Pointer is down past the 5px threshold on THIS block. */
  $lifted?: boolean;
  /** This block is the source of the in-flight gesture (ghost is out). */
  $dragging?: boolean;
  /** A reschedule is pending/in-flight → no new drag may start. */
  $dragDisabled?: boolean;
}>`
  position: absolute;
  left: 6px;
  right: 6px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height - 4, 20)}px;
  border-radius: 10px;
  padding: 9px 11px;
  border: 1px solid;
  overflow: hidden;
  /* Grab affordance only when draggable (fine pointer). Disabled-busy wins. */
  cursor: ${({ $draggable, $dragDisabled }) =>
    $dragDisabled ? 'not-allowed' : $draggable ? 'grab' : 'pointer'};
  /* Prevent the browser's native touch-scroll from hijacking a vertical drag. */
  touch-action: ${({ $draggable }) => ($draggable ? 'none' : 'auto')};
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition:
    background 150ms ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow 150ms ${({ theme }) => theme.transition.timing.easeOut},
    opacity 150ms ${({ theme }) => theme.transition.timing.easeOut},
    transform 120ms ${({ theme }) => theme.transition.timing.easeOut};
  /* Lifted block rides above neighbours; selection keeps its existing priority. */
  z-index: ${({ $selected, $lifted }) => ($lifted ? 4 : $selected ? 3 : 1)};
  opacity: ${({ $optimistic, $dragging }) => ($dragging ? 0.4 : $optimistic ? 0.6 : 1)};

  ${({ $variant, theme }) => evtVariantStyles($variant, theme)}

  /* Persistent selection ring — distinct from the transient focus outline.
     PRESERVED as-is (brand.gold[400]) — identity cue, not a drag ring. */
  ${({ $selected, theme }) =>
    $selected ? `box-shadow: 0 0 0 2px ${theme.color.brand.gold[400]};` : ''}

  /* Dragging source: a dashed ring in intent.focusRing reads as "ghosted origin"
     — the non-color cue (dashed pattern) pairs with the reduced opacity above so
     the state never relies on dimming alone (WCAG 1.4.1). NEW ring = focusRing. */
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

  @media (hover: hover) {
    &:hover {
      box-shadow: ${({ theme }) =>
        theme.isDark
          ? '0 2px 8px 0 oklch(0.97 0.01 67 / 0.10)'
          : '0 2px 8px 0 oklch(0.11 0.03 204 / 0.12)'};
      filter: brightness(${({ theme }) => (theme.isDark ? '1.08' : '0.98')});
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      background 150ms,
      box-shadow 150ms,
      opacity 150ms;
    transform: none;

    ${({ $lifted, theme }) =>
      $lifted ? `box-shadow: ${theme.effect.shadow.outer.md}; transform: none;` : ''}
  }
`;

/** Leading estado glyph (aria-hidden — meaning lives in the aria-label + text). */
export const StyledEvtGlyph = styled.span`
  font-size: 10px;
  line-height: 1;
  margin-right: 4px;
`;

/**
 * Lock badge on a terminal-estado (non-draggable) block — a non-color "can't
 * move" cue (Designer §4.1). Pinned to the block's top-right corner so it never
 * disturbs the column text layout. Decorative: `aria-hidden`; the meaning is
 * carried by the block's aria-label suffix (`a11y.lockedHint`). Mirrors
 * StyledWeekEvtLock.
 */
export const StyledEvtLock = styled.span`
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 10px;
  line-height: 1;
  opacity: 0.7;
  pointer-events: none;
`;

// ── Non-bookable block ─────────────────────────────────────────────────────────

/**
 * Non-bookable block (break / libranza / mantenimiento). NOT interactive: no
 * role=button, no tabIndex, no click — a decorative blocked region (Designer
 * §4.2). Coarse 45° hatch distinct from the pending 135° fine stripe.
 */
export const StyledBlock = styled.div<{ $top: number; $height: number }>`
  position: absolute;
  left: 6px;
  right: 6px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height - 4, 20)}px;
  border-radius: 10px;
  padding: 9px 11px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.medium};
  overflow: hidden;
  cursor: default;
  display: flex;
  flex-direction: column;
  gap: 3px;
  z-index: 1;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  background-image: repeating-linear-gradient(
    45deg,
    ${({ theme }) =>
        theme.isDark
          ? 'oklch(0.43 0.05 204 / 0.55)' /* dark: border.color.neutral.medium */
          : theme.color.brand.agenda.blockHatchA}
      0px,
    ${({ theme }) =>
        theme.isDark ? 'oklch(0.43 0.05 204 / 0.55)' : theme.color.brand.agenda.blockHatchA}
      2px,
    ${({ theme }) =>
        theme.isDark
          ? 'oklch(0.32 0.05 204)' /* dark: background.elevated */
          : theme.color.brand.agenda.blockHatchB}
      2px,
    ${({ theme }) => (theme.isDark ? 'oklch(0.32 0.05 204)' : theme.color.brand.agenda.blockHatchB)}
      9px
  );
`;

export const StyledBlockLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Event text slots ───────────────────────────────────────────────────────────

export const StyledEvtTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10.5px;
  font-weight: 600;
  opacity: 0.85;
  flex-shrink: 0;
`;

export const StyledEvtClient = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

export const StyledEvtService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledEvtRoom = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  opacity: 0.65;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Centro name line — a location glyph + name, one notch fainter than the room. */
export const StyledEvtCentro = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Drag preview ghost (Surface A) ───────────────────────────────────────────────
// The pessimistic-commit signal (Designer §4.2): the real block never moves during
// the gesture, so this snapped silhouette shows WHERE (which therapist column) +
// WHEN the cita will land. Mirrors StyledEvt geometry exactly (left:6/right:6,
// snapped top, durationToHeight height, Math.max(height-4,20) floor) so it reads as
// the same object in its future home. An outline + low-fill (not an opaque
// duplicate) keeps grid lines + any underlying block legible. Ring uses
// intent.focusRing (never brand.gold). No pulse. Mirrors StyledWeekGhost.

export const StyledDayGhost = styled.div<{
  $top: number;
  $height: number;
  /** Advisory client-detected visual overlap → amber fill instead of sage. */
  $overlap?: boolean;
}>`
  position: absolute;
  left: 6px;
  right: 6px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height - 4, 20)}px;
  border-radius: 10px;
  padding: 5px 9px;
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
  /* Follows the pointer via top updates; entrance has no transition so the
     tracking feels 1:1 (Designer §7). */

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Insert/move glyph (top-left) — the non-color cue that this is a landing slot. */
export const StyledDayGhostGlyph = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.4;
  color: ${({ theme }) => theme.color.intent.focusRing};
`;

/** Snapped HH:MM–HH:MM chip — mono, matches StyledEvtTime sizing. */
export const StyledDayGhostChip = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.text.secondary)};
`;
