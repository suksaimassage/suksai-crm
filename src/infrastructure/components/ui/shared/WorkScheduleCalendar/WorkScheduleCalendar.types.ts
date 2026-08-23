/**
 * WorkScheduleCalendar.types.ts
 * SRP: type definitions only — no logic, no side-effects.
 */

// ─── Domain ───────────────────────────────────────────────────────────────────

export type ShiftColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export type ScheduleView = 'day' | 'week' | 'month';

/**
 * Row density in the Day view.
 *   xs — name only (40px rows)
 *   sm — avatar + name (56px rows)
 *   md — avatar + name + role (72px rows, default)
 */
export type ScheduleDensity = 'xs' | 'sm' | 'md';

export interface Employee {
  id: string;
  name: string;
  role?: string;
  avatarSrc?: string;
  department?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  /** ISO date "YYYY-MM-DD" */
  date: string;
  /** 24h "HH:MM" */
  startTime: string;
  /** 24h "HH:MM" */
  endTime: string;
  color?: ShiftColor;
  label?: string;
  note?: string;
}

export type ShiftDraftTipo = 'especifico' | 'recurrente';

export interface ShiftDraft {
  employeeId: string;
  /** ISO date "YYYY-MM-DD" — used when tipo is 'especifico' */
  date: string;
  /** 24h "HH:MM" */
  startTime: string;
  /** 24h "HH:MM" */
  endTime: string;
  /**
   * Schedule type. 'especifico' = one-time on `date`; 'recurrente' = weekly on
   * `diaSemana`. Defaults to 'especifico' when not provided by the calendar.
   */
  tipo?: ShiftDraftTipo;
  /**
   * ISO weekday 1 (Monday) – 7 (Sunday). Required when tipo = 'recurrente'.
   * Ignored when tipo = 'especifico'.
   */
  diaSemana?: number;
}

// ─── Visible range ────────────────────────────────────────────────────────────

export interface VisibleHourRange {
  startHour: number;
  endHour: number;
}

// ─── Month grid ───────────────────────────────────────────────────────────────

export interface MonthDayCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  employees: Employee[];
}

export interface MonthWeekRow {
  days: MonthDayCell[];
}

// ─── Drag & drop (Day view) ───────────────────────────────────────────────────

/**
 * Ghost preview while dragging/resizing a shift in Day view.
 * All positional values are px, relative to StyledDayWrapper.
 */
export interface DayDragPreview {
  type: 'move' | 'resize';
  shiftId: string;
  previewStartTime: string;
  previewEndTime: string;
  previewEmployeeIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  color: ShiftColor;
  employeeName: string;
  /**
   * True when the ghost is landing on a DIFFERENT employee row than the shift's
   * origin (cross-row reassignment). Drives the "→ {therapist}" chip in the
   * ghost as a non-colour cue that the drop changes WHO works the shift.
   */
  isReassignment: boolean;
}

// ─── Drag reschedule confirmation ─────────────────────────────────────────────

/**
 * Shape of a proposed drag-reschedule, used by the confirm Dialog to pick the
 * right summary copy (Designer §4.4 — time-only / employee-only / both).
 *   'time'     — same therapist, day/time changed (move or resize)
 *   'employee' — reassignment to another therapist, time unchanged
 *   'both'     — reassignment AND a day/time change
 */
export type TRescheduleShape = 'time' | 'employee' | 'both';

/**
 * A drag-reschedule awaiting confirmation. Captured at drop (after the `changed`
 * check + pre-validation by the consumer). `origin` is the shift before the drag;
 * `proposed` is where it would land. Both are self-contained snapshots so the
 * Dialog summary stays correct even if a refetch reconciles while it is open.
 */
export interface PendingReschedule {
  origin: Shift;
  proposed: Shift;
  shape: TRescheduleShape;
}

// ─── Props API ────────────────────────────────────────────────────────────────

export interface WorkScheduleCalendarProps {
  employees: Employee[];
  shifts?: Shift[];
  initialDate?: Date;
  /** @default "week" */
  initialView?: ScheduleView;
  /** @default { startHour: 9, endHour: 21 } */
  visibleRange?: VisibleHourRange;
  /**
   * BCP-47 locale tag used for day/month names and date formatting (e.g. "es", "en").
   * Defaults to the browser's locale if omitted. Pass `i18n.language` from react-i18next
   * to make the calendar react to runtime language changes.
   */
  locale?: string;
  /** Pixels per hour in Day view @default 96 */
  slotWidth?: number;
  /** @default "md" */
  density?: ScheduleDensity;
  onShiftClick?: (shift: Shift) => void;
  onShiftCreate?: (draft: ShiftDraft) => void;
  onShiftUpdate?: (shift: Shift) => void;
  onShiftDelete?: (id: string) => void;
  /**
   * Dedicated commit channel for a drag-and-drop reschedule (Day move/resize,
   * Week move between day columns). When provided, a drop that changes the
   * shift's date/time/employee opens a confirmation Dialog and only invokes this
   * callback on Confirm — the optimistic move is deferred until then. The
   * EditModal's Save still uses `onShiftUpdate` (its own confirmation), so the
   * Dialog never double-confirms a modal edit. When omitted, the legacy
   * persist-immediately-on-drop behaviour is preserved (backwards compatible).
   * The argument is the proposed shift (already carrying the new employeeId/
   * date/startTime/endTime).
   *
   * Returns whether the change was ACCEPTED: `true` = validation passed and the
   * mutation was dispatched (the calendar then optimistically applies the move,
   * announces success and closes the Dialog); `false` = the consumer rejected it
   * (e.g. overlap/invalid range) and already surfaced the reason (Toast) — the
   * calendar keeps the card at its origin and closes the Dialog WITHOUT a false
   * success. An `undefined` return is treated as accepted (`true`).
   */
  onShiftReschedule?: (shift: Shift) => boolean | undefined;
  /**
   * Predicate marking a shift as read-only (e.g. recurrente template
   * occurrences). Read-only shifts are NOT draggable/resizable in any view and
   * render a non-colour lock cue; pressing one still opens its DetailPanel.
   * Domain-agnostic injection point so the design-system component never needs
   * to know about `rec:`/`esp:` id prefixes. @default () => false
   */
  isShiftReadOnly?: (shift: Shift) => boolean;
  /**
   * Reflects the consumer's reschedule-mutation pending state so the confirm
   * Dialog can show its loading/disabled Confirm button. Typically
   * `updateHorario.isPending`.
   */
  rescheduleSubmitting?: boolean;
  /**
   * Fired whenever the calendar's visible period changes (view switch or
   * prev/next/today/day navigation). `start`/`end` are inclusive local-midnight
   * day bounds covering everything the current view can show — month grids
   * include the leading/trailing days of adjacent months, week covers Sun–Sat,
   * day is the single selected day. Consumers use it to widen their data read so
   * shifts outside the current month do not disappear. Fires once on mount with
   * the initial range.
   */
  onVisibleRangeChange?: (start: Date, end: Date) => void;
  className?: string;
}

// ─── Styled transient props ───────────────────────────────────────────────────

export interface StyledShiftBlockProps {
  $left: string;
  $width: string;
  $color: ShiftColor;
  $isSelected: boolean;
  $isDragging: boolean;
  $isTiny: boolean;
  /** Read-only (recurrente): non-draggable lock cue, no grab cursor. */
  $readOnly: boolean;
}

export interface StyledWeekEmployeeCardProps {
  $color: ShiftColor;
  $isDragging: boolean;
  /** Read-only (recurrente): non-draggable lock cue, no grab cursor. */
  $readOnly: boolean;
}

export interface StyledViewBtnProps {
  $active: boolean;
}

export interface StyledMonthDayCellProps {
  $isCurrentMonth: boolean;
  $isToday: boolean;
}

export interface StyledWeekDayHeaderProps {
  $isToday: boolean;
  $isSelected: boolean;
}

export interface StyledWeekDayColumnProps {
  $isDragOver: boolean;
  $isValidDrop: boolean;
}

export interface StyledEmployeeLabelProps {
  $rowHeight: number;
  $labelWidth: number;
}

export interface StyledShiftAreaProps {
  $rowHeight: number;
  $gridWidth: number;
}

export interface StyledHourTickProps {
  $slotWidth: number;
}

export interface StyledGridLineProps {
  $slotWidth: number;
}

export interface StyledDragGhostProps {
  $left: number;
  $top: number;
  $width: number;
  $height: number;
  $color: ShiftColor;
}
