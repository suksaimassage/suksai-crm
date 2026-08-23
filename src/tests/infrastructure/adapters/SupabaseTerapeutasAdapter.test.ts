/**
 * SupabaseTerapeutasAdapter.test.ts
 *
 * Adapter tests using the established vi.mock + await import pattern.
 * Tests verify the adapter correctly wraps Supabase and maps raw DB rows
 * to the expected raw shapes consumed by the orchestrating hook.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';

// ── Mock the supabase client module ────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

// Import AFTER mock is registered
const { SupabaseTerapeutasAdapter } = await import('@infra/adapters/SupabaseTerapeutasAdapter');

// ── Helpers ────────────────────────────────────────────────────────────────────

function resetMocks(): void {
  vi.clearAllMocks();
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'gte',
    'lte',
    'lt',
    'range',
    'order',
    'insert',
    'update',
    'delete',
    'upsert',
  ] as const;
  for (const m of methods) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockSupabase.from.mockReturnValue(mockChain);
  // Reset chain resolution to a clean success
  mockChain._thenResolution = {
    success: true,
    data: [],
    error: null,
    count: null,
  };
  mockChain.then.mockImplementation((resolve: (v: unknown) => unknown) =>
    Promise.resolve(mockChain._thenResolution).then(resolve),
  );
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const CENTRO_ID = 10;
const NOW = new Date('2024-06-12T10:30:00Z');
const WEEK_START = new Date('2024-06-10T00:00:00Z');
const WEEK_END = new Date('2024-06-16T23:59:59Z');

/** Raw join row from usuarios_centro → usuarios → usuarios_roles → roles */
const terapeutaJoinRow = {
  usuarios: {
    id: 1,
    nombre: 'Ana García',
    email: 'ana@example.com',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    usuarios_roles: [{ roles: { nombre: 'masajista' } }],
  },
};

const superadminJoinRow = {
  usuarios: {
    id: 2,
    nombre: 'Carlos Superadmin',
    email: 'carlos@example.com',
    is_active: true,
    created_at: '2024-01-20T09:00:00Z',
    usuarios_roles: [{ roles: { nombre: 'superadmin' } }],
  },
};

const citaRaw = {
  id: 100,
  usuario_id: 1,
  fecha_inicio: '2024-06-12T10:00:00Z',
  fecha_fin: '2024-06-12T11:00:00Z',
  estado: 'completada',
  servicios: { nombre: 'Masaje Tailandés', precio: 60 },
};

const horarioRaw = {
  id: 200,
  usuario_id: 1,
  tipo: 'recurrente',
  dia_semana: 3,
  fecha: null,
  hora_inicio: '09:00',
  hora_fin: '18:00',
};

const ausenciaSelectRow = {
  id: 300,
  usuario_id: 1,
  tipo: 'vacaciones',
  fecha_inicio: '2024-06-10',
  fecha_fin: '2024-06-14',
  activa: true,
};

const currentCitaRaw = {
  id: 400,
  usuario_id: 1,
  sala_id: 5,
  estado: 'en_curso',
  fecha_inicio: '2024-06-12T10:00:00Z',
  fecha_fin: '2024-06-12T11:00:00Z',
  salas: { id: 5, nombre: 'Sala Bambú' },
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SupabaseTerapeutasAdapter', () => {
  let adapter: InstanceType<typeof SupabaseTerapeutasAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseTerapeutasAdapter();
  });

  // ── fetchTerapeutasByCentro ────────────────────────────────────────────────

  describe('fetchTerapeutasByCentro', () => {
    it('returns mapped ITerapeutaRaw for users with masajista role', async () => {
      mockChain.setResolution({
        success: true,
        data: [terapeutaJoinRow],
        error: null,
        count: null,
      });

      const result = await adapter.fetchTerapeutasByCentro(CENTRO_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].nombre).toBe('Ana García');
      expect(result[0].email).toBe('ana@example.com');
      expect(result[0].is_active).toBe(true);
    });

    it('excludes users whose only role is superadmin', async () => {
      mockChain.setResolution({
        success: true,
        data: [terapeutaJoinRow, superadminJoinRow],
        error: null,
        count: null,
      });

      const result = await adapter.fetchTerapeutasByCentro(CENTRO_ID);

      // Only the non-superadmin user should be returned
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Ana García');
    });

    it('returns empty array when all users have only the superadmin role', async () => {
      mockChain.setResolution({
        success: true,
        data: [superadminJoinRow],
        error: null,
        count: null,
      });

      const result = await adapter.fetchTerapeutasByCentro(CENTRO_ID);
      expect(result).toHaveLength(0);
    });

    it('returns empty array when centro has no users', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      const result = await adapter.fetchTerapeutasByCentro(CENTRO_ID);
      expect(result).toHaveLength(0);
    });

    it('throws Error when Supabase returns an error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'relation not found' },
        count: null,
      });

      await expect(adapter.fetchTerapeutasByCentro(CENTRO_ID)).rejects.toThrow(
        'relation not found',
      );
    });

    it('strips usuarios_roles from the returned ITerapeutaRaw shape', async () => {
      mockChain.setResolution({
        success: true,
        data: [terapeutaJoinRow],
        error: null,
        count: null,
      });

      const result = await adapter.fetchTerapeutasByCentro(CENTRO_ID);
      // usuarios_roles should NOT be present in the returned shape
      expect(result[0]).not.toHaveProperty('usuarios_roles');
    });

    it('queries the usuarios_centro table with the correct centro_id', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await adapter.fetchTerapeutasByCentro(CENTRO_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios_centro');
      expect(mockChain.eq).toHaveBeenCalledWith('centro_id', CENTRO_ID);
    });
  });

  // ── fetchWeekCitasForUsuarios ──────────────────────────────────────────────

  describe('fetchWeekCitasForUsuarios', () => {
    it('returns empty array immediately when usuarioIds is empty (no DB call)', async () => {
      const result = await adapter.fetchWeekCitasForUsuarios([], WEEK_START, WEEK_END);

      expect(result).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('returns mapped citas for provided usuarioIds', async () => {
      mockChain.setResolution({
        success: true,
        data: [citaRaw],
        error: null,
        count: null,
      });

      const result = await adapter.fetchWeekCitasForUsuarios([1], WEEK_START, WEEK_END);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(100);
      expect(result[0].usuario_id).toBe(1);
      expect(result[0].estado).toBe('completada');
      expect(result[0].servicios?.nombre).toBe('Masaje Tailandés');
      expect(result[0].servicios?.precio).toBe(60);
    });

    it('returns empty array when no citas exist in the range', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      const result = await adapter.fetchWeekCitasForUsuarios([1, 2], WEEK_START, WEEK_END);
      expect(result).toEqual([]);
    });

    it('throws Error when Supabase returns an error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'network timeout' },
        count: null,
      });

      await expect(adapter.fetchWeekCitasForUsuarios([1], WEEK_START, WEEK_END)).rejects.toThrow(
        'network timeout',
      );
    });

    it('queries citas table with the correct date range filters', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await adapter.fetchWeekCitasForUsuarios([1], WEEK_START, WEEK_END);

      expect(mockSupabase.from).toHaveBeenCalledWith('citas');
      expect(mockChain.in).toHaveBeenCalledWith('usuario_id', [1]);
      expect(mockChain.gte).toHaveBeenCalledWith('fecha_inicio', WEEK_START.toISOString());
      expect(mockChain.lte).toHaveBeenCalledWith('fecha_inicio', WEEK_END.toISOString());
    });
  });

  // ── fetchHorariosForUsuarios ───────────────────────────────────────────────

  describe('fetchHorariosForUsuarios', () => {
    it('returns empty array immediately when usuarioIds is empty (no DB call)', async () => {
      const result = await adapter.fetchHorariosForUsuarios([]);

      expect(result).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('returns mapped horarios for provided usuarioIds', async () => {
      mockChain.setResolution({
        success: true,
        data: [horarioRaw],
        error: null,
        count: null,
      });

      const result = await adapter.fetchHorariosForUsuarios([1]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(200);
      expect(result[0].usuario_id).toBe(1);
      expect(result[0].tipo).toBe('recurrente');
      expect(result[0].dia_semana).toBe(3);
      expect(result[0].hora_inicio).toBe('09:00');
    });

    it('returns empty array when no horarios exist', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      const result = await adapter.fetchHorariosForUsuarios([1]);
      expect(result).toEqual([]);
    });

    it('throws Error when Supabase returns an error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'horarios table missing' },
        count: null,
      });

      await expect(adapter.fetchHorariosForUsuarios([1])).rejects.toThrow('horarios table missing');
    });

    it('queries horarios_trabajo table', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await adapter.fetchHorariosForUsuarios([1, 2]);

      expect(mockSupabase.from).toHaveBeenCalledWith('horarios_trabajo');
      expect(mockChain.in).toHaveBeenCalledWith('usuario_id', [1, 2]);
    });
  });

  // ── fetchAusenciasForUsuarios ──────────────────────────────────────────────

  describe('fetchAusenciasForUsuarios', () => {
    it('returns empty array immediately when usuarioIds is empty (no DB call)', async () => {
      const result = await adapter.fetchAusenciasForUsuarios([], WEEK_START, WEEK_END);

      expect(result).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('maps activa=true to estado="aprobada"', async () => {
      mockChain.setResolution({
        success: true,
        data: [{ ...ausenciaSelectRow, activa: true }],
        error: null,
        count: null,
      });

      const result = await adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END);

      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe('aprobada');
    });

    it('maps activa=false to estado=null', async () => {
      mockChain.setResolution({
        success: true,
        data: [{ ...ausenciaSelectRow, activa: false }],
        error: null,
        count: null,
      });

      const result = await adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END);

      expect(result[0].estado).toBeNull();
    });

    it('maps activa=null to estado=null', async () => {
      mockChain.setResolution({
        success: true,
        data: [{ ...ausenciaSelectRow, activa: null }],
        error: null,
        count: null,
      });

      const result = await adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END);

      expect(result[0].estado).toBeNull();
    });

    it('returns correct mapped fields from the raw row', async () => {
      mockChain.setResolution({
        success: true,
        data: [ausenciaSelectRow],
        error: null,
        count: null,
      });

      const result = await adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END);

      expect(result[0].id).toBe(300);
      expect(result[0].usuario_id).toBe(1);
      expect(result[0].tipo).toBe('vacaciones');
      expect(result[0].fecha_inicio).toBe('2024-06-10');
      expect(result[0].fecha_fin).toBe('2024-06-14');
    });

    it('applies date range filter using date strings', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END);

      const fromStr = WEEK_START.toISOString().split('T')[0];
      const toStr = WEEK_END.toISOString().split('T')[0];

      expect(mockChain.lte).toHaveBeenCalledWith('fecha_inicio', toStr);
      expect(mockChain.gte).toHaveBeenCalledWith('fecha_fin', fromStr);
    });

    it('returns empty array when no ausencias exist', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      const result = await adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END);
      expect(result).toEqual([]);
    });

    it('throws Error when Supabase returns an error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'ausencias query failed' },
        count: null,
      });

      await expect(adapter.fetchAusenciasForUsuarios([1], WEEK_START, WEEK_END)).rejects.toThrow(
        'ausencias query failed',
      );
    });
  });

  // ── fetchCurrentCitasForCentro ─────────────────────────────────────────────

  describe('fetchCurrentCitasForCentro', () => {
    it('returns mapped ICurrentCitaRaw for en_curso citas', async () => {
      mockChain.setResolution({
        success: true,
        data: [currentCitaRaw],
        error: null,
        count: null,
      });

      const result = await adapter.fetchCurrentCitasForCentro(CENTRO_ID, NOW);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(400);
      expect(result[0].usuario_id).toBe(1);
      expect(result[0].estado).toBe('en_curso');
      expect(result[0].salas?.nombre).toBe('Sala Bambú');
    });

    it('returns empty array when no citas are en_curso', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      const result = await adapter.fetchCurrentCitasForCentro(CENTRO_ID, NOW);
      expect(result).toEqual([]);
    });

    it('filters by centro_id, estado=en_curso, and now within fecha range', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await adapter.fetchCurrentCitasForCentro(CENTRO_ID, NOW);

      expect(mockSupabase.from).toHaveBeenCalledWith('citas');
      expect(mockChain.eq).toHaveBeenCalledWith('centro_id', CENTRO_ID);
      expect(mockChain.eq).toHaveBeenCalledWith('estado', 'en_curso');
      expect(mockChain.lte).toHaveBeenCalledWith('fecha_inicio', NOW.toISOString());
      expect(mockChain.gte).toHaveBeenCalledWith('fecha_fin', NOW.toISOString());
    });

    it('throws Error when Supabase returns an error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'current citas query failed' },
        count: null,
      });

      await expect(adapter.fetchCurrentCitasForCentro(CENTRO_ID, NOW)).rejects.toThrow(
        'current citas query failed',
      );
    });

    it('includes sala info (salas join) in the result', async () => {
      const citaWithSala = {
        ...currentCitaRaw,
        salas: { id: 7, nombre: 'Sala Zen' },
      };
      mockChain.setResolution({
        success: true,
        data: [citaWithSala],
        error: null,
        count: null,
      });

      const result = await adapter.fetchCurrentCitasForCentro(CENTRO_ID, NOW);
      expect(result[0].salas?.nombre).toBe('Sala Zen');
    });

    it('handles cita without sala (salas is null)', async () => {
      const citaWithoutSala = { ...currentCitaRaw, sala_id: null, salas: null };
      mockChain.setResolution({
        success: true,
        data: [citaWithoutSala],
        error: null,
        count: null,
      });

      const result = await adapter.fetchCurrentCitasForCentro(CENTRO_ID, NOW);
      expect(result[0].salas).toBeNull();
    });
  });
});
