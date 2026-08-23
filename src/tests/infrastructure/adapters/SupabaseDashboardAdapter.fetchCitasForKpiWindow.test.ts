/**
 * SupabaseDashboardAdapter.fetchCitasForKpiWindow.test.ts
 *
 * Contract tests for the KPI-window query used by useDashboardKPIs. The method
 * fetches a single superset window of citas (id, cliente_id, fecha_inicio,
 * estado, joined servicio price) filtered by centro_id and a [from, to] date
 * range — it deliberately does NOT pre-filter estado (each KPI applies its own
 * estado rule in the hook).
 *
 * Mock strategy mirrors the other adapter tests: buildSupabaseMock provides a
 * chainable client; the list query resolves at the chain terminal via
 * setResolution (the query ends on .lte(), so `await chain` resolves it).
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';

const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseDashboardAdapter } = await import('@infra/adapters/SupabaseDashboardAdapter');

// ── Helpers ──────────────────────────────────────────────────────────────────

function resetMocks() {
  vi.clearAllMocks();
  const methods = ['select', 'eq', 'gte', 'lte', 'in', 'not', 'order'];
  for (const m of methods) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockSupabase.from.mockReturnValue(mockChain);
}

const FROM = new Date('2026-05-01T00:00:00.000Z');
const TO = new Date('2026-06-21T23:59:59.999Z');

const ROW = {
  id: 1,
  cliente_id: 7,
  fecha_inicio: '2026-06-17T10:00:00+02:00',
  estado: 'confirmada',
  servicios: { precio: 45 },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SupabaseDashboardAdapter.fetchCitasForKpiWindow', () => {
  let adapter: InstanceType<typeof SupabaseDashboardAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseDashboardAdapter();
  });

  it('queries the citas table', async () => {
    mockChain.setResolution({ success: true, data: [ROW], error: null, count: null });
    await adapter.fetchCitasForKpiWindow(3, FROM, TO);
    expect(mockSupabase.from).toHaveBeenCalledWith('citas');
  });

  it('filters by centro_id', async () => {
    mockChain.setResolution({ success: true, data: [], error: null, count: null });
    await adapter.fetchCitasForKpiWindow(3, FROM, TO);
    expect(mockChain.eq).toHaveBeenCalledWith('centro_id', 3);
  });

  it('bounds the query by the [from, to] window on fecha_inicio (ISO strings)', async () => {
    mockChain.setResolution({ success: true, data: [], error: null, count: null });
    await adapter.fetchCitasForKpiWindow(3, FROM, TO);
    expect(mockChain.gte).toHaveBeenCalledWith('fecha_inicio', FROM.toISOString());
    expect(mockChain.lte).toHaveBeenCalledWith('fecha_inicio', TO.toISOString());
  });

  it('does NOT pre-filter estado (hook applies per-KPI estado rules)', async () => {
    mockChain.setResolution({ success: true, data: [], error: null, count: null });
    await adapter.fetchCitasForKpiWindow(3, FROM, TO);
    // No estado filtering belongs in this query.
    expect(mockChain.not).not.toHaveBeenCalled();
    expect(mockChain.in).not.toHaveBeenCalled();
    for (const call of mockChain.eq.mock.calls) {
      expect(call[0]).not.toBe('estado');
    }
  });

  it('returns the rows for in-memory bucketing', async () => {
    mockChain.setResolution({ success: true, data: [ROW], error: null, count: null });
    const rows = await adapter.fetchCitasForKpiWindow(3, FROM, TO);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(1);
    expect(rows[0].servicios?.precio).toBe(45);
    expect(rows[0].estado).toBe('confirmada');
  });

  it('returns an empty array when the window has no citas', async () => {
    mockChain.setResolution({ success: true, data: [], error: null, count: null });
    const rows = await adapter.fetchCitasForKpiWindow(3, FROM, TO);
    expect(rows).toEqual([]);
  });

  it('throws with the Supabase error message on failure', async () => {
    mockChain.setResolution({
      success: false,
      data: null,
      error: { message: 'kpi window query failed' },
      count: null,
    });
    await expect(adapter.fetchCitasForKpiWindow(3, FROM, TO)).rejects.toThrow(
      'kpi window query failed',
    );
  });
});
