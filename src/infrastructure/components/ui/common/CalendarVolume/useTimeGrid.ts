import type {
  ITimeSlot,
  IGridCell,
  IDayColumn,
  IVolumeData,
  TCalendarView,
} from './CalendarVolume.types';

// ─── Static maps (module-level, no allocation per render) ────────────────────
// Keyed by JS getDay() index (0=Sunday … 6=Saturday). These are the English
// fallbacks; the component injects localized maps via dayShortLabels/dayFullLabels.

const DAY_SHORT: Readonly<Record<number, string>> = {
  0: 'S',
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'T',
  5: 'F',
  6: 'S',
};

const DAY_FULL: Readonly<Record<number, string>> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

// ─── Pure helpers (stable, no closure deps) ──────────────────────────────────

/** 24-hour label, e.g. 9 → "09:00", 21 → "21:00". Locale-neutral. */
export const formatHourLabel = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

export const toISODateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Returns the 7 days of the week containing `referenceDate`, Monday-first. */
export const getWeekDays = (referenceDate: Date): Date[] => {
  const d = new Date(referenceDate);
  // Monday-first: JS getDay() is 0=Sun..6=Sat → shift so Monday leads the week.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface IUseTimeGridParams {
  view: TCalendarView;
  startHour: number;
  endHour: number;
  selectedDate: Date;
  data: IVolumeData[];
  /** Localized short day labels keyed by JS day index (0=Sun..6=Sat). Defaults to English. */
  dayShortLabels?: Readonly<Record<number, string>>;
  /** Localized full day labels keyed by JS day index (0=Sun..6=Sat). Defaults to English. */
  dayFullLabels?: Readonly<Record<number, string>>;
}

interface IUseTimeGridResult {
  timeSlots: ITimeSlot[];
  days: IDayColumn[];
  cellMap: ReadonlyMap<string, IGridCell>;
  maxValue: number;
}

export const useTimeGrid = ({
  view,
  startHour,
  endHour,
  selectedDate,
  data,
  dayShortLabels,
  dayFullLabels,
}: IUseTimeGridParams): IUseTimeGridResult => {
  const shortLabels = dayShortLabels ?? DAY_SHORT;
  const fullLabels = dayFullLabels ?? DAY_FULL;

  // ── 1. Time slots ─────────────────────────────────────────────────────────
  const count = Math.max(0, endHour - startHour);
  const timeSlots: ITimeSlot[] = Array.from({ length: count }, (_, i) => {
    const hour = startHour + i;
    return { hour, label: formatHourLabel(hour) };
  });

  // ── 2. Day columns ────────────────────────────────────────────────────────
  const days: IDayColumn[] =
    view === 'day'
      ? (() => {
          const key = toISODateKey(selectedDate);
          const dayIdx = selectedDate.getDay();
          return [
            {
              key,
              label: shortLabels[dayIdx],
              fullLabel: fullLabels[dayIdx],
              date: selectedDate,
            },
          ];
        })()
      : getWeekDays(selectedDate).map((date) => {
          const dayIdx = date.getDay();
          return {
            key: toISODateKey(date),
            label: shortLabels[dayIdx],
            fullLabel: fullLabels[dayIdx],
            date,
          };
        });

  // ── 3. Max value (for normalisation) ──────────────────────────────────────
  let maxValue = data.length ? 1 : 12;
  for (const d of data) if (d.value > maxValue) maxValue = d.value;

  // ── 4. O(1) cell lookup map ───────────────────────────────────────────────
  const dataIndex = new Map<string, number>();
  for (const d of data) {
    dataIndex.set(`${d.day}__${d.hour}`, d.value);
  }

  const map = new Map<string, IGridCell>();
  const dayKeys = new Set(days.map((d) => d.key));

  for (const { key, fullLabel } of days) {
    if (!dayKeys.has(key)) continue;
    for (const { hour } of timeSlots) {
      const mapKey = `${key}__${hour}`;
      const value = dataIndex.get(mapKey) ?? 0;
      const cell: IGridCell = {
        day: key,
        dayLabel: fullLabel,
        hour,
        value,
        intensity: maxValue > 0 ? value / maxValue : 0,
      };
      map.set(mapKey, cell);
    }
  }

  const cellMap: ReadonlyMap<string, IGridCell> = map;

  return { timeSlots, days, cellMap, maxValue };
};
