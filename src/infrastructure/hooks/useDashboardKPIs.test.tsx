/**
 * useDashboardKPIs.test.tsx
 *
 * Behavioural tests for the dashboard KPI aggregation hook. The hook fetches a
 * single superset window of citas (mocked SupabaseDashboardAdapter) plus the
 * active sala list (mocked SupabaseSalaAdapter) and computes four KPIs with a
 * period-over-period comparison each:
 *
 *   1. reservasHoy            — count today        vs same weekday last week (%)
 *   2. ingresosSemana         — revenue this week  vs previous calendar week (%)
 *   3. ocupacionSemana        — occupancy % week   vs previous week (pts delta)
 *   4. reservasCompletadasMes — completadas month  vs previous month (%)
 *
 * Mock strategy (mirrors useCentroDetail.test.tsx): both adapters are mocked as
 * class constructors so `new XAdapter()` at module-load time works, and the real
 * domain date math (agenda.utils) runs unmocked.
 *
 * Time control: the hook reads `new Date()` internally to build calendar
 * periods, so each suite pins the system clock with vi.setSystemTime to a fixed
 * reference instant. Vitest TZ is pinned to Europe/Madrid (vite.config.ts), so
 * local-day bucketing (toLocalDateKey) is deterministic and exercises the
 * positive-UTC-offset path the production bug fix targets.
 *
 * Reference instant: Wednesday 2026-06-17 14:00 local (Europe/Madrid).
 *   - today                = 2026-06-17
 *   - same weekday -1 week  = 2026-06-10
 *   - current week (Mon..Sun) = 2026-06-15 .. 2026-06-21
 *   - previous week         = 2026-06-08 .. 2026-06-14
 *   - current month         = June 2026
 *   - previous month        = May 2026
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ISala } from '@domain/models';

// ── Adapter mocks ─────────────────────────────────────────────────────────────

const mockFetchCitasForKpiWindow = vi.fn();
const mockFindActivasByCentro = vi.fn();

vi.mock('@infra/adapters/SupabaseDashboardAdapter', () => ({
  SupabaseDashboardAdapter: class {
    fetchCitasForKpiWindow(...args: unknown[]): Promise<unknown> {
      return mockFetchCitasForKpiWindow(...args) as Promise<unknown>;
    }
  },
}));

vi.mock('@infra/adapters/SupabaseSalaAdapter', () => ({
  SupabaseSalaAdapter: class {
    findActivasByCentro(...args: unknown[]): Promise<unknown> {
      return mockFindActivasByCentro(...args) as Promise<unknown>;
    }
  },
}));

// ── Import after mocks ──────────────────────────────────────────────────────

import { useDashboardKPIs } from './useDashboardKPIs';
import type { ICitaConPrecio } from '@infra/adapters/SupabaseDashboardAdapter';

// ── Constants ─────────────────────────────────────────────────────────────────

// Wednesday 2026-06-17 14:00 in Europe/Madrid (UTC+2 in June → 12:00Z).
const REFERENCE_INSTANT = new Date('2026-06-17T12:00:00.000Z');

const LABELS = {
  vsSameDayLastWeek: 'vs same day last week',
  vsPreviousWeek: 'vs previous week',
  vsLastMonth: 'vs last month',
} as const;

const BOOKABLE_HOURS_PER_DAY = 12;
const DAYS_PER_WEEK = 7;

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

let citaIdSeq = 1;

/**
 * Build an ICitaConPrecio row. `localDay` is a YYYY-MM-DD key; the timestamp is
 * pinned to 10:00 LOCAL via the `T10:00:00` suffix so the row buckets onto that
 * exact calendar day regardless of UTC offset.
 */
function makeCita(localDay: string, estado: string | null, precio: number | null): ICitaConPrecio {
  return {
    id: citaIdSeq++,
    cliente_id: 1,
    fecha_inicio: `${localDay}T10:00:00`,
    estado,
    servicios: precio === null ? null : { precio },
  };
}

function makeSalas(count: number): ISala[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    centroId: 1,
    nombre: `Sala ${i + 1}`,
    capacidad: 1,
    activa: true,
    descripcion: null,
  }));
}

/** Render the hook with given citas + sala count and wait for both queries to settle. */
async function renderKpis(citas: ICitaConPrecio[], salaCount: number) {
  mockFetchCitasForKpiWindow.mockResolvedValue(citas);
  mockFindActivasByCentro.mockResolvedValue(makeSalas(salaCount));
  const view = renderHook(() => useDashboardKPIs(1, LABELS), { wrapper: createWrapper() });
  await waitFor(() => {
    expect(view.result.current.reservasHoy.isLoading).toBe(false);
  });
  return view;
}

// ════════════════════════════════════════════════════════════════════════════
// Time setup — pin the clock for every test
// ════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  citaIdSeq = 1;
  vi.clearAllMocks();
  // Fake ONLY Date — leave setTimeout/queueMicrotask real so React Query's
  // internals and Testing Library's waitFor polling are not stalled (fully
  // faking timers deadlocks waitFor against pending query promises).
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(REFERENCE_INSTANT);
});

afterEach(() => {
  vi.useRealTimers();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Disabled state (centroId null)
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — disabled when centroId is null', () => {
  it('does not call either adapter when centroId is null', async () => {
    mockFetchCitasForKpiWindow.mockResolvedValue([]);
    mockFindActivasByCentro.mockResolvedValue([]);

    const { result } = renderHook(() => useDashboardKPIs(null, LABELS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.reservasHoy.isLoading).toBe(false);
    });
    expect(mockFetchCitasForKpiWindow).not.toHaveBeenCalled();
    expect(mockFindActivasByCentro).not.toHaveBeenCalled();
  });

  it('returns zero values and empty sparklines when centroId is null', async () => {
    const { result } = renderHook(() => useDashboardKPIs(null, LABELS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.reservasHoy.isLoading).toBe(false);
    });
    expect(result.current.reservasHoy.value).toBe(0);
    expect(result.current.ingresosSemana.value).toBe(0);
    expect(result.current.ocupacionSemana.value).toBe(0);
    expect(result.current.reservasCompletadasMes.value).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Adapter wiring
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — adapter wiring', () => {
  it('passes the centroId and a date window covering the previous month start', async () => {
    await renderKpis([], 1);

    expect(mockFetchCitasForKpiWindow).toHaveBeenCalledTimes(1);
    const [centroId, from, to] = mockFetchCitasForKpiWindow.mock.calls[0] as [number, Date, Date];
    expect(centroId).toBe(1);
    // Window must start no later than 2026-05-01 (previous calendar month start).
    expect(from.getTime()).toBeLessThanOrEqual(new Date('2026-05-01T00:00:00').getTime());
    // Window must end no earlier than today (2026-06-17) — current week end is later.
    expect(to.getTime()).toBeGreaterThanOrEqual(new Date('2026-06-17T00:00:00').getTime());
    expect(mockFindActivasByCentro).toHaveBeenCalledWith(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. KPI 1 — reservasHoy (% vs same weekday last week, all estados)
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — reservasHoy', () => {
  it('counts every cita on today regardless of estado', async () => {
    const { result } = await renderKpis(
      [
        makeCita('2026-06-17', 'pendiente', 50),
        makeCita('2026-06-17', 'confirmada', 50),
        makeCita('2026-06-17', 'cancelada', 50), // counts: KPI 1 ignores estado
      ],
      2,
    );
    expect(result.current.reservasHoy.value).toBe(3);
  });

  it('computes percent change vs the same weekday one week ago', async () => {
    // today = 4, last-week-same-day (2026-06-10) = 2 → (4-2)/2 = +100%
    const { result } = await renderKpis(
      [
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-10', 'pendiente', 0),
        makeCita('2026-06-10', 'pendiente', 0),
      ],
      1,
    );
    const cmp = result.current.reservasHoy.comparison;
    expect(result.current.reservasHoy.value).toBe(4);
    expect(cmp?.previousValue).toBe(2);
    expect(cmp?.percentChange).toBe(100);
    expect(cmp?.trend).toBe('up');
    expect(cmp?.suppressed).toBeUndefined();
    expect(cmp?.label).toBe(LABELS.vsSameDayLastWeek);
  });

  it('reports a down trend with a negative percent when today is lower', async () => {
    // today = 1, last week = 4 → (1-4)/4 = -75%
    const { result } = await renderKpis(
      [
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-10', 'pendiente', 0),
        makeCita('2026-06-10', 'pendiente', 0),
        makeCita('2026-06-10', 'pendiente', 0),
        makeCita('2026-06-10', 'pendiente', 0),
      ],
      1,
    );
    const cmp = result.current.reservasHoy.comparison;
    expect(cmp?.percentChange).toBe(-75);
    expect(cmp?.trend).toBe('down');
  });

  it('suppresses the delta when the baseline (last week) is zero', async () => {
    // today = 3, last week = 0 → percentage undefined → suppressed
    const { result } = await renderKpis(
      [
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-17', 'pendiente', 0),
        makeCita('2026-06-17', 'pendiente', 0),
      ],
      1,
    );
    const cmp = result.current.reservasHoy.comparison;
    expect(result.current.reservasHoy.value).toBe(3);
    expect(cmp?.suppressed).toBe(true);
    expect(cmp?.percentChange).toBe(0);
    expect(cmp?.previousValue).toBe(0);
    expect(cmp?.trend).toBe('neutral');
    // Label still present so the user keeps period context.
    expect(cmp?.label).toBe(LABELS.vsSameDayLastWeek);
  });

  it('exposes a 7-point sparkline for the current week (Mon..Sun)', async () => {
    const { result } = await renderKpis([makeCita('2026-06-17', 'pendiente', 0)], 1);
    const spark = result.current.reservasHoy.sparklineData;
    expect(spark).toHaveLength(DAYS_PER_WEEK);
    // Wednesday is index 2 in a Monday-first week → that point has value 1.
    expect(spark[2].value).toBe(1);
    // First point is Monday 2026-06-15 at local midnight.
    expect(spark[0].timestamp).toBe(new Date('2026-06-15T00:00:00').getTime());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. KPI 2 — ingresosSemana (% WoW, billable only)
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — ingresosSemana', () => {
  it('sums servicio prices over billable citas in the current week', async () => {
    const { result } = await renderKpis(
      [
        makeCita('2026-06-15', 'confirmada', 40),
        makeCita('2026-06-17', 'completada', 60),
        makeCita('2026-06-21', 'pendiente', 25),
      ],
      1,
    );
    expect(result.current.ingresosSemana.value).toBe(125);
  });

  it('excludes cancelada and no_presentado from revenue', async () => {
    const { result } = await renderKpis(
      [
        makeCita('2026-06-17', 'confirmada', 100),
        makeCita('2026-06-17', 'cancelada', 999),
        makeCita('2026-06-17', 'no_presentado', 999),
      ],
      1,
    );
    expect(result.current.ingresosSemana.value).toBe(100);
  });

  it('treats a null servicio price as 0', async () => {
    const { result } = await renderKpis(
      [makeCita('2026-06-17', 'confirmada', null), makeCita('2026-06-17', 'confirmada', 30)],
      1,
    );
    expect(result.current.ingresosSemana.value).toBe(30);
  });

  it('computes WoW percent change against the previous calendar week', async () => {
    // current week = 200, previous week = 100 → +100%
    const { result } = await renderKpis(
      [makeCita('2026-06-17', 'confirmada', 200), makeCita('2026-06-10', 'confirmada', 100)],
      1,
    );
    const cmp = result.current.ingresosSemana.comparison;
    expect(result.current.ingresosSemana.value).toBe(200);
    expect(cmp?.previousValue).toBe(100);
    expect(cmp?.percentChange).toBe(100);
    expect(cmp?.trend).toBe('up');
    expect(cmp?.label).toBe(LABELS.vsPreviousWeek);
  });

  it('suppresses the delta when previous-week revenue is zero', async () => {
    const { result } = await renderKpis([makeCita('2026-06-17', 'confirmada', 80)], 1);
    const cmp = result.current.ingresosSemana.comparison;
    expect(cmp?.suppressed).toBe(true);
    expect(cmp?.percentChange).toBe(0);
  });

  it('rounds revenue to one decimal place', async () => {
    const { result } = await renderKpis(
      [makeCita('2026-06-17', 'confirmada', 10.05), makeCita('2026-06-17', 'confirmada', 10.06)],
      1,
    );
    // 20.11 → round1 → 20.1
    expect(result.current.ingresosSemana.value).toBe(20.1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. KPI 3 — ocupacionSemana (pts delta, never suppressed)
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — ocupacionSemana', () => {
  it('computes occupancy as billable citas / (salas × 12h × 7d) × 100', async () => {
    // 1 sala → denominator = 1*12*7 = 84. 21 billable citas → 25%.
    const citas = Array.from({ length: 21 }, () => makeCita('2026-06-17', 'confirmada', 0));
    const { result } = await renderKpis(citas, 1);
    expect(result.current.ocupacionSemana.value).toBe(25);
  });

  it('clamps occupancy at 100 when bookings exceed capacity', async () => {
    const citas = Array.from({ length: 500 }, () => makeCita('2026-06-17', 'confirmada', 0));
    const { result } = await renderKpis(citas, 1);
    expect(result.current.ocupacionSemana.value).toBe(100);
  });

  it('uses a pts delta unit and never suppresses (no divide-by-zero)', async () => {
    // current week occupancy > 0, previous week = 0 → delta is current-0 in pts.
    const citas = Array.from({ length: 21 }, () => makeCita('2026-06-17', 'confirmada', 0));
    const { result } = await renderKpis(citas, 1);
    const cmp = result.current.ocupacionSemana.comparison;
    expect(cmp?.deltaUnit).toBe('pts');
    expect(cmp?.suppressed).toBeUndefined();
    expect(cmp?.previousValue).toBe(0);
    expect(cmp?.percentChange).toBe(25); // 25 - 0 pts
    expect(cmp?.trend).toBe('up');
    expect(cmp?.label).toBe(LABELS.vsPreviousWeek);
  });

  it('computes a points delta between current and previous week', async () => {
    // current: 21 citas → 25%; previous: 42 citas → 50%; delta = 25 - 50 = -25 pts
    const current = Array.from({ length: 21 }, () => makeCita('2026-06-17', 'confirmada', 0));
    const previous = Array.from({ length: 42 }, () => makeCita('2026-06-10', 'confirmada', 0));
    const { result } = await renderKpis([...current, ...previous], 1);
    const cmp = result.current.ocupacionSemana.comparison;
    expect(result.current.ocupacionSemana.value).toBe(25);
    expect(cmp?.previousValue).toBe(50);
    expect(cmp?.percentChange).toBe(-25);
    expect(cmp?.trend).toBe('down');
  });

  it('clamps the denominator to ≥1 when salaCount is 0 (no divide-by-zero)', async () => {
    // salaCount 0 → denominator clamped to 1 → any booking pins occupancy to 100.
    const { result } = await renderKpis([makeCita('2026-06-17', 'confirmada', 0)], 0);
    expect(result.current.ocupacionSemana.value).toBe(100);
    expect(Number.isFinite(result.current.ocupacionSemana.value)).toBe(true);
  });

  it('reports 0 occupancy when there are no citas', async () => {
    const { result } = await renderKpis([], 3);
    expect(result.current.ocupacionSemana.value).toBe(0);
    expect(result.current.ocupacionSemana.comparison?.percentChange).toBe(0);
    expect(result.current.ocupacionSemana.comparison?.trend).toBe('neutral');
  });

  it('excludes cancelada/no_presentado from the occupancy numerator', async () => {
    const denominator = 1 * BOOKABLE_HOURS_PER_DAY * DAYS_PER_WEEK; // 84
    expect(denominator).toBe(84);
    const { result } = await renderKpis(
      [
        ...Array.from({ length: 21 }, () => makeCita('2026-06-17', 'confirmada', 0)),
        ...Array.from({ length: 50 }, () => makeCita('2026-06-17', 'cancelada', 0)),
      ],
      1,
    );
    // Only the 21 billable count → 25%, the cancelled ones do not inflate it.
    expect(result.current.ocupacionSemana.value).toBe(25);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. KPI 4 — reservasCompletadasMes (% MoM, completada only)
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — reservasCompletadasMes', () => {
  it('counts only completada citas in the current month', async () => {
    const { result } = await renderKpis(
      [
        makeCita('2026-06-03', 'completada', 0),
        makeCita('2026-06-20', 'completada', 0),
        makeCita('2026-06-20', 'confirmada', 0), // not completada → excluded
      ],
      1,
    );
    expect(result.current.reservasCompletadasMes.value).toBe(2);
  });

  it('computes MoM percent change against the previous calendar month', async () => {
    // June completadas = 3, May completadas = 6 → (3-6)/6 = -50%
    const { result } = await renderKpis(
      [
        makeCita('2026-06-05', 'completada', 0),
        makeCita('2026-06-10', 'completada', 0),
        makeCita('2026-06-15', 'completada', 0),
        makeCita('2026-05-05', 'completada', 0),
        makeCita('2026-05-10', 'completada', 0),
        makeCita('2026-05-15', 'completada', 0),
        makeCita('2026-05-20', 'completada', 0),
        makeCita('2026-05-25', 'completada', 0),
        makeCita('2026-05-28', 'completada', 0),
      ],
      1,
    );
    const cmp = result.current.reservasCompletadasMes.comparison;
    expect(result.current.reservasCompletadasMes.value).toBe(3);
    expect(cmp?.previousValue).toBe(6);
    expect(cmp?.percentChange).toBe(-50);
    expect(cmp?.trend).toBe('down');
    expect(cmp?.label).toBe(LABELS.vsLastMonth);
  });

  it('suppresses the delta when previous month had zero completadas', async () => {
    const { result } = await renderKpis([makeCita('2026-06-05', 'completada', 0)], 1);
    const cmp = result.current.reservasCompletadasMes.comparison;
    expect(cmp?.suppressed).toBe(true);
    expect(cmp?.percentChange).toBe(0);
  });

  it('omits the sparkline (variable-length month cannot map to 7 points)', async () => {
    const { result } = await renderKpis([makeCita('2026-06-05', 'completada', 0)], 1);
    expect(result.current.reservasCompletadasMes.sparklineData).toEqual([]);
  });

  it('does not leak previous-month completadas into the current-month count', async () => {
    const { result } = await renderKpis(
      [makeCita('2026-05-31', 'completada', 0), makeCita('2026-06-01', 'completada', 0)],
      1,
    );
    // Only the June 1 cita counts toward the current month.
    expect(result.current.reservasCompletadasMes.value).toBe(1);
    expect(result.current.reservasCompletadasMes.comparison?.previousValue).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Empty data + loading/error propagation
// ════════════════════════════════════════════════════════════════════════════

describe('useDashboardKPIs — empty data', () => {
  it('returns all-zero metrics with neutral suppressed comparisons when there is no data', async () => {
    const { result } = await renderKpis([], 2);

    for (const metric of [
      result.current.reservasHoy,
      result.current.ingresosSemana,
      result.current.reservasCompletadasMes,
    ]) {
      expect(metric.value).toBe(0);
      expect(metric.comparison?.suppressed).toBe(true);
      expect(metric.comparison?.trend).toBe('neutral');
    }
    // Occupancy is a pts metric → not suppressed even at zero.
    expect(result.current.ocupacionSemana.value).toBe(0);
    expect(result.current.ocupacionSemana.comparison?.suppressed).toBeUndefined();
  });
});

describe('useDashboardKPIs — loading & error propagation', () => {
  it('marks every metric isError when the citas query fails', async () => {
    mockFetchCitasForKpiWindow.mockRejectedValue(new Error('citas network down'));
    mockFindActivasByCentro.mockResolvedValue(makeSalas(1));

    const { result } = renderHook(() => useDashboardKPIs(1, LABELS), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.reservasHoy.isError).toBe(true);
    });
    expect(result.current.ingresosSemana.isError).toBe(true);
    expect(result.current.ocupacionSemana.isError).toBe(true);
    expect(result.current.reservasCompletadasMes.isError).toBe(true);
  });

  it('marks every metric isError when the salas query fails', async () => {
    mockFetchCitasForKpiWindow.mockResolvedValue([]);
    mockFindActivasByCentro.mockRejectedValue(new Error('salas network down'));

    const { result } = renderHook(() => useDashboardKPIs(1, LABELS), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.ocupacionSemana.isError).toBe(true);
    });
    expect(result.current.reservasHoy.isError).toBe(true);
  });
});
