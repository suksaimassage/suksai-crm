import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IClientesRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseClienteAdapter } = await import('@infra/adapters/SupabaseClienteAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const clienteRow: IClientesRow = {
  id: 1,
  nombre: 'María',
  apellidos: 'Fernández',
  email: 'maria@example.com',
  telefono: '612345678',
  observaciones: 'Cliente VIP',
  created_at: '2024-01-01T00:00:00Z',
};

const clienteRowMinimal: IClientesRow = {
  id: 2,
  nombre: 'Juan',
  apellidos: null,
  email: null,
  telefono: null,
  observaciones: null,
  created_at: '2024-02-01T00:00:00Z',
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
describe('SupabaseClienteAdapter', () => {
  let adapter: InstanceType<typeof SupabaseClienteAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseClienteAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped ICliente when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('María');
      expect(result!.apellidos).toBe('Fernández');
      expect(result!.email).toBe('maria@example.com');
      expect(result!.telefono).toBe('612345678');
    });

    it('maps null apellidos to empty string', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRowMinimal,
        error: null,
        count: null,
      });

      const result = await adapter.findById(2);
      expect(result!.apellidos).toBe('');
    });

    it('maps null telefono to empty string', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRowMinimal,
        error: null,
        count: null,
      });

      const result = await adapter.findById(2);
      expect(result!.telefono).toBe('');
    });

    it('maps default fields absent from DB schema', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.fechaNacimiento).toBeNull();
      expect(result!.activo).toBe(true);
    });

    it('converts numeric telefono to string', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(typeof result!.telefono).toBe('string');
      expect(result!.telefono).toBe('612345678');
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

  // ── findByEmail ────────────────────────────────────────────────────────
  describe('findByEmail', () => {
    it('returns mapped ICliente when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRow,
        error: null,
        count: null,
      });

      const result = await adapter.findByEmail('maria@example.com');
      expect(result!.email).toBe('maria@example.com');
    });

    it('returns null when not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findByEmail('noexiste@example.com');
      expect(result).toBeNull();
    });

    it('throws Error on DB error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'email query error' },
        count: null,
      });

      await expect(adapter.findByEmail('x@x.com')).rejects.toThrow('email query error');
    });
  });

  // ── findByTelefono ─────────────────────────────────────────────────────
  describe('findByTelefono', () => {
    it('returns mapped ICliente when found by telefono string', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: clienteRow,
        error: null,
        count: null,
      });

      const result = await adapter.findByTelefono('612345678');
      expect(result!.id).toBe(1);
    });

    it('queries the DB for any string telefono (no numeric guard)', async () => {
      // Non-numeric strings are valid character varying values — adapter always queries DB.
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findByTelefono('not-a-number');
      expect(result).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('clientes');
    });

    it('returns null when not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findByTelefono('999999999');
      expect(result).toBeNull();
    });

    it('throws Error on DB error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'tel query error' },
        count: null,
      });

      await expect(adapter.findByTelefono('612345678')).rejects.toThrow('tel query error');
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns paginated result with default params', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [clienteRow, clienteRowMinimal],
        error: null,
        count: 2,
      });

      const result = await adapter.findAll();

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(50);
    });

    it('respects explicit pagination params', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [clienteRow],
        error: null,
        count: 100,
      });

      const result = await adapter.findAll({ page: 3, perPage: 20 });

      expect(result.page).toBe(3);
      expect(result.perPage).toBe(20);
      expect(result.totalPages).toBe(5); // ceil(100/20)
    });

    it('throws Error on DB error', async () => {
      mockChain.range.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'pagination error' },
        count: null,
      });

      await expect(adapter.findAll()).rejects.toThrow('pagination error');
    });
  });

  // ── search ─────────────────────────────────────────────────────────────
  describe('search', () => {
    it('returns matching clientes', async () => {
      mockChain.or.mockResolvedValue({
        success: true,
        data: [clienteRow],
        error: null,
        count: null,
      });

      const result = await adapter.search('María');
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('María');
    });

    it('returns empty array when no matches', async () => {
      mockChain.or.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.search('zzznomatch');
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.or.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'search error' },
        count: null,
      });

      await expect(adapter.search('X')).rejects.toThrow('search error');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped ICliente from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: clienteRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        nombre: 'María',
        apellidos: 'Fernández',
        email: 'maria@example.com',
        telefono: '612345678',
      });

      expect(result.id).toBe(1);
      expect(result.nombre).toBe('María');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'create failed' },
        count: null,
      });

      await expect(
        adapter.create({ nombre: 'X', apellidos: 'Y', telefono: '000000000' }),
      ).rejects.toThrow('create failed');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated ICliente', async () => {
      const updatedRow = { ...clienteRow, nombre: 'María José' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { nombre: 'María José' });
      expect(result.nombre).toBe('María José');
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
