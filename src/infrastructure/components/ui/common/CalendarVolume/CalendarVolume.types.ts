import type { ReactNode } from 'react';

// ─── Core ─────────────────────────────────────────────────────────────────────

export type TCalendarView = 'day' | 'week';

export interface IVolumeData {
  /** ISO date string "YYYY-MM-DD" */
  day: string;
  /** Hour in 24h format (0–23) */
  hour: number;
  /** Appointment count / density value */
  value: number;
}

// ─── Event System ─────────────────────────────────────────────────────────────

export interface ICalendarCellEvent {
  day: string;
  dayLabel: string;
  hour: number;
  value: number;
  element: HTMLElement | null;
}

export interface ICalendarRangeEvent {
  day: string;
  startHour: number;
  endHour: number;
  values: number[];
}

// ─── Custom Renderers ─────────────────────────────────────────────────────────

export interface ICellRenderProps {
  day: string;
  dayLabel: string;
  hour: number;
  value: number;
  intensity: number;
  bgColor: string;
  textColor: string;
  isEmpty: boolean;
}

export interface IHeaderRenderProps {
  title: string;
  view: TCalendarView;
  onViewChange: (v: TCalendarView) => void;
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ICalendarVolumeProps {
  // ── Data ──────────────────────────────────────────────────────────────────
  data?: IVolumeData[];

  // ── View control ──────────────────────────────────────────────────────────
  view?: TCalendarView;
  defaultView?: TCalendarView;

  // ── Date control ──────────────────────────────────────────────────────────
  selectedDate?: Date;
  defaultDate?: Date;

  // ── Time range ────────────────────────────────────────────────────────────
  startHour?: number;
  endHour?: number;

  // ── Display ───────────────────────────────────────────────────────────────
  title?: string;
  showInsights?: boolean;
  insightsCount?: number;
  /**
   * Compact variant: hides the view toggle (day/week) and the prev/next
   * navigation, for embedding as a static single-period heatmap (e.g. the
   * dashboard "Densidad de citas" panel). Defaults to false.
   */
  compact?: boolean;

  // ── Events ────────────────────────────────────────────────────────────────
  onCellClick?: (event: ICalendarCellEvent) => void;
  onCellHover?: (event: ICalendarCellEvent) => void;
  onCellFocus?: (event: ICalendarCellEvent) => void;
  onCellBlur?: (event: ICalendarCellEvent) => void;
  onRangeSelect?: (event: ICalendarRangeEvent) => void;
  onViewChange?: (view: TCalendarView) => void;
  onDayChange?: (date: Date) => void;
  onWeekChange?: (startDate: Date) => void;

  // ── Custom renderers ──────────────────────────────────────────────────────
  renderCell?: (props: ICellRenderProps) => ReactNode;
  renderHeader?: (props: IHeaderRenderProps) => ReactNode;

  // ── Styling / misc ────────────────────────────────────────────────────────
  className?: string;
  'aria-label'?: string;
}

// ─── Internal grid types ──────────────────────────────────────────────────────

export interface ITimeSlot {
  hour: number;
  label: string;
}

export interface IGridCell {
  day: string;
  dayLabel: string;
  hour: number;
  value: number;
  /** Normalised 0–1 density */
  intensity: number;
}

export interface IDayColumn {
  key: string;
  label: string;
  fullLabel: string;
  date: Date;
}

export interface IHeatmapScale {
  getColor: (intensity: number) => string;
  getTextColor: (intensity: number) => string;
  maxValue: number;
  gradientCss: string;
}

// ─── Responsive ──────────────────────────────────────────────────────────────

export type TBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface IResponsiveState {
  breakpoint: TBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
