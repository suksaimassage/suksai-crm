import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IAusenciasRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseAusenciaAdapter } = await import('@infra/adapters/SupabaseAusenciaAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const ausenciaRow: IAusenciasRow = {
  id: 1,
  usuario_id: 10,
  tipo: 'vacaciones',
  fecha_inicio: '2024-06-01',
  fecha_fin: '2024-06-07',
  activa: false,
  aprobado_por: 99,
  observaciones: 'Vacaciones de verano',
  created_at: '2024-01-01T00:00:00Z',
};

const ausenciaAprobadaRow: IAusenciasRow = {
  id: 2,
  usuario_id: 10,
  tipo: 'baja_medica',
  fecha_inicio: '2024-07-01',
  fecha_fin: '2024-07-14',
  activa: true,
  aprobado_por: 99,
  observaciones: null,
  created_at: '2024-01-05T00:00:00Z',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function resetMocks() {
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
  ];
  for (const m of methods) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockSupabase.from.mockReturnValue(mockChain);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('SupabaseAusenciaAdapter', () => {
  let adapter: InstanceType<typeof SupabaseAusenciaAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseAusenciaAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped IAusencia when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: ausenciaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.usuarioId).toBe(10);
      expect(result!.tipo).toBe('vacaciones');
      expect(result!.motivo).toBe('Vacaciones de verano');
    });

    it('maps activa to aprobada', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: ausenciaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.aprobada).toBe(false); // activa=false → not yet approved
    });

    it('maps aprobadaPor from aprobado_por column', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: ausenciaRow, // aprobado_por: 99
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.aprobadaPor).toBe(99);
    });

    it('maps fechaInicio and fechaFin as Date objects', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: ausenciaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.fechaInicio).toBeInstanceOf(Date);
      expect(result!.fechaFin).toBeInstanceOf(Date);
    });

    it('maps null observaciones to null motivo', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: ausenciaAprobadaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(2);
      expect(result!.motivo).toBeNull();
    });

    it('returns null when not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findById(999);
      expect(result).toBeNull();
    });

    it('throws Error on DB error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'fetch failed' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('fetch failed');
    });
  });

  // ── findByUsuario ──────────────────────────────────────────────────────
  describe('findByUsuario', () => {
    it('returns ausencias for a given usuario without date filter', async () => {
      // Adapter chains .eq('usuario_id', ...) — use setResolution
      mockChain.setResolution({
        success: true,
        data: [ausenciaRow, ausenciaAprobadaRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByUsuario(10);

      expect(result).toHaveLength(2);
      expect(result[0].usuarioId).toBe(10);
    });

    it('applies date range filter when params provided', async () => {
      // With params, chain goes: .eq → .gte → .lte → resolves
      mockChain.lte.mockResolvedValue({
        success: true,
        data: [ausenciaRow],
        error: null,
        count: null,
      });

      const params = { from: new Date('2024-06-01'), to: new Date('2024-06-30') };
      const result = await adapter.findByUsuario(10, params);

      expect(result).toHaveLength(1);
      expect(mockChain.gte).toHaveBeenCalledWith('fecha_inicio', '2024-06-01');
      expect(mockChain.lte).toHaveBeenCalledWith('fecha_fin', '2024-06-30');
    });

    it('returns empty array when no ausencias', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByUsuario(10);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'query error' },
        count: null,
      });

      await expect(adapter.findByUsuario(10)).rejects.toThrow('query error');
    });
  });

  // ── findPendientesAprobacion ───────────────────────────────────────────
  describe('findPendientesAprobacion', () => {
    it('returns ausencias where activa=false (pending approval)', async () => {
      mockChain.setResolution({
        success: true,
        data: [ausenciaRow],
        error: null,
        count: null,
      });

      const result = await adapter.findPendientesAprobacion();

      expect(result).toHaveLength(1);
      expect(result[0].aprobada).toBe(false);
      expect(mockChain.eq).toHaveBeenCalledWith('activa', false);
    });

    it('returns empty array when no pending ausencias', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findPendientesAprobacion();
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'error' },
        count: null,
      });

      await expect(adapter.findPendientesAprobacion()).rejects.toThrow('error');
    });
  });

  // ── findByTipo ─────────────────────────────────────────────────────────
  describe('findByTipo', () => {
    it('returns ausencias of given type', async () => {
      // Adapter chains .eq('tipo', tipo) — use setResolution
      mockChain.setResolution({
        success: true,
        data: [ausenciaRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByTipo('vacaciones');

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('vacaciones');
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'tipo query failed' },
        count: null,
      });

      await expect(adapter.findByTipo('baja_medica')).rejects.toThrow('tipo query failed');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped IAusencia from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: ausenciaRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        usuarioId: 10,
        tipo: 'vacaciones',
        fechaInicio: new Date('2024-06-01'),
        fechaFin: new Date('2024-06-07'),
        aprobadaPor: 99,
        motivo: 'Vacaciones de verano',
      });

      expect(result.id).toBe(1);
      expect(result.tipo).toBe('vacaciones');
      expect(result.aprobada).toBe(false); // new ausencias default to not approved
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'insert failed' },
        count: null,
      });

      await expect(
        adapter.create({
          usuarioId: 10,
          tipo: 'permiso',
          fechaInicio: new Date(),
          fechaFin: new Date(),
          aprobadaPor: 99,
        }),
      ).rejects.toThrow('insert failed');
    });
  });

  // ── aprobar ────────────────────────────────────────────────────────────
  describe('aprobar', () => {
    it('returns updated IAusencia with aprobada=true and aprobadaPor set', async () => {
      const approvedRow = { ...ausenciaRow, activa: true, aprobado_por: 99 };
      mockChain.single.mockResolvedValue({
        success: true,
        data: approvedRow,
        error: null,
        count: null,
      });

      const result = await adapter.aprobar(1, 99);

      expect(result.aprobada).toBe(true);
      expect(result.aprobadaPor).toBe(99);
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'update failed' },
        count: null,
      });

      await expect(adapter.aprobar(1, 99)).rejects.toThrow('update failed');
    });
  });

  // ── rechazar ───────────────────────────────────────────────────────────
  describe('rechazar', () => {
    it('resolves without error on success (deletes the row)', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      await expect(adapter.rechazar(1)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'delete error' },
        count: null,
      });

      await expect(adapter.rechazar(1)).rejects.toThrow('delete error');
    });
  });
});
