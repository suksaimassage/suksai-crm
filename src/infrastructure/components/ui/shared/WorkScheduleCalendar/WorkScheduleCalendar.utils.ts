/**
 * WorkScheduleCalendar.utils.ts
 * Pure date/time/positioning utilities — zero side-effects, no React.
 */

import type {
  Employee,
  MonthDayCell,
  MonthWeekRow,
  ScheduleDensity,
  ScheduleView,
  Shift,
  VisibleHourRange,
} from './WorkScheduleCalendar.types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WEEKDAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DEFAULT_VISIBLE_RANGE: VisibleHourRange = {
  startHour: 9,
  endHour: 21,
};

export const DEFAULT_SLOT_WIDTH = 96;

/** Per-density layout constants */
export const DENSITY_CONFIG: Record<
  ScheduleDensity,
  {
    rowHeight: number;
    showAvatar: boolean;
    showRole: boolean;
    labelWidth: number;
  }
> = {
  xs: { rowHeight: 40, showAvatar: false, showRole: false, labelWidth: 160 },
  sm: { rowHeight: 56, showAvatar: true, showRole: false, labelWidth: 180 },
  md: { rowHeight: 72, showAvatar: true, showRole: true, labelWidth: 200 },
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const addDays = (date: Date, n: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekDays = (anchor: Date): Date[] => {
  const sunday = getWeekStart(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

export const timeToMinutes = (time: string): number => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTimeStr = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Round minutes to the nearest `snap` boundary (default 15 min). */
export const snapToGrid = (minutes: number, snap = 15): number => Math.round(minutes / snap) * snap;

export const formatHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

export const formatTimeRange = (start: string, end: string): string => {
  const fmt = (t: string): string => {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

export const shiftDurationLabel = (start: string, end: string): string => {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ─── Horizontal shift positioning ─────────────────────────────────────────────

/**
 * Computes shift block position in pixels along the time axis.
 * Left and width are relative to the start of the shift area (after employee label).
 */
export const computeShiftPosition = (
  shift: Shift,
  range: VisibleHourRange,
  slotWidth: number,
): { left: number; width: number; visible: boolean } => {
  const rangeStartMin = range.startHour * 60;
  const rangeEndMin = range.endHour * 60;
  const startMin = timeToMinutes(shift.startTime);
  const endMin = timeToMinutes(shift.endTime);

  if (startMin >= rangeEndMin || endMin <= rangeStartMin) {
    return { left: 0, width: 0, visible: false };
  }

  const clampedStart = Math.max(startMin, rangeStartMin);
  const clampedEnd = Math.min(endMin, rangeEndMin);

  const left = ((clampedStart - rangeStartMin) / 60) * slotWidth;
  const width = Math.max(((clampedEnd - clampedStart) / 60) * slotWidth, 4);

  return { left, width, visible: true };
};

/** Total pixel width of the time grid for the visible range. */
export const getGridWidth = (range: VisibleHourRange, slotWidth: number): number =>
  (range.endHour - range.startHour) * slotWidth;

/** Array of hour integers within the visible range. */
export const getVisibleHours = (range: VisibleHourRange): number[] =>
  Array.from({ length: range.endHour - range.startHour }, (_, i) => range.startHour + i);

// ─── Data indexes ─────────────────────────────────────────────────────────────

/** dateKey → Set<employeeId> for employees with shifts on that day. */
export const buildDateEmployeeIndex = (shifts: Shift[]): Map<string, Set<string>> => {
  const index = new Map<string, Set<string>>();
  for (const shift of shifts) {
    const set = index.get(shift.date) ?? new Set<string>();
    set.add(shift.employeeId);
    index.set(shift.date, set);
  }
  return index;
};

/** `${employeeId}:${dateKey}` → Shift[] */
export const buildShiftIndex = (shifts: Shift[]): Map<string, Shift[]> => {
  const index = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const key = `${shift.employeeId}:${shift.date}`;
    const bucket = index.get(key) ?? [];
    bucket.push(shift);
    index.set(key, bucket);
  }
  return index;
};

export const getShiftsForEmployee = (
  employeeId: string,
  dateKey: string,
  shiftIndex: Map<string, Shift[]>,
): Shift[] => shiftIndex.get(`${employeeId}:${dateKey}`) ?? [];

export const getEmployeesForDay = (
  dateKey: string,
  employees: Employee[],
  dateEmployeeIndex: Map<string, Set<string>>,
): Employee[] => {
  const ids = dateEmployeeIndex.get(dateKey);
  if (!ids || ids.size === 0) return [];
  return employees.filter((e) => ids.has(e.id));
};

// ─── Locale-aware date helpers ────────────────────────────────────────────────

/** Returns a short weekday name (e.g. "Mon", "lun") for a given Date using Intl. */
export const getWeekdayShort = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);

/** Returns a long weekday name (e.g. "Monday", "lunes") for a given Date using Intl. */
export const getWeekdayFull = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);

/** Returns a long month name (e.g. "January", "enero") for a given Date using Intl. */
export const getMonthLong = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);

// ─── Header title ─────────────────────────────────────────────────────────────

export const getHeaderTitle = (
  view: ScheduleView,
  selectedDate: Date,
  weekDays: Date[],
  locale = 'en',
): string => {
  const month = (d: Date) => getMonthLong(d, locale);
  const year = (d: Date) => d.getFullYear();

  if (view === 'day') {
    return `${getWeekdayFull(selectedDate, locale)}, ${month(selectedDate)} ${selectedDate.getDate()}, ${year(selectedDate)}`;
  }
  if (view === 'week') {
    const start = weekDays[0];
    const end = weekDays[6];
    if (weekDays.length >= 7) {
      if (start.getMonth() === end.getMonth()) {
        return `${month(start)} ${start.getDate()}–${end.getDate()}, ${year(end)}`;
      }
      return `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}, ${year(end)}`;
    }
  }
  return `${month(selectedDate)} ${year(selectedDate)}`;
};

// ─── Month grid builder ───────────────────────────────────────────────────────

export const buildMonthGrid = (
  year: number,
  month: number,
  today: Date,
  employees: Employee[],
  dateEmployeeIndex: Map<string, Set<string>>,
): MonthWeekRow[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const weeks: MonthWeekRow[] = [];
  let weekDays: MonthDayCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 + (i - startOffset));
    const key = toDateKey(date);

    weekDays.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      employees: getEmployeesForDay(key, employees, dateEmployeeIndex),
    });

    if (weekDays.length === 7) {
      weeks.push({ days: weekDays });
      weekDays = [];
    }
  }

  return weeks;
};

// ─── Visible date range ───────────────────────────────────────────────────────

/**
 * Inclusive local-midnight [start, end] day bounds the current view can display:
 *   - day   → the selected day itself.
 *   - week  → Sun–Sat of the selected week (matches getWeekDays).
 *   - month → the full month grid INCLUDING the leading/trailing adjacent-month
 *     days that buildMonthGrid renders (so a shift shown in a trailing cell of
 *     the previous/next month is inside the range). The grid starts on the
 *     Sunday on/before the 1st and ends on the Saturday completing the last week.
 * Pure — no React, no side-effects.
 */
export const getVisibleDateRange = (
  view: ScheduleView,
  selectedDate: Date,
): { start: Date; end: Date } => {
  if (view === 'day') {
    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    return { start, end: new Date(start) };
  }

  if (view === 'week') {
    const days = getWeekDays(selectedDate);
    const first = days[0];
    const last = days[6];
    return {
      start: new Date(first.getFullYear(), first.getMonth(), first.getDate()),
      end: new Date(last.getFullYear(), last.getMonth(), last.getDate()),
    };
  }

  // month — mirror buildMonthGrid's cell span.
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const start = new Date(year, month, 1 - startOffset);
  const end = new Date(year, month, 1 + (totalCells - 1 - startOffset));
  return { start, end };
};

// ─── ID generation ────────────────────────────────────────────────────────────

export const generateShiftId = (): string =>
  `shift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Type re-export for consumers of utils ────────────────────────────────────

export type { ScheduleView } from './WorkScheduleCalendar.types';
