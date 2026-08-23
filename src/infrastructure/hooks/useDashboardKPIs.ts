/**
 * useDashboardKPIs.ts
 *
 * Aggregates dashboard KPI values from real Supabase queries and computes a
 * period-over-period comparison (delta) for each metric. All aggregation lives
 * in TypeScript — there is no SQL/RPC for these projections (product decision).
 *
 * Calendar periods (Europe/Madrid local days, never UTC):
 *   - reservasHoy            → citas today           vs same weekday last week (%)
 *   - ingresosSemana         → revenue this week     vs previous calendar week (%)   [superadmin gate at page level]
 *   - ocupacionSemana        → occupancy % this week vs previous calendar week (pts)
 *   - reservasCompletadasMes → completadas this month vs previous calendar month (%)
 *
 * Boundary correctness: bucketing keys are LOCAL calendar days (toLocalDateKey),
 * fixing the prior UTC `split('T')[0]` bug for appointments near local midnight.
 * Calendar arithmetic uses date-part math (getWeekStart / stepPeriod), never
 * fixed millisecond addition, so DST week boundaries do not drift.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseDashboardAdapter } from '@infra/adapters/SupabaseDashboardAdapter';
import type { ICitaConPrecio } from '@infra/adapters/SupabaseDashboardAdapter';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import type { IDataPoint, IKPIComparison } from '@infra/components/ui/common/KPI/KPI.types';
import { toLocalDateKey, getWeekStart, stepPeriod, getTodayKey } from '@infra/utils/agenda.utils';
import type { TCentroId } from '@domain/types';

const dashboardAdapter = new SupabaseDashboardAdapter();
const salaAdapter = new SupabaseSalaAdapter();

// ── Domain constants ───────────────────────────────────────────────────────────

/** estados that do NOT count toward revenue or occupancy (matches code, not the schema doc). */
const NON_BILLABLE_ESTADOS: ReadonlySet<string> = new Set(['cancelada', 'no_presentado']);
/** Bookable hours per day (09:00–21:00) used as the occupancy denominator basis. */
const BOOKABLE_HOURS_PER_DAY = 12;
const DAYS_PER_WEEK = 7;

// ── Calendar-period model ───────────────────────────────────────────────────────

interface ICalendarPeriods {
  readonly todayKey: string;
  readonly lastWeekSameDayKey: string;
  /** 7 local-day keys (Mon..Sun) of the current calendar week. */
  readonly currentWeekKeys: readonly string[];
  /** 7 local-day keys (Mon..Sun) of the previous calendar week. */
  readonly previousWeekKeys: readonly string[];
  /** Local-day keys of the current calendar month (variable length). */
  readonly currentMonthKeys: ReadonlySet<string>;
  /** Local-day keys of the previous calendar month (variable length). */
  readonly previousMonthKeys: ReadonlySet<string>;
  /** Widest fetch window covering every sub-period above. */
  readonly fetchFrom: Date;
  readonly fetchTo: Date;
}

/** Local Date at 00:00:00.000 for a `YYYY-MM-DD` key. */
function startOfLocalDay(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** Local Date at 23:59:59.999 for a `YYYY-MM-DD` key. */
function endOfLocalDay(key: string): Date {
  return new Date(`${key}T23:59:59.999`);
}

/** Build the 7 consecutive local-day keys starting at a Monday key. */
function weekKeysFrom(mondayKey: string): readonly string[] {
  const start = startOfLocalDay(mondayKey);
  const keys: string[] = [];
  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(toLocalDateKey(d));
  }
  return keys;
}

/** Build the set of local-day keys for the calendar month containing `refKey`. */
function monthKeySet(refKey: string): ReadonlySet<string> {
  const ref = startOfLocalDay(refKey);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const keys = new Set<string>();
  // Day 0 of next month = last day of this month → gives the day count.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    keys.add(toLocalDateKey(new Date(year, month, day)));
  }
  return keys;
}

function buildCalendarPeriods(now: Date): ICalendarPeriods {
  const todayKey = toLocalDateKey(now);

  // Same weekday one week ago (local).
  const lastWeekSameDay = startOfLocalDay(todayKey);
  lastWeekSameDay.setDate(lastWeekSameDay.getDate() - DAYS_PER_WEEK);
  const lastWeekSameDayKey = toLocalDateKey(lastWeekSameDay);

  // Calendar weeks (Monday-first, ISO).
  const currentWeekStartKey = getWeekStart(todayKey);
  const previousWeekStartKey = stepPeriod(currentWeekStartKey, 'week', -1);
  const currentWeekKeys = weekKeysFrom(currentWeekStartKey);
  const previousWeekKeys = weekKeysFrom(previousWeekStartKey);

  // Calendar months.
  const previousMonthRefKey = stepPeriod(todayKey, 'month', -1);
  const currentMonthKeys = monthKeySet(todayKey);
  const previousMonthKeys = monthKeySet(previousMonthRefKey);

  // Widest window: earliest of {prev-month start, prev-week start, today-7d},
  // latest of {current-week end, today}. Computed (not assumed) per analyst §9 —
  // previous-month start can predate previous-week start, or vice versa.
  const previousMonthStart = startOfLocalDay(`${previousMonthRefKey.slice(0, 7)}-01`);
  const candidateStarts = [
    previousMonthStart,
    startOfLocalDay(previousWeekStartKey),
    lastWeekSameDay,
  ];
  const candidateEnds = [
    endOfLocalDay(currentWeekKeys[currentWeekKeys.length - 1] ?? todayKey),
    endOfLocalDay(todayKey),
  ];
  const fetchFrom = new Date(Math.min(...candidateStarts.map((d) => d.getTime())));
  const fetchTo = new Date(Math.max(...candidateEnds.map((d) => d.getTime())));

  return {
    todayKey,
    lastWeekSameDayKey,
    currentWeekKeys,
    previousWeekKeys,
    currentMonthKeys,
    previousMonthKeys,
    fetchFrom,
    fetchTo,
  };
}

// ── Aggregation primitives ───────────────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function isBillable(estado: string | null): boolean {
  return estado === null ? true : !NON_BILLABLE_ESTADOS.has(estado);
}

/** Count rows whose local day matches `dayKey`. */
function countOnDay(rows: readonly ICitaConPrecio[], dayKey: string): number {
  let count = 0;
  for (const row of rows) {
    if (row.fecha_inicio === null) continue;
    if (toLocalDateKey(new Date(row.fecha_inicio)) === dayKey) count++;
  }
  return count;
}

/** Count rows whose local day is in `dayKeys`, filtered by an optional estado predicate. */
function countInDays(
  rows: readonly ICitaConPrecio[],
  dayKeys: ReadonlySet<string>,
  estadoFilter?: (estado: string | null) => boolean,
): number {
  let count = 0;
  for (const row of rows) {
    if (row.fecha_inicio === null) continue;
    if (estadoFilter && !estadoFilter(row.estado)) continue;
    if (dayKeys.has(toLocalDateKey(new Date(row.fecha_inicio)))) count++;
  }
  return count;
}

/** Sum servicio prices (euros) over billable rows whose local day is in `dayKeys`. */
function revenueInDays(rows: readonly ICitaConPrecio[], dayKeys: ReadonlySet<string>): number {
  let total = 0;
  for (const row of rows) {
    if (row.fecha_inicio === null) continue;
    if (!isBillable(row.estado)) continue;
    if (dayKeys.has(toLocalDateKey(new Date(row.fecha_inicio)))) {
      total += row.servicios?.precio ?? 0;
    }
  }
  return round1(total);
}

/** Occupancy % over a week's worth of billable citas. denominator clamped ≥1. */
function weekOccupancy(
  rows: readonly ICitaConPrecio[],
  weekKeys: ReadonlySet<string>,
  salaCount: number,
): number {
  const booked = countInDays(rows, weekKeys, isBillable);
  const denominator = Math.max(salaCount * BOOKABLE_HOURS_PER_DAY * DAYS_PER_WEEK, 1);
  return Math.min(Math.round((booked / denominator) * 100), 100);
}

// ── Comparison builders ──────────────────────────────────────────────────────────

function trendOf(current: number, previous: number): IKPIComparison['trend'] {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
}

/**
 * Percent-change comparison (KPIs 1, 2, 4). When the baseline is 0 the delta is
 * suppressed (em-dash) — a percentage against 0 would be infinite/misleading.
 */
function buildPercentComparison(current: number, previous: number, label: string): IKPIComparison {
  if (previous === 0) {
    return { previousValue: 0, percentChange: 0, trend: 'neutral', label, suppressed: true };
  }
  return {
    previousValue: previous,
    percentChange: round1(((current - previous) / previous) * 100),
    trend: trendOf(current, previous),
    label,
  };
}

/**
 * Point-delta comparison (KPI 3 occupancy). The delta is `current - previous`
 * percentage points — no divide-by-zero is possible, so it is never suppressed.
 */
function buildPointsComparison(current: number, previous: number, label: string): IKPIComparison {
  return {
    previousValue: previous,
    percentChange: round1(current - previous),
    trend: trendOf(current, previous),
    label,
    deltaUnit: 'pts',
  };
}

// ── Sparkline builders (7 local-day points) ──────────────────────────────────────

function reservasSparkline(
  rows: readonly ICitaConPrecio[],
  weekKeys: readonly string[],
): readonly IDataPoint[] {
  return weekKeys.map((key) => ({
    timestamp: startOfLocalDay(key).getTime(),
    value: countOnDay(rows, key),
  }));
}

function ingresosSparkline(
  rows: readonly ICitaConPrecio[],
  weekKeys: readonly string[],
): readonly IDataPoint[] {
  return weekKeys.map((key) => ({
    timestamp: startOfLocalDay(key).getTime(),
    value: revenueInDays(rows, new Set([key])),
  }));
}

function ocupacionSparkline(
  rows: readonly ICitaConPrecio[],
  weekKeys: readonly string[],
  salaCount: number,
): readonly IDataPoint[] {
  const dayDenominator = Math.max(salaCount * BOOKABLE_HOURS_PER_DAY, 1);
  return weekKeys.map((key) => {
    const booked = countInDays(rows, new Set([key]), isBillable);
    return {
      timestamp: startOfLocalDay(key).getTime(),
      value: Math.min(Math.round((booked / dayDenominator) * 100), 100),
    };
  });
}

// ── Return shape ──────────────────────────────────────────────────────────────

export interface IKPIMetric {
  readonly value: number;
  readonly comparison?: IKPIComparison;
  readonly sparklineData: readonly IDataPoint[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export interface IUseDashboardKPIsResult {
  readonly reservasHoy: IKPIMetric;
  readonly ingresosSemana: IKPIMetric;
  readonly ocupacionSemana: IKPIMetric;
  readonly reservasCompletadasMes: IKPIMetric;
}

// ── i18n labels passed in (hooks must not call t) ────────────────────────────────

export interface IDashboardKPILabels {
  readonly vsSameDayLastWeek: string;
  readonly vsPreviousWeek: string;
  readonly vsLastMonth: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useDashboardKPIs = (
  centroId: TCentroId | null,
  labels: IDashboardKPILabels,
): IUseDashboardKPIsResult => {
  const periods = buildCalendarPeriods(new Date());
  const todayKey = getTodayKey();
  // Month identity discriminator so a day/month rollover invalidates the query.
  const monthKey = todayKey.slice(0, 7);
  const weekStartKey = getWeekStart(todayKey);

  const {
    data: citasData,
    isLoading: citasLoading,
    isError: citasError,
  } = useQuery({
    queryKey: ['dashboard', 'kpis', 'window', centroId, monthKey, weekStartKey, todayKey],
    queryFn: async () => {
      if (centroId === null) return [];
      return dashboardAdapter.fetchCitasForKpiWindow(centroId, periods.fetchFrom, periods.fetchTo);
    },
    enabled: centroId !== null,
    staleTime: 60_000,
  });

  const {
    data: salasData,
    isLoading: salasLoading,
    isError: salasError,
  } = useQuery({
    queryKey: ['dashboard', 'kpis', 'salas-activas', centroId],
    queryFn: async () => {
      if (centroId === null) return [];
      return salaAdapter.findActivasByCentro(centroId);
    },
    enabled: centroId !== null,
    staleTime: 300_000, // 5 min — sala count rarely changes
  });

  const rows = citasData ?? [];
  const salas = salasData ?? [];
  const salaCount = salas.length;

  const isLoading = citasLoading || salasLoading;
  const isError = citasError || salasError;

  // ── KPI 1 — reservasHoy (all estados) ──────────────────────────────────────
  const reservasHoyValue = countOnDay(rows, periods.todayKey);
  const reservasHoyPrev = countOnDay(rows, periods.lastWeekSameDayKey);

  // ── KPI 2 — ingresosSemana (euros, billable only) ──────────────────────────
  const currentWeekSet = new Set(periods.currentWeekKeys);
  const previousWeekSet = new Set(periods.previousWeekKeys);
  const ingresosValue = revenueInDays(rows, currentWeekSet);
  const ingresosPrev = revenueInDays(rows, previousWeekSet);

  // ── KPI 3 — ocupacionSemana (pts delta) ─────────────────────────────────────
  const ocupacionValue = weekOccupancy(rows, currentWeekSet, salaCount);
  const ocupacionPrev = weekOccupancy(rows, previousWeekSet, salaCount);

  // ── KPI 4 — reservasCompletadasMes ──────────────────────────────────────────
  const isCompletada = (estado: string | null): boolean => estado === 'completada';
  const completadasValue = countInDays(rows, periods.currentMonthKeys, isCompletada);
  const completadasPrev = countInDays(rows, periods.previousMonthKeys, isCompletada);

  return {
    reservasHoy: {
      value: reservasHoyValue,
      comparison: buildPercentComparison(
        reservasHoyValue,
        reservasHoyPrev,
        labels.vsSameDayLastWeek,
      ),
      sparklineData: reservasSparkline(rows, periods.currentWeekKeys),
      isLoading,
      isError,
    },
    ingresosSemana: {
      value: ingresosValue,
      comparison: buildPercentComparison(ingresosValue, ingresosPrev, labels.vsPreviousWeek),
      sparklineData: ingresosSparkline(rows, periods.currentWeekKeys),
      isLoading,
      isError,
    },
    ocupacionSemana: {
      value: ocupacionValue,
      comparison: buildPointsComparison(ocupacionValue, ocupacionPrev, labels.vsPreviousWeek),
      sparklineData: ocupacionSparkline(rows, periods.currentWeekKeys, salaCount),
      isLoading,
      isError,
    },
    reservasCompletadasMes: {
      value: completadasValue,
      comparison: buildPercentComparison(completadasValue, completadasPrev, labels.vsLastMonth),
      // Sparkline intentionally omitted: a fixed 7-point line cannot represent a
      // variable-length month (analyst §8). Empty array → card hides the slot.
      sparklineData: [],
      isLoading,
      isError,
    },
  };
};
