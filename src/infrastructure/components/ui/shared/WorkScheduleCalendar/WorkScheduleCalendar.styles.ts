/**
 * WorkScheduleCalendar.styles.ts
 * Fixed + extended styled-components.
 * Uses theme tokens exclusively.
 * SRP: visual definitions only.
 *
 * Key fixes vs v1:
 *  - StyledShiftArea: overflow: hidden (eliminates cross/bleed bug)
 *  - StyledShiftArea: no background-image (was double-rendering grid lines)
 *  - StyledAddShiftBtn: no CSS display toggle (avoids reflow thrashing)
 *  - Density-aware layout tokens via StyledEmployeeLabel.$labelWidth
 *  - New: StyledDragGhost, StyledResizeHandle, StyledWeekDayColumn DnD states
 */

import styled, { css, keyframes } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type {
  ShiftColor,
  StyledDragGhostProps,
  StyledEmployeeLabelProps,
  StyledGridLineProps,
  StyledHourTickProps,
  StyledMonthDayCellProps,
  StyledShiftAreaProps,
  StyledShiftBlockProps,
  StyledViewBtnProps,
  StyledWeekDayColumnProps,
  StyledWeekDayHeaderProps,
  StyledWeekEmployeeCardProps,
} from './WorkScheduleCalendar.types';

// ─── Animations ───────────────────────────────────────────────────────────────

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const pulseGhost = keyframes`
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 0.85; }
`;

// ─── Color helpers ────────────────────────────────────────────────────────────

export const resolveShiftColor = (color: ShiftColor, theme: DefaultTheme): string => {
  switch (color) {
    case 'primary':
      return theme.color.accent.primary;
    case 'secondary':
      return theme.color.accent.secondary;
    case 'success':
      return theme.color.success[500];
    case 'warning':
      return theme.color.warning[500];
    case 'error':
      return theme.color.error[500];
  }
};

export const resolveShiftBg = (color: ShiftColor, theme: DefaultTheme): string => {
  const { isDark } = theme;
  switch (color) {
    case 'primary':
      return isDark ? theme.color.primary[800] : theme.color.primary[50];
    case 'secondary':
      return isDark ? theme.color.secondary[800] : theme.color.secondary[50];
    case 'success':
      return isDark ? theme.color.success[800] : theme.color.success[50];
    case 'warning':
      return isDark ? theme.color.warning[800] : theme.color.warning[50];
    case 'error':
      return isDark ? theme.color.error[800] : theme.color.error[50];
  }
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export const StyledWSCRoot = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    width: 100%;
    /* No fixed height:100% — the calendar is intrinsically sized by its
       content/views. A floor keeps it usable, but clamp lets a short
       landscape viewport (low height) settle below the old hard 480px floor. */
    min-height: clamp(360px, 50vh, 480px);
    background-color: ${theme.color.background.card};
    border: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    border-radius: ${theme.border.radius.xl};
    box-shadow: ${theme.effect.shadow.outer.md};
    overflow: hidden;
    font-family: ${theme.typography.font.body};
    position: relative;
  `}
`;

// ─── Header ───────────────────────────────────────────────────────────────────

export const StyledWSCHeader = styled.div`
  ${({ theme }) => css`
    display: flex;
    /* Mobile: 2 filas — fila 1: título + nav, fila 2: hoy + vistas */
    flex-wrap: wrap;
    align-items: center;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border-bottom: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    background-color: ${theme.color.background.card};
    flex-shrink: 0;
    z-index: ${theme.zIndex.sticky};

    @media (min-width: ${theme.breakpoint.md}) {
      flex-wrap: nowrap;
      justify-content: space-between;
      gap: ${theme.spacing.md};
      padding: ${theme.spacing.md} ${theme.spacing.lg};
    }
  `}
`;

export const StyledWSCHeaderLeft = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    /* Mobile: fila 1, lado derecho — desplaza el título a la izquierda */
    order: 2;
    margin-left: auto;

    @media (min-width: ${theme.breakpoint.md}) {
      order: 1;
      margin-left: 0;
    }
  `}
`;

export const StyledWSCHeaderCenter = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    /* Mobile: fila 1, alineado a la izquierda, ocupa el espacio disponible */
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
    flex: 1;
    order: 1;

    @media (min-width: ${theme.breakpoint.md}) {
      align-items: center;
      order: 2;
    }
  `}
`;

export const StyledWSCHeaderRight = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    /* Mobile: fila 2 propia — botón Hoy + selector de vistas */
    order: 3;
    flex-basis: 100%;

    @media (min-width: ${theme.breakpoint.md}) {
      flex-basis: auto;
      order: 3;
    }
  `}
`;

// ─── View switcher ────────────────────────────────────────────────────────────

export const StyledViewSwitcher = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: ${theme.border.radius.sm};
    background: ${theme.color.background.neutral};
    border: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
  `}
`;

export const StyledViewBtn = styled.button<StyledViewBtnProps>`
  ${({ theme, $active }) => css`
    padding: 3px ${theme.spacing.sm};
    border: none;
    border-radius: ${theme.border.radius.xs};
    font-family: ${theme.typography.font.body};
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    cursor: pointer;
    transition: all ${theme.transition.duration.fast} ease;
    line-height: 1.4;

    ${$active
      ? css`
          background: ${theme.color.background.light};
          color: ${theme.color.accent.primary};
          box-shadow: ${theme.effect.shadow.outer.xs};
        `
      : css`
          background: transparent;
          color: ${theme.color.text.tertiary};
          &:hover {
            color: ${theme.color.text.secondary};
          }
        `}

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }
  `}
`;

// ─── Month View ───────────────────────────────────────────────────────────────

export const StyledMonthWrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing.md};
    scrollbar-width: thin;
    scrollbar-color: ${theme.color.scrollbar.scrollbarThumb} transparent;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.color.scrollbar.scrollbarThumb};
      border-radius: 2px;
    }
  `}
`;

export const StyledMonthWeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
`;

export const StyledMonthWeekdayLabel = styled.div`
  ${({ theme }) => css`
    text-align: center;
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: ${theme.spacing.xs} 0;
  `}
`;

export const StyledMonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

export const StyledMonthDayCell = styled.button<StyledMonthDayCellProps>`
  ${({ theme, $isCurrentMonth, $isToday }) => css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.xs};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    min-height: 96px;
    border: ${theme.border.width.xs} solid
      ${$isToday ? theme.color.accent.primary : theme.border.color.neutral.light};
    border-radius: ${theme.border.radius.md};
    background: ${$isToday
      ? theme.color.overlay.primary
      : $isCurrentMonth
        ? theme.color.background.card
        : theme.color.background.neutral};
    cursor: pointer;
    text-align: left;
    transition: all ${theme.transition.duration.fast} ease;
    opacity: ${$isCurrentMonth ? 1 : 0.45};

    &:hover {
      border-color: ${theme.color.accent.primary};
      box-shadow: ${theme.effect.shadow.outer.xs};
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }
  `}
`;

export const StyledMonthDayNumber = styled.span<{ $isToday: boolean }>`
  ${({ theme, $isToday }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: ${theme.border.radius.full};
    font-size: ${theme.typography.size.sm};
    font-weight: ${$isToday ? theme.typography.weight.bold : theme.typography.weight.regular};
    background: ${$isToday ? theme.color.accent.primary : 'transparent'};
    color: ${$isToday ? theme.color.text.inverse : theme.color.text.primary};
    flex-shrink: 0;
  `}
`;

export const StyledMonthAvatarArea = styled.div`
  width: 100%;
  overflow: hidden;
`;

// ─── Week View ────────────────────────────────────────────────────────────────

export const StyledWeekWrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: ${theme.color.scrollbar.scrollbarThumb} transparent;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.color.scrollbar.scrollbarThumb};
      border-radius: 2px;
    }
  `}
`;

export const StyledWeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  height: 100%;
  min-height: 320px;
`;

/**
 * $isDragOver + $isValidDrop drive the visual drop-target highlight.
 * Invalid drops show a red tint; valid drops show a primary tint.
 */
export const StyledWeekDayColumn = styled.div<StyledWeekDayColumnProps>`
  ${({ theme, $isDragOver, $isValidDrop }) => css`
    display: flex;
    flex-direction: column;
    border-right: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    position: relative;
    transition: background-color ${theme.transition.duration.fast} ease;

    &:last-child {
      border-right: none;
    }

    ${$isDragOver &&
    css`
      background: ${$isValidDrop ? theme.color.overlay.primary : theme.color.intent.errorZone};

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border: 2px dashed ${$isValidDrop ? theme.color.accent.primary : theme.color.error[500]};
        border-radius: ${theme.border.radius.sm};
        pointer-events: none;
      }
    `}
  `}
`;

export const StyledWeekDayHeader = styled.button<StyledWeekDayHeaderProps>`
  ${({ theme, $isToday }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: ${theme.spacing.sm} ${theme.spacing.xs};
    border: none;
    border-bottom: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    background: ${$isToday ? theme.color.overlay.primary : theme.color.background.card};
    cursor: pointer;
    flex-shrink: 0;
    width: 100%;
    transition: background-color ${theme.transition.duration.fast} ease;

    &:hover {
      background: ${theme.color.background.neutral};
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: -2px;
    }
  `}
`;

export const StyledWeekDayLabel = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  `}
`;

export const StyledWeekDayNumber = styled.span<{ $isToday: boolean }>`
  ${({ theme, $isToday }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: ${theme.border.radius.full};
    font-size: ${theme.typography.size.md};
    font-weight: ${$isToday ? theme.typography.weight.bold : theme.typography.weight.regular};
    background: ${$isToday ? theme.color.accent.primary : 'transparent'};
    color: ${$isToday ? theme.color.text.inverse : theme.color.text.primary};
  `}
`;

export const StyledWeekDayBody = styled.div`
  ${({ theme }) => css`
    flex: 1;
    padding: ${theme.spacing.sm};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: ${theme.color.scrollbar.scrollbarThumb} transparent;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.color.scrollbar.scrollbarThumb};
      border-radius: 2px;
    }
  `}
`;

export const StyledWeekEmployeeCard = styled.button<StyledWeekEmployeeCardProps>`
  ${({ theme, $color, $isDragging, $readOnly }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border: none;
    border-radius: ${theme.border.radius.sm};
    background: ${resolveShiftBg($color, theme)};
    border-left: 3px solid ${resolveShiftColor($color, theme)};
    /* Read-only (recurrente) reads as BLOCKED, not merely inert: no grab cursor,
       no drag, plus a faint hatch overlay. The lock glyph (rendered in JSX) +
       cursor + missing drag are the primary, non-colour cues (WCAG 1.4.1). */
    cursor: ${$readOnly ? 'default' : 'grab'};
    width: 100%;
    text-align: left;
    transition: all ${theme.transition.duration.fast} ease;
    opacity: ${$isDragging ? 0.4 : 1};
    position: relative;

    ${$readOnly &&
    css`
      background-image: repeating-linear-gradient(
        45deg,
        ${theme.color.intent.errorSubtle} 0,
        ${theme.color.intent.errorSubtle} 1px,
        transparent 1px,
        transparent 7px
      );
    `}

    &:hover {
      ${$readOnly
        ? ''
        : css`
            filter: brightness(0.97);
            box-shadow: ${theme.effect.shadow.outer.xs};
          `}
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 1px;
    }
  `}
`;

export const StyledWeekEmployeeName = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.medium};
    color: ${theme.color.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  `}
`;

export const StyledWeekShiftTime = styled.span`
  ${({ theme }) => css`
    font-size: 10px;
    color: ${theme.color.text.tertiary};
    white-space: nowrap;
    flex-shrink: 0;
  `}
`;

export const StyledWeekEmptyState = styled.div`
  ${({ theme }) => css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${theme.typography.size.xs};
    color: ${theme.color.text.disabled};
  `}
`;

// ─── Day View ─────────────────────────────────────────────────────────────────

/**
 * The scrollable container for the Day view.
 * position: relative is required so the drag ghost (position: absolute)
 * is contained within this element's coordinate space.
 */
export const StyledDayWrapper = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.color.scrollbar.scrollbarThumb} transparent;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.color.scrollbar.scrollbarThumb};
    border-radius: 3px;
  }

  /* The Day grid scrolls horizontally; as a keyboard-reachable scroll region
     (tabIndex=0 on the element) it must show a visible focus ring (WCAG 2.1.1 /
     2.4.7). Offset inward so the ring stays inside the card's rounded border. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: -2px;
  }
`;

export const StyledDayInner = styled.div<{ $minWidth: number }>`
  min-width: ${({ $minWidth }) => $minWidth}px;
  display: flex;
  flex-direction: column;
`;

// Time ruler row — sticky top
export const StyledTimeRulerRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    position: sticky;
    top: 0;
    z-index: ${theme.zIndex.sticky + 2};
    background: ${theme.color.background.card};
    border-bottom: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    flex-shrink: 0;
  `}
`;

// Corner cell — top-left intersection, sticky both axes
export const StyledCornerCell = styled.div<{ $labelWidth: number }>`
  ${({ theme, $labelWidth }) => css`
    /* Mobile: columna fija compacta que sobrexpone el contenido */
    width: 160px;
    flex-shrink: 0;
    position: sticky;
    left: 0;
    z-index: ${theme.zIndex.sticky + 3};
    background: ${theme.color.background.card};
    border-right: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    display: flex;
    align-items: center;
    padding: ${theme.spacing.sm} ${theme.spacing.md};

    @media (min-width: ${theme.breakpoint.md}) {
      width: ${$labelWidth}px;
    }
  `}
`;

export const StyledTimeRuler = styled.div<{ $gridWidth: number }>`
  display: flex;
  width: ${({ $gridWidth }) => $gridWidth}px;
  flex-shrink: 0;
`;

export const StyledHourTick = styled.div<StyledHourTickProps>`
  ${({ theme, $slotWidth }) => css`
    width: ${$slotWidth}px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: ${theme.spacing.xs} 0 ${theme.spacing.xs} 0;
    position: relative;
    border-left: 1px solid ${theme.border.color.neutral.light};
  `}
`;

export const StyledHourTickLabel = styled.span`
  ${({ theme }) => css`
    font-size: 10px;
    font-weight: ${theme.typography.weight.medium};
    color: ${theme.color.text.tertiary};
    white-space: nowrap;
    padding-left: ${theme.spacing.xs};
  `}
`;

// Employee list body
export const StyledEmployeeListBody = styled.div`
  display: flex;
  flex-direction: column;
`;

// A single employee row.
// $isReassignTarget: subtle wash when a Day-view drag hovers a DIFFERENT row
// than the shift's origin, so the cross-row reassignment target reads clearly
// (Designer §4.3). Additive only — never gates the drop (truth is on Confirm).
export const StyledEmployeeRow = styled.div<{ $isReassignTarget?: boolean }>`
  ${({ theme, $isReassignTarget }) => css`
    display: flex;
    border-bottom: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    transition: background-color ${theme.transition.duration.fast}
      ${theme.transition.timing.easeOut};
    &:last-child {
      border-bottom: none;
    }

    ${$isReassignTarget &&
    css`
      background: ${theme.color.overlay.primary};
    `}

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `}
`;

// Employee label — sticky left
export const StyledEmployeeLabel = styled.div<StyledEmployeeLabelProps>`
  ${({ theme, $rowHeight, $labelWidth }) => css`
    /* Mobile: columna compacta 160px alineada con el StyledCornerCell */
    width: 160px;
    flex-shrink: 0;
    height: ${$rowHeight}px;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    position: sticky;
    left: 0;
    z-index: ${theme.zIndex.base + 2};
    background: ${theme.color.background.card};
    border-right: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    transition: background-color ${theme.transition.duration.fast} ease;

    @media (min-width: ${theme.breakpoint.md}) {
      width: ${$labelWidth}px;
      padding: ${theme.spacing.xs} ${theme.spacing.md};
    }
  `}
`;

export const StyledEmployeeInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

export const StyledEmployeeName = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
`;

export const StyledEmployeeRole = styled.div`
  ${({ theme }) => css`
    font-size: 11px;
    color: ${theme.color.text.tertiary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  `}
`;

/**
 * ⚠️  FIX: overflow: hidden (was "visible" — caused cross/bleed artifact)
 * ⚠️  FIX: no background-image (grid lines rendered exclusively by StyledGridLine)
 */
export const StyledShiftArea = styled.div<StyledShiftAreaProps>`
  ${({ $rowHeight, $gridWidth }) => css`
    height: ${$rowHeight}px;
    width: ${$gridWidth}px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden; /* ← critical fix: clip absolutely positioned children */
  `}
`;

/**
 * Vertical hour grid lines.
 * Uses absolute pixel stops so background-size correctly tiles at slotWidth.
 */
export const StyledGridLine = styled.div<StyledGridLineProps>`
  ${({ theme, $slotWidth }) => css`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: repeating-linear-gradient(
      to right,
      ${theme.border.color.neutral.light} 0px,
      ${theme.border.color.neutral.light} 1px,
      transparent 1px,
      transparent ${$slotWidth}px
    );
    background-size: ${$slotWidth}px 100%;
  `}
`;

// Shift block
export const StyledShiftBlock = styled.button<StyledShiftBlockProps>`
  ${({ theme, $left, $width, $color, $isSelected, $isDragging, $isTiny, $readOnly }) => css`
    position: absolute;
    top: 8px;
    height: calc(100% - 16px);
    left: ${$left};
    width: ${$width};
    border: none;
    border-radius: ${theme.border.radius.sm};
    background: ${resolveShiftBg($color, theme)};
    border-left: 3px solid ${resolveShiftColor($color, theme)};
    /* Read-only (recurrente) reads as BLOCKED, not merely inert: no grab cursor,
       no drag/resize, plus a faint hatch overlay. The lock glyph (rendered in
       JSX) + cursor + missing resize handle are the primary, non-colour cues
       (WCAG 1.4.1). Shift identity stays on the border-left so it's still
       recognisable as that shift. */
    cursor: ${$readOnly ? 'default' : 'grab'};
    overflow: hidden;
    display: flex;
    flex-direction: ${$isTiny ? 'row' : 'column'};
    align-items: ${$isTiny ? 'center' : 'flex-start'};
    padding: ${$isTiny ? `0 ${theme.spacing.xs}` : `${theme.spacing.xs} ${theme.spacing.sm}`};
    gap: 2px;
    text-align: left;
    min-width: 0;
    /* Dim while dragging so the ghost stands out */
    opacity: ${$isDragging ? 0.35 : 1};
    /* Selected is the ONLY persistent indicator of selection, so its ring must
       meet WCAG 2.2 AA 1.4.11 (≥3:1 non-text). The per-shift resolveShiftColor
       fails in a scattered way — primary/secondary 2.14–2.15:1 in light, error
       2.70:1 in dark — so the ring uses the mode-aware intent.focusRing instead
       (≥3.78:1 light / ≥5.20:1 dark vs both the card and every shift bg). Shift
       identity stays on the border-left. The hover ring matches the same token
       so a hovered-while-selected block never regresses below 3:1. */
    box-shadow: ${$isSelected
      ? `0 0 0 2px ${theme.color.intent.focusRing}`
      : theme.effect.shadow.outer.xs};
    transition:
      opacity ${theme.transition.duration.fast} ease,
      box-shadow ${theme.transition.duration.fast} ease;

    ${$readOnly &&
    css`
      background-image: repeating-linear-gradient(
        45deg,
        ${theme.color.intent.errorSubtle} 0,
        ${theme.color.intent.errorSubtle} 1px,
        transparent 1px,
        transparent 7px
      );
    `}

    &:hover {
      ${$readOnly
        ? ''
        : css`
            box-shadow: 0 0 0 2px ${theme.color.intent.focusRing};
          `}
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }
  `}
`;

/**
 * Lock glyph for read-only (recurrente) shift blocks/cards. Decorative
 * (`aria-hidden` in JSX) — the accessible name carries the read-only hint.
 * Inherits the shift's identity accent so it reads as part of the block.
 */
export const StyledShiftLockGlyph = styled.span`
  ${({ theme }) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${theme.color.text.tertiary};

    svg {
      width: 12px;
      height: 12px;
    }
  `}
`;

export const StyledShiftBlockLabel = styled.span<{ $isTiny: boolean }>`
  ${({ theme, $isTiny }) => css`
    font-size: ${$isTiny ? '10px' : theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    min-width: 0;
    max-width: 100%;
    pointer-events: none;
  `}
`;

export const StyledShiftBlockTime = styled.span<{ $isTiny: boolean }>`
  ${({ theme, $isTiny }) => css`
    font-size: 10px;
    color: ${theme.color.text.tertiary};
    white-space: nowrap;
    display: ${$isTiny ? 'none' : 'block'};
    line-height: 1.2;
    pointer-events: none;
  `}
`;

/** Right-edge drag handle for resizing a shift's end time */
export const StyledResizeHandle = styled.div`
  ${({ theme }) => css`
    position: absolute;
    right: 0;
    top: 4px;
    bottom: 4px;
    width: 8px;
    cursor: ew-resize;
    border-radius: 0 ${theme.border.radius.xs} ${theme.border.radius.xs} 0;
    background: oklch(1 0 0 / 0.25);
    opacity: 0;
    transition: opacity ${theme.transition.duration.fast} ease;
    z-index: 4;

    ${StyledShiftBlock}:hover & {
      opacity: 1;
    }
  `}
`;

/**
 * "Add shift" ghost button — shown via React state (no CSS display toggle)
 * to avoid layout reflows on every mouse move.
 * Uses opacity/visibility so it can animate without causing reflow.
 */
export const StyledAddShiftBtn = styled.button`
  ${({ theme }) => css`
    position: absolute;
    top: 8px;
    /* FIX: use calc so width is explicitly bounded to shift area */
    left: 4px;
    right: 4px;
    bottom: 8px;
    border: ${theme.border.width.xs} dashed ${theme.color.neutral[300]};
    border-radius: ${theme.border.radius.sm};
    background: transparent;
    cursor: pointer;
    color: ${theme.color.text.disabled};
    font-size: ${theme.typography.size.xs};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.spacing.xs};
    /* No reflow: controlled entirely by parent's conditional render */
    animation: ${fadeIn} ${theme.transition.duration.fast} ease;

    svg {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    &:hover {
      border-color: ${theme.color.accent.primary};
      color: ${theme.color.accent.primary};
      background: ${theme.color.overlay.primary};
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }
  `}
`;

/**
 * Drag ghost — rendered as position: absolute inside StyledDayWrapper.
 * Shows the snapped "landing zone" while the user drags.
 */
export const StyledDragGhost = styled.div<StyledDragGhostProps>`
  ${({ theme, $left, $top, $width, $height, $color }) => css`
    position: absolute;
    left: ${$left}px;
    top: ${$top}px;
    width: ${$width}px;
    height: ${$height}px;
    border-radius: ${theme.border.radius.sm};
    background: ${resolveShiftBg($color, theme)};
    border-left: 3px solid ${resolveShiftColor($color, theme)};
    box-shadow: 0 0 0 2px ${resolveShiftColor($color, theme)};
    pointer-events: none;
    z-index: 10;
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    overflow: hidden;
    animation: ${pulseGhost} 1s ease-in-out infinite;

    /* The pulse is a gentle "this is provisional" shimmer on a short-lived
       element; disable it under reduced-motion (Designer §7 key addition). */
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `}
`;

/**
 * "→ {therapist}" chip shown inside the drag ghost when it lands on a different
 * employee row (cross-row reassignment). Text-carrying, non-colour cue that the
 * drop changes WHO works the shift (Designer §4.2 / §5).
 */
export const StyledDragGhostReassignChip = styled.span`
  ${({ theme }) => css`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    align-self: flex-start;
    max-width: 100%;
    margin-top: 2px;
    padding: 0 ${theme.spacing.xs};
    border-radius: ${theme.border.radius.xs};
    background: ${theme.color.intent.warningZone};
    color: ${theme.color.text.primary};
    font-size: 10px;
    font-weight: ${theme.typography.weight.semibold};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  `}
`;

export const StyledDragGhostLabel = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  `}
`;

export const StyledDragGhostTime = styled.span`
  ${({ theme }) => css`
    font-size: 10px;
    color: ${theme.color.text.secondary};
    white-space: nowrap;
    pointer-events: none;
  `}
`;

// ─── Right detail panel ───────────────────────────────────────────────────────

export const StyledPanelOverlay = styled.div<{ $open: boolean }>`
  ${({ theme, $open }) => css`
    position: fixed;
    inset: 0;
    z-index: ${theme.zIndex.overlay};
    pointer-events: ${$open ? 'auto' : 'none'};
    background: ${$open ? theme.color.background.overlay : 'transparent'};
    backdrop-filter: ${$open ? 'blur(2px)' : 'none'};
    transition:
      background ${theme.transition.duration.base} ease,
      backdrop-filter ${theme.transition.duration.base} ease;
  `}
`;

export const StyledPanel = styled.aside<{ $open: boolean }>`
  ${({ theme, $open }) => css`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(380px, 100vw);
    background: ${theme.color.background.light};
    border-left: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    box-shadow: ${theme.effect.shadow.outer.xl};
    display: flex;
    flex-direction: column;
    z-index: ${theme.zIndex.modal};
    transform: translateX(${$open ? '0' : '100%'});
    transition: transform ${theme.transition.duration.slow} ${theme.transition.timing.easeOut};
  `}
`;

export const StyledPanelColorBar = styled.div<{ $color: ShiftColor }>`
  height: 4px;
  background: ${({ theme, $color }) => resolveShiftColor($color, theme)};
  flex-shrink: 0;
`;

export const StyledPanelHeader = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: ${theme.spacing.lg} ${theme.spacing.xl};
    border-bottom: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    gap: ${theme.spacing.md};
    flex-shrink: 0;
  `}
`;

export const StyledPanelTitleGroup = styled.div`
  min-width: 0;
`;

export const StyledPanelTitle = styled.h2`
  ${({ theme }) => css`
    margin: 0;
    font-family: ${theme.typography.font.display};
    font-size: ${theme.typography.size.xl};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.primary};
    word-break: break-word;
  `}
`;

export const StyledPanelSubtitle = styled.p`
  ${({ theme }) => css`
    margin: 4px 0 0;
    font-size: ${theme.typography.size.sm};
    color: ${theme.color.text.tertiary};
  `}
`;

export const StyledPanelBody = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing.lg} ${theme.spacing.xl};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.lg};
  `}
`;

export const StyledPanelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledPanelSectionLabel = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  `}
`;

export const StyledPanelSectionValue = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.color.text.primary};
    font-weight: ${theme.typography.weight.medium};
  `}
`;

export const StyledPanelFooter = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.md} ${theme.spacing.xl};
    border-top: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    background: ${theme.color.background.neutral};
    flex-shrink: 0;
  `}
`;

// ─── Modal ────────────────────────────────────────────────────────────────────

export const StyledModalOverlay = styled.div<{ $open: boolean }>`
  ${({ theme, $open }) => css`
    position: fixed;
    inset: 0;
    background: ${theme.color.background.overlay};
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing.lg};
    z-index: ${theme.zIndex.modal + 1};
    pointer-events: ${$open ? 'auto' : 'none'};
    opacity: ${$open ? 1 : 0};
    transition: opacity ${theme.transition.duration.base} ease;
  `}
`;

export const StyledModalCard = styled.div`
  ${({ theme }) => css`
    background: ${theme.color.background.light};
    border: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    border-radius: ${theme.border.radius['2xl']};
    box-shadow: ${theme.effect.shadow.outer.xl};
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ${scaleIn} ${theme.transition.duration.slow} ${theme.transition.timing.easeOut} both;
  `}
`;

export const StyledModalHeader = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing.lg} ${theme.spacing.xl};
    border-bottom: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    background: ${theme.color.background.neutral};
    flex-shrink: 0;
  `}
`;

export const StyledModalTitle = styled.h2`
  ${({ theme }) => css`
    margin: 0;
    font-family: ${theme.typography.font.display};
    font-size: ${theme.typography.size.xl};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.primary};
  `}
`;

export const StyledModalBody = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing.xl};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.lg};
  `}
`;

export const StyledModalFooter = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.md} ${theme.spacing.xl};
    border-top: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    background: ${theme.color.background.neutral};
    flex-shrink: 0;
  `}
`;

// ─── Form primitives ──────────────────────────────────────────────────────────

export const StyledFormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledFormLabel = styled.label`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.medium};
    color: ${theme.color.text.secondary};
  `}
`;

export const StyledFormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const StyledFormInput = styled.input`
  ${({ theme }) => css`
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    border-radius: ${theme.border.radius.sm};
    font-family: ${theme.typography.font.body};
    font-size: ${theme.typography.size.sm};
    color: ${theme.color.text.primary};
    background: ${theme.color.background.light};
    outline: none;
    transition:
      border-color ${theme.transition.duration.fast} ease,
      box-shadow ${theme.transition.duration.fast} ease;

    &:focus {
      border-color: ${theme.color.accent.primary};
      box-shadow: 0 0 0 3px ${theme.color.overlay.primary};
    }
    &::placeholder {
      color: ${theme.color.text.disabled};
    }
  `}
`;

export const StyledFormSelect = styled.select`
  ${({ theme }) => css`
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    border-radius: ${theme.border.radius.sm};
    font-family: ${theme.typography.font.body};
    font-size: ${theme.typography.size.sm};
    color: ${theme.color.text.primary};
    background: ${theme.color.background.light};
    cursor: pointer;
    outline: none;
    &:focus {
      border-color: ${theme.color.accent.primary};
      box-shadow: 0 0 0 3px ${theme.color.overlay.primary};
    }
  `}
`;

export const StyledFormTextarea = styled.textarea`
  ${({ theme }) => css`
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border: ${theme.border.width.xs} solid ${theme.border.color.neutral.light};
    border-radius: ${theme.border.radius.sm};
    font-family: ${theme.typography.font.body};
    font-size: ${theme.typography.size.sm};
    color: ${theme.color.text.primary};
    background: ${theme.color.background.light};
    resize: vertical;
    min-height: 72px;
    outline: none;
    transition:
      border-color ${theme.transition.duration.fast} ease,
      box-shadow ${theme.transition.duration.fast} ease;
    &:focus {
      border-color: ${theme.color.accent.primary};
      box-shadow: 0 0 0 3px ${theme.color.overlay.primary};
    }
  `}
`;

// ─── Tipo radio group (Create modal) ─────────────────────────────────────────

export const StyledTipoRadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledTipoRadioLabel = styled.label`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    font-size: ${theme.typography.size.sm};
    color: ${theme.color.text.primary};
    cursor: pointer;

    input[type='radio'] {
      accent-color: ${theme.color.accent.primary};
      width: 16px;
      height: 16px;
      cursor: pointer;
      flex-shrink: 0;
    }
  `}
`;

// ─── Icon button ──────────────────────────────────────────────────────────────

export const StyledIconBtn = styled.button`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: ${theme.border.radius.sm};
    background: transparent;
    color: ${theme.color.text.tertiary};
    cursor: pointer;
    flex-shrink: 0;
    transition: all ${theme.transition.duration.fast} ease;
    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: ${theme.color.background.neutral};
      color: ${theme.color.text.primary};
    }

    &:focus-visible {
      outline: 2px solid ${theme.color.intent.focusRing};
      outline-offset: 2px;
    }
  `}
`;

// ─── Empty state ──────────────────────────────────────────────────────────────

export const StyledDayEmptyState = styled.div`
  ${({ theme }) => css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${theme.spacing.md};
    color: ${theme.color.text.disabled};
    font-size: ${theme.typography.size.sm};
    padding: ${theme.spacing['2xl']};
    text-align: center;
    animation: ${fadeIn} ${theme.transition.duration.slow} ease;
  `}
`;

// ─── Reschedule confirm Dialog body ───────────────────────────────────────────
//
// Composed message body for the calendar-internal confirm Dialog (Designer §2,
// §6). Single column, left-aligned, mirrors StyledCancelBody. The summary swaps
// copy by change shape (time / employee / both) but the layout is constant: a
// context line, then a FROM row and an emphasised TO row.

export const StyledShiftRescheduleSummary = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.md};
    text-align: left;
    font-family: ${theme.typography.font.body};
  `}
`;

export const StyledRescheduleContext = styled.p`
  ${({ theme }) => css`
    margin: 0;
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.regular};
    color: ${theme.color.text.secondary};
    line-height: 1.5;
  `}
`;

export const StyledRescheduleChange = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};
  `}
`;

export const StyledRescheduleRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: ${theme.spacing.xs} ${theme.spacing.sm};
  `}
`;

export const StyledRescheduleLabel = styled.span`
  ${({ theme }) => css`
    flex-shrink: 0;
    min-width: 2.5ch;
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.regular};
    color: ${theme.color.text.muted};
  `}
`;

// FROM value — de-emphasised relative to the destination.
export const StyledRescheduleFromValue = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.medium};
    color: ${theme.color.text.secondary};
    /* Read the full change — never truncate the day/time/therapist. */
    overflow-wrap: anywhere;
  `}
`;

// TO value — the destination (new time and/or therapist) is the loudest text.
export const StyledRescheduleToValue = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.color.text.primary};
    overflow-wrap: anywhere;
  `}
`;

/**
 * Visually-hidden polite live region for drag-reschedule announcements
 * (proposed change on Dialog open, success on confirm, revert on cancel —
 * Designer §5 / aria-live table). Standard sr-only pattern; the consuming JSX
 * sets aria-live="polite" + role="status".
 */
export const StyledRescheduleLiveRegion = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * "Reasignación" badge for the employee-only / both shapes. Carries TEXT, not
 * just hue (WCAG 1.4.1).
 *
 * Contrast [Contrast verify — Developer, Designer §10]: the Designer's first
 * choice was `text.warning` on `intent.warningZone`. Verified: light
 * `text.warning` oklch(0.55 0.16 56) on `warningZone` oklch(0.97 0.02 56) is
 * ≈3.4:1 — BELOW the 4.5:1 small-text bar. Per the Designer's documented
 * fallback, the badge label therefore uses `text.primary` (≈14:1 on warningZone
 * in BOTH modes) while keeping the warn-zone background as the non-text
 * identity. Dark `intent.warning` would have passed, but `text.primary` is used
 * in both modes for consistency and a comfortable margin.
 */
export const StyledReassignBadge = styled.span`
  ${({ theme }) => css`
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    padding: 0 ${theme.spacing.xs};
    border-radius: ${theme.border.radius.xs};
    background: ${theme.color.intent.warningZone};
    color: ${theme.color.text.primary};
    font-size: ${theme.typography.size.xs};
    font-weight: ${theme.typography.weight.semibold};
    line-height: 1.6;
    white-space: nowrap;
  `}
`;
