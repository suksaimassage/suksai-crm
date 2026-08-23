import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { ICentrosRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseCentroAdapter } = await import('@infra/adapters/SupabaseCentroAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const centroRow: ICentrosRow = {
  id: 1,
  nombre: 'Suksai Centro Norte',
  direccion: 'Calle Mayor 10, Madrid',
  ciudad: 'Madrid',
  codigo_postal: '28001',
  telefono: null,
  email: null,
  activo: true,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

const centroRow2: ICentrosRow = {
  id: 2,
  nombre: 'Suksai Centro Sur',
  direccion: 'Av. Sur 20, Barcelona',
  ciudad: 'Barcelona',
  codigo_postal: '08001',
  telefono: null,
  email: null,
  activo: true,
  created_at: '2024-04-01T00:00:00Z',
  updated_at: '2024-04-01T00:00:00Z',
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
describe('SupabaseCentroAdapter', () => {
  let adapter: InstanceType<typeof SupabaseCentroAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseCentroAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped ICentro when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: centroRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('Suksai Centro Norte');
      expect(result!.direccion).toBe('Calle Mayor 10, Madrid');
    });

    it('maps ciudad, codigoPostal, activo from DB columns', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: centroRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result!.ciudad).toBe('Madrid');
      expect(result!.codigoPostal).toBe('28001');
      expect(result!.telefono).toBeNull();
      expect(result!.email).toBeNull();
      expect(result!.activo).toBe(true);
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

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns paginated result with default params', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [centroRow, centroRow2],
        error: null,
        count: 2,
      });

      const result = await adapter.findAll();

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(50);
      expect(result.totalPages).toBe(1);
    });

    it('returns correct pagination with explicit params', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [centroRow],
        error: null,
        count: 15,
      });

      const result = await adapter.findAll({ page: 2, perPage: 10 });

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(2);
    });

    it('throws Error on DB error', async () => {
      mockChain.range.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'query timeout' },
        count: null,
      });

      await expect(adapter.findAll()).rejects.toThrow('query timeout');
    });
  });

  // ── findActivos ────────────────────────────────────────────────────────
  describe('findActivos', () => {
    it('returns only active centros (activo = true)', async () => {
      mockChain.setResolution({
        success: true,
        data: [centroRow, centroRow2],
        error: null,
        count: null,
      });

      const result = await adapter.findActivos();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when none found', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findActivos();
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'fetch error' },
        count: null,
      });

      await expect(adapter.findActivos()).rejects.toThrow('fetch error');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped ICentro from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: centroRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        nombre: 'Suksai Centro Norte',
        direccion: 'Calle Mayor 10, Madrid',
        ciudad: 'Madrid',
        codigoPostal: '28001',
      });

      expect(result.id).toBe(1);
      expect(result.nombre).toBe('Suksai Centro Norte');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'insert failed' },
        count: null,
      });

      await expect(
        adapter.create({ nombre: 'X', direccion: 'Y', ciudad: 'Madrid', codigoPostal: '28001' }),
      ).rejects.toThrow('insert failed');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated ICentro', async () => {
      const updatedRow = { ...centroRow, nombre: 'Centro Actualizado' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { nombre: 'Centro Actualizado' });
      expect(result.nombre).toBe('Centro Actualizado');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'update error' },
        count: null,
      });

      await expect(adapter.update(1, { nombre: 'X' })).rejects.toThrow('update error');
    });
  });

  // ── deactivate ─────────────────────────────────────────────────────────
  describe('deactivate', () => {
    it('resolves without error on success (soft-delete: activo = false)', async () => {
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
