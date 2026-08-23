// ─── Public API ───────────────────────────────────────────────────────────────

export { CalendarVolume } from './CalendarVolume';

// Hooks (consumers can compose their own wrappers)
export { useCalendarVolume } from './useCalendarVolume';
export { useTimeGrid, formatHourLabel, toISODateKey, getWeekDays } from './useTimeGrid';
export { useHeatmapScale } from './useHeatmapScale';
export { useResponsiveGrid } from './useResponsiveGrid';

// Types
export type {
  ICalendarVolumeProps,
  IVolumeData,
  TCalendarView,
  ICalendarCellEvent,
  ICalendarRangeEvent,
  ICellRenderProps,
  IHeaderRenderProps,
  IGridCell,
  IHeatmapScale,
  IResponsiveState,
  TBreakpoint,
} from './CalendarVolume.types';
