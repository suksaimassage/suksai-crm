import { useState, useRef, useEffect, type RefObject } from 'react';
import type {
  TCalendarView,
  ICalendarVolumeProps,
  ICalendarCellEvent,
  ICalendarRangeEvent,
  IGridCell,
} from './CalendarVolume.types';
import { getWeekDays, toISODateKey, formatHourLabel } from './useTimeGrid';

// ─── Static helpers ───────────────────────────────────────────────────────────

const MONTH = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const DAY_ABBR: Readonly<Record<string, string>> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
};

const HOUR_LABEL: readonly string[] = Array.from({ length: 24 }, (_, i) => formatHourLabel(i));

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - y.getTime()) / 86400000 + 1) / 7);
};

export const formatDateLabel = (date: Date, view: TCalendarView): string => {
  if (view === 'day') {
    return `${MONTH[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  const week = getWeekDays(date);
  const start = week[0];
  const end = week[6];
  const wn = getWeekNumber(date);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `Week ${wn} (${MONTH[start.getMonth()]} ${start.getDate()} – ${
    MONTH[end.getMonth()]
  } ${end.getDate()}${sameYear ? '' : `, ${end.getFullYear()}`}, ${end.getFullYear()})`;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

type TPickedEvents = Pick<
  ICalendarVolumeProps,
  | 'onCellClick'
  | 'onCellHover'
  | 'onCellFocus'
  | 'onCellBlur'
  | 'onRangeSelect'
  | 'onViewChange'
  | 'onDayChange'
  | 'onWeekChange'
>;

interface IUseCalendarVolumeParams extends TPickedEvents {
  view?: TCalendarView;
  defaultView?: TCalendarView;
  selectedDate?: Date;
  defaultDate?: Date;
  insightsCount?: number;
}

interface IUseCalendarVolumeResult {
  view: TCalendarView;
  selectedDate: Date;
  dateLabel: string;
  todayKey: string;
  handleViewChange: (v: TCalendarView) => void;
  handleNavigate: (dir: -1 | 1) => void;
  buildCellEventProps: (
    cell: IGridCell,
    cellRef: RefObject<HTMLDivElement>,
  ) => {
    onClick: React.MouseEventHandler<HTMLDivElement>;
    onMouseEnter: React.MouseEventHandler<HTMLDivElement>;
    onFocus: React.FocusEventHandler<HTMLDivElement>;
    onBlur: React.FocusEventHandler<HTMLDivElement>;
  };
  deriveBusySlots: (cells: ReadonlyMap<string, IGridCell>) => { label: string; count: number }[];
}

export const useCalendarVolume = ({
  view: controlledView,
  defaultView = 'week',
  selectedDate: controlledDate,
  defaultDate,
  insightsCount = 3,
  onCellClick,
  onCellHover,
  onCellFocus,
  onCellBlur,
  onRangeSelect,
  onViewChange,
  onDayChange,
  onWeekChange,
}: IUseCalendarVolumeParams): IUseCalendarVolumeResult => {
  const isViewControlled = controlledView !== undefined;
  const isDateControlled = controlledDate !== undefined;

  const [internalView, setInternalView] = useState<TCalendarView>(defaultView);
  const [internalDate, setInternalDate] = useState<Date>(() => defaultDate ?? new Date());

  const view = isViewControlled ? controlledView : internalView;
  const selectedDate = isDateControlled ? controlledDate : internalDate;

  const todayKey = toISODateKey(new Date());

  const handleViewChange = (v: TCalendarView) => {
    if (!isViewControlled) setInternalView(v);
    onViewChange?.(v);
  };

  const handleNavigate = (dir: -1 | 1) => {
    const next = new Date(selectedDate);
    if (view === 'day') {
      next.setDate(next.getDate() + dir);
      onDayChange?.(next);
    } else {
      next.setDate(next.getDate() + dir * 7);
      onWeekChange?.(getWeekDays(next)[0]);
    }
    if (!isDateControlled) setInternalDate(next);
  };

  const onCellClickRef = useRef(onCellClick);
  const onCellHoverRef = useRef(onCellHover);
  const onCellFocusRef = useRef(onCellFocus);
  const onCellBlurRef = useRef(onCellBlur);
  useEffect(() => {
    onCellClickRef.current = onCellClick;
    onCellHoverRef.current = onCellHover;
    onCellFocusRef.current = onCellFocus;
    onCellBlurRef.current = onCellBlur;
  });

  const buildCellEventProps = (cell: IGridCell, cellRef: RefObject<HTMLDivElement>) => {
    const makePayload = (): ICalendarCellEvent => ({
      day: cell.day,
      dayLabel: cell.dayLabel,
      hour: cell.hour,
      value: cell.value,
      element: cellRef.current,
    });

    return {
      onClick: () => onCellClickRef.current?.(makePayload()),
      onMouseEnter: () => onCellHoverRef.current?.(makePayload()),
      onFocus: () => onCellFocusRef.current?.(makePayload()),
      onBlur: () => onCellBlurRef.current?.(makePayload()),
    };
  };

  const _onRangeSelect = useRef(onRangeSelect);
  useEffect(() => {
    _onRangeSelect.current = onRangeSelect;
  });
  const _emitRange = (ev: ICalendarRangeEvent) => {
    _onRangeSelect.current?.(ev);
  };
  void _emitRange;

  const deriveBusySlots = (cells: ReadonlyMap<string, IGridCell>) => {
    const sorted = [...cells.values()]
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, insightsCount);

    return sorted.map((c) => ({
      label: `${DAY_ABBR[c.dayLabel] ?? c.dayLabel}, ${HOUR_LABEL[c.hour]}–${
        HOUR_LABEL[c.hour + 1] ?? ''
      }`,
      count: c.value,
    }));
  };

  const dateLabel = formatDateLabel(selectedDate, view);

  return {
    view,
    selectedDate,
    dateLabel,
    todayKey,
    handleViewChange,
    handleNavigate,
    buildCellEventProps,
    deriveBusySlots,
  };
};
