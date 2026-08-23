/**
 * SupabaseCitaAdapter.findEnrichedByCliente.test.ts
 *
 * Unit tests for the new findEnrichedByCliente method added to SupabaseCitaAdapter.
 *
 * The method fetches base citas, then in parallel fetches names for servicios,
 * salas, and usuarios. All supabase calls are mocked at the module level.
 *
 * Mock strategy:
 *   - supabase.from() is mocked via mockFrom.
 *   - For each test, mockFrom is reset and configured to return fresh chains
 *     in call order:
 *       1. citas  (base query — limit/filter applied, resolved via await chain)
 *       2. servicios (names — if servicioIds.size > 0)
 *       3. salas     (names — if salaIds.size > 0)
 *       4. usuarios  (names — if usuarioIds.size > 0)
 *
 * Important: vi.clearAllMocks() resets `then` implementations on chains built
 * in previous tests. Therefore beforeEach only resets mockFrom, and each test
 * builds fresh chains.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ICitaEnrichadaRow } from '@infra/adapters/database.types';

// ── Chain builder ─────────────────────────────────────────────────────────────
// Each call builds a new independent chainable mock.

function buildChain(resolution: unknown) {
  const then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolution).then(resolve);

  const chain: Record<string, unknown> & { then: typeof then } = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    gt: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    then,
  };

  // All chainable methods return `this`
  (chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.in as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.gt as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.lt as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.order as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.limit as ReturnType<typeof vi.fn>).mockReturnValue(chain);

  return chain;
}

const mockFrom = vi.fn();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: { from: mockFrom },
}));

const { SupabaseCitaAdapter } = await import('@infra/adapters/SupabaseCitaAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────────

function makeEnrichadaRow(overrides: Partial<ICitaEnrichadaRow> = {}): ICitaEnrichadaRow {
  return {
    id: 1,
    fecha_inicio: '2025-01-10T10:00:00.000Z',
    fecha_fin: '2025-01-10T11:30:00.000Z',
    estado: 'completada',
    servicio_id: 10,
    sala_id: 20,
    usuario_id: 30,
    ...overrides,
  };
}

// Shapes expected by the adapter:
//   citasResult.error !== null  → from citas query
//   serviciosRes.error !== null → from servicios query
function okQuery<T>(data: T[]) {
  return { data, error: null };
}

function errQuery(message: string) {
  return { data: null, error: { message } };
}

// ── Setup helper ──────────────────────────────────────────────────────────────
// Configures mockFrom for a test. Call order:
//   1. citas
//   2. servicios  (if any servicio_id in rows)
//   3. salas      (if any sala_id in rows)
//   4. usuarios   (if any usuario_id in rows)

function setupQuery(
  citasResolution: unknown,
  serviciosResolution?: unknown,
  salasResolution?: unknown,
  usuariosResolution?: unknown,
) {
  mockFrom.mockReset();

  const citasChain = buildChain(citasResolution);
  mockFrom.mockReturnValueOnce(citasChain);

  if (serviciosResolution !== undefined) {
    mockFrom.mockReturnValueOnce(buildChain(serviciosResolution));
  }
  if (salasResolution !== undefined) {
    mockFrom.mockReturnValueOnce(buildChain(salasResolution));
  }
  if (usuariosResolution !== undefined) {
    mockFrom.mockReturnValueOnce(buildChain(usuariosResolution));
  }

  return citasChain;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SupabaseCitaAdapter.findEnrichedByCliente', () => {
  let adapter: InstanceType<typeof SupabaseCitaAdapter>;

  beforeEach(() => {
    mockFrom.mockReset();
    adapter = new SupabaseCitaAdapter();
  });

  // ── Empty result ──────────────────────────────────────────────────────────

  it('returns [] when citas query returns no rows', async () => {
    setupQuery(okQuery([]));

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result).toHaveLength(0);
  });

  it('does not query servicios/salas/usuarios when citas is empty', async () => {
    setupQuery(okQuery([]));

    await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    // Only the citas from() call
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  // ── Filter flags ──────────────────────────────────────────────────────────

  it('onlyFuture: true → applies in(estado, [pendiente, confirmada]) and gt(fecha_inicio)', async () => {
    const citasChain = setupQuery(okQuery([]));

    await adapter.findEnrichedByCliente(1, { limit: 1, onlyFuture: true });

    expect(citasChain.in as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('estado', [
      'pendiente',
      'confirmada',
    ]);
    expect(citasChain.gt as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'fecha_inicio',
      expect.any(String),
    );
  });

  it('onlyPast: true → applies eq(estado, completada) and lt(fecha_inicio)', async () => {
    const citasChain = setupQuery(okQuery([]));

    await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });

    expect(citasChain.eq as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('estado', 'completada');
    expect(citasChain.lt as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'fecha_inicio',
      expect.any(String),
    );
  });

  // ── Row mapping ───────────────────────────────────────────────────────────

  it('maps servicioNombre from servicios lookup', async () => {
    const row = makeEnrichadaRow({ servicio_id: 10 });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].servicioNombre).toBe('Masaje Thai');
  });

  it('maps salaNombre from salas lookup', async () => {
    const row = makeEnrichadaRow({ sala_id: 20 });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].salaNombre).toBe('Sala Loto');
  });

  it('maps terapeutaNombre from usuarios lookup', async () => {
    const row = makeEnrichadaRow({ usuario_id: 30 });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].terapeutaNombre).toBe('Naree Apinya');
  });

  it('calculates duracionMinutos from fecha_inicio and fecha_fin (90 min)', async () => {
    const row = makeEnrichadaRow({
      fecha_inicio: '2025-01-10T10:00:00.000Z',
      fecha_fin: '2025-01-10T11:30:00.000Z',
    });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].duracionMinutos).toBe(90);
  });

  it('valoracion is always null', async () => {
    const row = makeEnrichadaRow();
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].valoracion).toBeNull();
  });

  it('maps fechaHoraInicio and fechaHoraFin as Date objects', async () => {
    const row = makeEnrichadaRow();
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].fechaHoraInicio).toBeInstanceOf(Date);
    expect(result[0].fechaHoraFin).toBeInstanceOf(Date);
  });

  it('maps citaId from the row id', async () => {
    const row = makeEnrichadaRow({ id: 777 });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].citaId).toBe(777);
  });

  it('maps estado from the row', async () => {
    const row = makeEnrichadaRow({ estado: 'confirmada' });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].estado).toBe('confirmada');
  });

  // ── Null date guard ───────────────────────────────────────────────────────

  it('row with null fecha_inicio is filtered out', async () => {
    const nullDateRow = makeEnrichadaRow({ fecha_inicio: null });
    const validRow = makeEnrichadaRow({ id: 2 });

    setupQuery(
      okQuery([nullDateRow, validRow]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result).toHaveLength(1);
    expect(result[0].citaId).toBe(2);
  });

  it('row with null fecha_fin is filtered out', async () => {
    const nullDateRow = makeEnrichadaRow({ fecha_fin: null });
    setupQuery(okQuery([nullDateRow]));

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result).toHaveLength(0);
  });

  // ── Empty set optimization ────────────────────────────────────────────────

  it('servicios query is skipped when no servicio_ids in rows (servicio_id = null)', async () => {
    const row = makeEnrichadaRow({ servicio_id: null });
    // When servicio_id is null, servicioIds.size = 0 → Promise.resolve skips from()
    // salas and usuarios still fire from()
    setupQuery(
      okQuery([row]),
      undefined, // servicios skipped
      okQuery([{ id: 20, nombre: 'Sala Loto' }]), // salas
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]), // usuarios
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    // Only 3 from() calls: citas + salas + usuarios (servicios short-circuited)
    expect(mockFrom).toHaveBeenCalledTimes(3);
    expect(result[0].servicioNombre).toBe('Servicio desconocido');
  });

  it('uses fallback name "Servicio desconocido" when servicio not in lookup', async () => {
    const row = makeEnrichadaRow({ servicio_id: 999 });
    setupQuery(
      okQuery([row]),
      okQuery([]), // empty servicios lookup → servicio 999 not found
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].servicioNombre).toBe('Servicio desconocido');
  });

  it('uses fallback name "Sala desconocida" when sala_id is null', async () => {
    const row = makeEnrichadaRow({ sala_id: null });
    // No salas from() needed when salaIds.size = 0
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      undefined, // salas skipped
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].salaNombre).toBe('Sala desconocida');
  });

  it('uses fallback name "Terapeuta desconocido" when usuario_id is null', async () => {
    const row = makeEnrichadaRow({ usuario_id: null });
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      undefined, // usuarios skipped
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result[0].terapeutaNombre).toBe('Terapeuta desconocido');
  });

  // ── Error propagation ─────────────────────────────────────────────────────

  it('citas query error → method throws', async () => {
    setupQuery(errQuery('citas query failed'));

    await expect(adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true })).rejects.toThrow(
      'citas query failed',
    );
  });

  it('servicios lookup error → method throws', async () => {
    const row = makeEnrichadaRow();
    setupQuery(
      okQuery([row]),
      errQuery('servicios lookup failed'),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    await expect(adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true })).rejects.toThrow(
      'servicios lookup failed',
    );
  });

  it('salas lookup error → method throws', async () => {
    const row = makeEnrichadaRow();
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      errQuery('salas lookup failed'),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    await expect(adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true })).rejects.toThrow(
      'salas lookup failed',
    );
  });

  it('usuarios lookup error → method throws', async () => {
    const row = makeEnrichadaRow();
    setupQuery(
      okQuery([row]),
      okQuery([{ id: 10, nombre: 'Masaje Thai' }]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      errQuery('usuarios lookup failed'),
    );

    await expect(adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true })).rejects.toThrow(
      'usuarios lookup failed',
    );
  });

  // ── Multiple rows ─────────────────────────────────────────────────────────

  it('maps multiple valid rows correctly', async () => {
    const row1 = makeEnrichadaRow({ id: 1, servicio_id: 10, sala_id: 20, usuario_id: 30 });
    const row2 = makeEnrichadaRow({
      id: 2,
      servicio_id: 11,
      sala_id: 20,
      usuario_id: 30,
      fecha_inicio: '2025-02-10T14:00:00.000Z',
      fecha_fin: '2025-02-10T15:00:00.000Z',
    });

    setupQuery(
      okQuery([row1, row2]),
      okQuery([
        { id: 10, nombre: 'Masaje Thai' },
        { id: 11, nombre: 'Reflexología' },
      ]),
      okQuery([{ id: 20, nombre: 'Sala Loto' }]),
      okQuery([{ id: 30, nombre: 'Naree Apinya' }]),
    );

    const result = await adapter.findEnrichedByCliente(1, { limit: 5, onlyPast: true });
    expect(result).toHaveLength(2);
    expect(result[0].servicioNombre).toBe('Masaje Thai');
    expect(result[1].servicioNombre).toBe('Reflexología');
    expect(result[1].duracionMinutos).toBe(60);
  });
});
