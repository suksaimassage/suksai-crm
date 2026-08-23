import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { ISalasRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseSalaAdapter } = await import('@infra/adapters/SupabaseSalaAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const salaRow: ISalasRow = {
  id: 1,
  nombre: 'Sala Relajación',
  centro_id: 10,
  capacidad: 2,
  activa: true,
  descripcion: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const salaRowNoCentro: ISalasRow = {
  id: 2,
  nombre: 'Sala Sin Centro',
  centro_id: null,
  capacidad: 1,
  activa: true,
  descripcion: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
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
describe('SupabaseSalaAdapter', () => {
  let adapter: InstanceType<typeof SupabaseSalaAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseSalaAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped ISala when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: salaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('Sala Relajación');
      expect(result!.centroId).toBe(10);
    });

    it('maps capacidad, activa, descripcion from DB columns', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: salaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result!.capacidad).toBe(2);
      expect(result!.activa).toBe(true);
      expect(result!.descripcion).toBeNull();
    });

    it('maps null centro_id as 0', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: salaRowNoCentro,
        error: null,
        count: null,
      });

      const result = await adapter.findById(2);
      expect(result!.centroId).toBe(0);
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
        error: { message: 'not found' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('not found');
    });
  });

  // ── findByCentro ───────────────────────────────────────────────────────
  describe('findByCentro', () => {
    it('returns salas for a given centro', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [salaRow], error: null, count: null });

      const result = await adapter.findByCentro(10);

      expect(result).toHaveLength(1);
      expect(result[0].centroId).toBe(10);
    });

    it('returns empty array when no salas in centro', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByCentro(10);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'query failed' },
        count: null,
      });

      await expect(adapter.findByCentro(10)).rejects.toThrow('query failed');
    });
  });

  // ── findActivasByCentro ────────────────────────────────────────────────
  describe('findActivasByCentro', () => {
    it('returns only active salas for a centro (activa = true)', async () => {
      mockChain.setResolution({ success: true, data: [salaRow], error: null, count: null });

      const result = await adapter.findActivasByCentro(10);
      expect(result).toHaveLength(1);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'db error' },
        count: null,
      });

      await expect(adapter.findActivasByCentro(10)).rejects.toThrow('db error');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped ISala from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: salaRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        nombre: 'Sala Relajación',
        centroId: 10,
        capacidad: 4,
      });

      expect(result.id).toBe(1);
      expect(result.nombre).toBe('Sala Relajación');
      expect(result.centroId).toBe(10);
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'constraint error' },
        count: null,
      });

      await expect(adapter.create({ nombre: 'X', centroId: 10, capacidad: 1 })).rejects.toThrow(
        'constraint error',
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated ISala', async () => {
      const updatedRow = { ...salaRow, nombre: 'Sala Actualizada' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { nombre: 'Sala Actualizada' });
      expect(result.nombre).toBe('Sala Actualizada');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'update failed' },
        count: null,
      });

      await expect(adapter.update(1, { nombre: 'X' })).rejects.toThrow('update failed');
    });
  });

  // ── deactivate ─────────────────────────────────────────────────────────
  describe('deactivate', () => {
    it('resolves without error on success', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      await expect(adapter.deactivate(1)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'delete error' },
        count: null,
      });

      await expect(adapter.deactivate(1)).rejects.toThrow('delete error');
    });
  });
});
