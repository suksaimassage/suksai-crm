import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { ITipoServiciosRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseTipoServicioAdapter } = await import('@infra/adapters/SupabaseTipoServicioAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const tipoRow1: ITipoServiciosRow = {
  id: 1,
  nombre: 'Masaje Relajante',
  categoria: 'masajes',
  created_at: '2024-01-01T00:00:00Z',
};

const tipoRow2: ITipoServiciosRow = {
  id: 2,
  nombre: 'Tratamiento Facial',
  categoria: 'facial',
  created_at: '2024-01-02T00:00:00Z',
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
describe('SupabaseTipoServicioAdapter', () => {
  let adapter: InstanceType<typeof SupabaseTipoServicioAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseTipoServicioAdapter();
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns all tipos de servicio', async () => {
      mockChain.select.mockResolvedValue({
        success: true,
        data: [tipoRow1, tipoRow2],
        error: null,
        count: null,
      });

      const result = await adapter.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].nombre).toBe('Masaje Relajante');
    });

    it('maps descripcion to null (no descripcion column in DB)', async () => {
      mockChain.select.mockResolvedValue({
        success: true,
        data: [tipoRow1],
        error: null,
        count: null,
      });

      const result = await adapter.findAll();
      expect(result[0].descripcion).toBeNull();
    });

    it('returns empty array when no tipos exist', async () => {
      mockChain.select.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.findAll();
      expect(result).toHaveLength(0);
    });

    it('returns empty array when data is null', async () => {
      mockChain.select.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.findAll();
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.select.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'select error' },
        count: null,
      });

      await expect(adapter.findAll()).rejects.toThrow('select error');
    });
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped ITipoServicio when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: tipoRow1,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('Masaje Relajante');
      expect(result!.descripcion).toBeNull();
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
        error: { message: 'not found error' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('not found error');
    });
  });
});
