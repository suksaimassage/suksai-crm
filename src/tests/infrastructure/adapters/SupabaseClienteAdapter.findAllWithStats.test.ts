/**
 * SupabaseClienteAdapter.findAllWithStats.test.ts
 *
 * Unit tests for the two new aggregate methods added to SupabaseClienteAdapter:
 *   - findAllWithStats(params)  — returns IPaginatedResult<IClienteWithStats>
 *   - findClienteKPI()          — returns IClientesKPIData
 *
 * The supabase singleton is mocked at the module level using the shared
 * buildSupabaseMock helper (same pattern as SupabaseClienteAdapter.test.ts).
 *
 * Shape notes:
 *   - clientes page query:  checks `pageResult.error !== null` → needs `{ data, error, count }`
 *     (range() is mocked to resolve directly via mockResolvedValue)
 *   - citas Q1/Q2/Q3:       checks `q?.error !== null`    → needs `{ data, error }`
 *   - Q4 (view):            checks `q4.error !== null`    → needs `{ data, error }`
 *     shape: `{ cliente_id, ultima_visita }` (server-side MAX via clientes_ultima_visita view)
 *   - KPI count queries:    checks `kpiQ1.error !== null` → needs `{ data, error, count }`
 *   - KPI Q3 (RPC):         supabase.rpc('kpi_recurrencia_90d') → mocked on mockSupabase.rpc
 *                           returns `{ data: number, error: null }` (scalar 0-100)
 *
 * findAllWithStats queue order (consumed by `then` on the shared mockChain):
 *   1. Q1 — last-180-days citas (for frecuenciaVisitas)
 *   2. Q2 — year-to-date citas (for totalVisitasAnio)
 *   3. Q3 — last-12-months citas with servicio_id (for ritualFavorito)
 *   4. Q4 — clientes_ultima_visita view (ultima_visita per client — server-side MAX)
 *   5. servicios lookup (conditional, only when winningServicioIds.size > 0)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { IClientesRow } from '@infra/adapters/database.types';

// ── Shared mock infrastructure ────────────────────────────────────────────────

const { mockSupabase, mockChain, mockRpc } = await import('./supabase.mock').then((m) =>
  m.buildSupabaseMock(),
);

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseClienteAdapter } = await import('@infra/adapters/SupabaseClienteAdapter');

// ── Resolution queue ──────────────────────────────────────────────────────────
// findAllWithStats and findClienteKPI use Promise.all which calls `await chain`
// multiple times (once per from() call). A single mockChain can only resolve to
// one value unless we implement a queue.

let resolutionQueue: unknown[] = [];

function pushResolution(value: unknown) {
  resolutionQueue.push(value);
}

function buildQueuedThen() {
  let callIndex = 0;
  return vi.fn().mockImplementation((resolve: (v: unknown) => unknown) => {
    const value = resolutionQueue[callIndex] ?? null;
    callIndex++;
    return Promise.resolve(value).then(resolve);
  });
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const baseClienteRow: IClientesRow = {
  id: 1,
  nombre: 'María',
  apellidos: 'García',
  email: 'maria@example.com',
  telefono: '612345678',
  observaciones: null,
  created_at: '2023-01-01T00:00:00Z',
};

// Shape helpers
function successPage<T>(data: T[], count: number | null = null) {
  return { success: true, data, error: null, count };
}

function errorPage(message: string) {
  return { success: false, data: null, error: { message }, count: null };
}

function okCitas<T>(data: T[]) {
  return { data, error: null };
}

function errCitas(message: string) {
  return { data: null, error: { message } };
}

function okCount(count: number) {
  return { data: null, error: null, count };
}

// ── Helper: reset mocks before each test ──────────────────────────────────────

function resetMocks() {
  vi.clearAllMocks();
  resolutionQueue = [];

  // Reset rpc mock — tests that need kpiQ3 via RPC configure it explicitly
  mockRpc.mockResolvedValue({ data: 0, error: null });

  // Restore default chain behaviour (all methods return chain itself)
  const chainMethods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'gte',
    'lte',
    'lt',
    'not',
    'range',
    'order',
    'insert',
    'update',
    'delete',
    'upsert',
  ] as const;

  for (const m of chainMethods) {
    mockChain[m].mockReturnValue(mockChain);
  }

  mockSupabase.from.mockReturnValue(mockChain);

  // Override `then` to drain resolutionQueue in order
  mockChain.then = buildQueuedThen();
}

// ── Helper: set up for findAllWithStats ───────────────────────────────────────
// Queue order (consumed in Promise.all evaluation order):
//   1. Q1 — 180-day citas (frecuenciaVisitas)
//   2. Q2 — YTD citas     (totalVisitasAnio)
//   3. Q3 — 12-month citas with servicio_id (ritualFavorito)
//   4. Q4 — clientes_ultima_visita view (ultima_visita per client — server-side MAX)
//   5. servicios lookup  (only when winningServicioIds.size > 0)

function setupFindAllWithStats(
  pageData: IClientesRow[],
  pageTotal: number,
  q1Data: { cliente_id: number; fecha_inicio: string | null }[],
  q2Data: { cliente_id: number }[],
  q3Data: { cliente_id: number; servicio_id: number | null }[],
  /**
   * serviciosData: rows shaped as { id, tipo_servicio } — maps servicio_id to the
   * tipo_servicio FK (matches the production servicios lookup).
   */
  serviciosData?: { id: number; tipo_servicio: number }[],
  overrideQ1?: unknown,
  /**
   * q4Data: rows from the clientes_ultima_visita view.
   * Shape: { cliente_id, ultima_visita } — the DB already returns the MAX per client.
   * Defaults to [] when not provided (no view rows = ultimaVisita null).
   */
  q4Data?: { cliente_id: number; ultima_visita: string | null }[],
  /**
   * tipoServiciosData: rows shaped as { id, nombre } — maps tipo_servicio id to
   * its display name (matches the production tipo_servicios lookup).
   * Only queued when serviciosData is provided and non-empty.
   */
  tipoServiciosData?: { id: number; nombre: string }[],
) {
  // range() is the terminal for the page query — mock it to resolve directly
  mockChain.range.mockResolvedValue(successPage(pageData, pageTotal));

  // Enqueue Q1–Q4 responses (consumed by `await chain` in Promise.all)
  pushResolution(overrideQ1 ?? okCitas(q1Data));
  pushResolution(okCitas(q2Data));
  pushResolution(okCitas(q3Data));
  // Q4 is the clientes_ultima_visita view — defaults to empty (no ultimaVisita)
  pushResolution(okCitas(q4Data ?? []));

  // Enqueue servicios lookup (only consumed when winningServicioIds.size > 0)
  if (serviciosData !== undefined) {
    pushResolution(okCitas(serviciosData));
  }

  // Enqueue tipo_servicios lookup (only consumed when winningTipoIds.size > 0)
  if (tipoServiciosData !== undefined) {
    pushResolution(okCitas(tipoServiciosData));
  }
}

// ── Helper: set up for findClienteKPI ────────────────────────────────────────
// kpiQ1 and kpiQ2 go through the `from()` chain (count queries via `then` queue).
// kpiQ3 is supabase.rpc('kpi_recurrencia_90d') — mocked directly on mockSupabase.rpc.
//   Returns { data: number (0-100), error: null } on success.
// kpiQ4 goes through the `from()` chain (citas with prices — non-fatal).
//
// Queue order for `from()` calls (3 parallel):
//   1. kpiQ1 clientes total count
//   2. kpiQ2 clientes nuevos 30d count
//   3. kpiQ4 all completed citas with service prices (gastoMedioCliente — non-fatal)
// Plus mockRpc (called in parallel, NOT through the `then` queue):
//   kpiQ3 recurrenciaPct scalar (0-100)

function setupFindClienteKPI(
  totalClientes: number,
  nuevos30Dias: number,
  recurrenciaPct: number,
  q1Err?: string,
  q2Err?: string,
  q3Err?: string,
  q4Err?: string,
) {
  pushResolution(q1Err ? errCitas(q1Err) : okCount(totalClientes));
  pushResolution(q2Err ? errCitas(q2Err) : okCount(nuevos30Dias));
  // kpiQ4: gastoMedioCliente — errors are non-fatal; default to empty citas
  pushResolution(q4Err ? errCitas(q4Err) : okCitas([]));
  // kpiQ3 via RPC — not in the `then` queue; mocked directly
  mockRpc.mockResolvedValueOnce(
    q3Err ? { data: null, error: { message: q3Err } } : { data: recurrenciaPct, error: null },
  );
}

// ── Tests: findAllWithStats ────────────────────────────────────────────────────

describe('SupabaseClienteAdapter.findAllWithStats', () => {
  let adapter: InstanceType<typeof SupabaseClienteAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseClienteAdapter();
  });

  it('empty page (0 clients) returns { data: [], total: 0 } without querying citas', async () => {
    mockChain.range.mockResolvedValue(successPage([], 0));

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    // citas from() calls must NOT have fired
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('clientes');
  });

  it('single client with no citas → correct zero stats', async () => {
    setupFindAllWithStats([baseClienteRow], 1, [], [], []);

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });

    expect(result.data).toHaveLength(1);
    const stats = result.data[0];
    expect(stats.ultimaVisita).toBeNull();
    expect(stats.totalVisitasAnio).toBe(0);
    expect(stats.frecuenciaVisitas).toBe(0);
    expect(stats.ritualFavorito).toBeNull();
    expect(stats.gastoAnual).toBe(0);
  });

  it('client with 3 completadas in last 180 days → frecuenciaVisitas = 0.5 (3 / 6)', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    setupFindAllWithStats(
      [baseClienteRow],
      1,
      [
        { cliente_id: 1, fecha_inicio: tenDaysAgo },
        { cliente_id: 1, fecha_inicio: twentyDaysAgo },
        { cliente_id: 1, fecha_inicio: thirtyDaysAgo },
      ],
      [{ cliente_id: 1 }, { cliente_id: 1 }, { cliente_id: 1 }],
      [],
    );

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });
    // frecuenciaVisitas = count(3) / 6 months (180-day rolling window) = 0.5
    expect(result.data[0].frecuenciaVisitas).toBe(0.5);
    expect(result.data[0].totalVisitasAnio).toBe(3);
  });

  it('picks most-frequent servicio_id as ritualFavorito', async () => {
    // servicio_id 10 appears twice, 20 once → winner is 10.
    // Production resolves servicio → tipo_servicio FK, then tipo_servicio → nombre.
    // Two extra lookups are queued: servicios ({id, tipo_servicio}) + tipo_servicios ({id, nombre}).
    setupFindAllWithStats(
      [baseClienteRow],
      1,
      [{ cliente_id: 1, fecha_inicio: new Date().toISOString() }],
      [{ cliente_id: 1 }],
      [
        { cliente_id: 1, servicio_id: 10 },
        { cliente_id: 1, servicio_id: 10 },
        { cliente_id: 1, servicio_id: 20 },
      ],
      // serviciosData: maps servicio id → tipo_servicio FK
      [
        { id: 10, tipo_servicio: 100 },
        { id: 20, tipo_servicio: 200 },
      ],
      undefined, // overrideQ1
      undefined, // q4Data
      // tipoServiciosData: maps tipo_servicio id → nombre
      [
        { id: 100, nombre: 'Tradicional Tailandés' },
        { id: 200, nombre: 'Reflexología Podal' },
      ],
    );

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });
    expect(result.data[0].ritualFavorito).toBe('Tradicional Tailandés');
  });

  it('null ultima_visita from view is skipped; Q1 null fecha_inicio is skipped too', async () => {
    const validDate = new Date().toISOString();
    // Q1 still uses fecha_inicio (citas table)
    const q1Rows = [
      { cliente_id: 1, fecha_inicio: null }, // skipped in Q1 count
      { cliente_id: 1, fecha_inicio: validDate },
    ];
    // Q4 uses the view shape — the view already skips null rows server-side,
    // but we test the adapter's null guard with an explicit null row.
    const q4ViewRows = [
      { cliente_id: 1, ultima_visita: null }, // skipped by adapter null guard
      { cliente_id: 1, ultima_visita: validDate },
    ];

    setupFindAllWithStats(
      [baseClienteRow],
      1,
      q1Rows,
      [{ cliente_id: 1 }],
      [],
      undefined,
      undefined,
      q4ViewRows, // explicit Q4 with null + valid structure
    );

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });
    // null row skipped in Q4 → ultimaVisita is the valid Date
    expect(result.data[0].ultimaVisita).toBeInstanceOf(Date);
    // null row skipped in Q1 → count = 1 → frecuenciaVisitas = 1 / 6 ≈ 0.2
    expect(result.data[0].frecuenciaVisitas).toBe(0.2);
  });

  it('servicios query is skipped when no Q3 rows exist (winningServicioIds.size = 0)', async () => {
    setupFindAllWithStats([baseClienteRow], 1, [], [], []);
    // No serviciosData arg → nothing queued for servicios

    await adapter.findAllWithStats({ page: 1, perPage: 20 });

    // Calls: clientes(1) + Q1(1) + Q2(1) + Q3(1) + Q4(1) = 5; servicios NOT called
    expect(mockSupabase.from).toHaveBeenCalledTimes(5);
    const fromCalls = mockSupabase.from.mock.calls.map((c: unknown[]) => c[0]);
    expect(fromCalls).not.toContain('servicios');
  });

  it('Q1 Supabase error → method throws', async () => {
    setupFindAllWithStats(
      [baseClienteRow],
      1,
      [],
      [],
      [],
      undefined,
      errCitas('Q1 network error'), // override Q1 with error
    );

    await expect(adapter.findAllWithStats({ page: 1, perPage: 20 })).rejects.toThrow(
      'Q1 network error',
    );
  });

  it('page query Supabase error → method throws', async () => {
    mockChain.range.mockResolvedValue(errorPage('page query failed'));

    await expect(adapter.findAllWithStats({ page: 1, perPage: 20 })).rejects.toThrow(
      'page query failed',
    );
  });

  it('ultimaVisita comes from Q4 view — uses ultima_visita (already MAX at DB level)', async () => {
    const newer = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // The view already returns the MAX per client — one row per client only.
    const q4Rows = [{ cliente_id: 1, ultima_visita: newer }];

    setupFindAllWithStats(
      [baseClienteRow],
      1,
      [], // Q1 empty (frecuenciaVisitas = 0)
      [{ cliente_id: 1 }, { cliente_id: 1 }],
      [],
      undefined,
      undefined,
      q4Rows,
    );

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });
    expect(result.data[0].ultimaVisita?.getTime()).toBe(new Date(newer).getTime());
  });

  it('ultimaVisita is null when Q4 returns no rows (client visited >2 years ago)', async () => {
    setupFindAllWithStats(
      [baseClienteRow],
      1,
      [],
      [],
      [],
      undefined,
      undefined,
      [], // explicit empty Q4
    );

    const result = await adapter.findAllWithStats({ page: 1, perPage: 20 });
    expect(result.data[0].ultimaVisita).toBeNull();
  });
});

// ── Tests: findClienteKPI ─────────────────────────────────────────────────────

describe('SupabaseClienteAdapter.findClienteKPI', () => {
  let adapter: InstanceType<typeof SupabaseClienteAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseClienteAdapter();
  });

  it('returns totalClientes and nuevos30Dias from count queries', async () => {
    setupFindClienteKPI(50, 8, 0);

    const kpi = await adapter.findClienteKPI();
    expect(kpi.totalClientes).toBe(50);
    expect(kpi.nuevos30Dias).toBe(8);
  });

  it('gastoMedioCliente is always 0 (pagos table not migrated)', async () => {
    setupFindClienteKPI(10, 2, 0);

    const kpi = await adapter.findClienteKPI();
    expect(kpi.gastoMedioCliente).toBe(0);
  });

  it('recurrenciaPct comes directly from RPC scalar — 67', async () => {
    // The DB function kpi_recurrencia_90d() returns the percentage directly.
    // No client-side computation — adapter uses the value as-is.
    setupFindClienteKPI(10, 0, 67);

    const kpi = await adapter.findClienteKPI();
    expect(kpi.recurrenciaPct).toBe(67);
  });

  it('100% recurring → recurrenciaPct is 100', async () => {
    setupFindClienteKPI(5, 0, 100);

    const kpi = await adapter.findClienteKPI();
    expect(kpi.recurrenciaPct).toBe(100);
  });

  it('no citas in last 90 days → recurrenciaPct is 0 (RPC returns 0)', async () => {
    setupFindClienteKPI(25, 3, 0);

    const kpi = await adapter.findClienteKPI();
    expect(kpi.recurrenciaPct).toBe(0);
  });

  it('all clients visited exactly once → recurrenciaPct is 0', async () => {
    setupFindClienteKPI(10, 0, 0);

    const kpi = await adapter.findClienteKPI();
    expect(kpi.recurrenciaPct).toBe(0);
  });

  it('kpiQ1 error → method throws', async () => {
    setupFindClienteKPI(0, 0, 0, 'total count failed');
    await expect(adapter.findClienteKPI()).rejects.toThrow('total count failed');
  });

  it('kpiQ2 error → method throws', async () => {
    setupFindClienteKPI(10, 0, 0, undefined, 'nuevos30d failed');
    await expect(adapter.findClienteKPI()).rejects.toThrow('nuevos30d failed');
  });

  it('kpiQ3 RPC error → method throws', async () => {
    setupFindClienteKPI(10, 0, 0, undefined, undefined, 'rpc kpi_recurrencia_90d failed');
    await expect(adapter.findClienteKPI()).rejects.toThrow('rpc kpi_recurrencia_90d failed');
  });
});
