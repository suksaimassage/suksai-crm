import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IUsuariosRow } from '@infra/adapters/database.types';

// ── Mock the supabase client module ────────────────────────────────────────
const { mockSupabase, mockChain, mockRpc: _mockRpc } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

// Import AFTER mock is registered
const { SupabaseUsuarioAdapter } = await import('@infra/adapters/SupabaseUsuarioAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const usuarioRow: IUsuariosRow = {
  id: 1,
  nombre: 'Ana García',
  apellidos: 'García',
  email: 'ana@example.com',
  telefono: null,
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  auth_user_id: null,
};

const usuarioRow2: IUsuariosRow = {
  id: 2,
  nombre: 'Carlos López',
  apellidos: 'López',
  email: 'carlos@example.com',
  telefono: '+34 600 000 001',
  is_active: false,
  created_at: '2024-01-20T09:00:00Z',
  updated_at: '2024-02-01T08:00:00Z',
  auth_user_id: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function resetMocks() {
  vi.clearAllMocks();
  // Restore chain references after clearAllMocks
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
describe('SupabaseUsuarioAdapter', () => {
  let adapter: InstanceType<typeof SupabaseUsuarioAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseUsuarioAdapter();
  });

  // ── findById ──────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped IUsuario when row exists', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: usuarioRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('Ana García');
      expect(result!.email).toBe('ana@example.com');
      expect(result!.activo).toBe(true);
      expect(result!.apellidos).toBe('García');
      expect(result!.telefono).toBeNull();
    });

    it('returns null when row is not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findById(999);
      expect(result).toBeNull();
    });

    it('throws Error when Supabase returns an error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'DB error' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('DB error');
    });

    it('maps createdAt from created_at and updatedAt from updated_at', async () => {
      const rowWithDifferentUpdated: IUsuariosRow = {
        ...usuarioRow,
        updated_at: '2024-03-10T12:00:00Z',
      };
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: rowWithDifferentUpdated,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result!.updatedAt).toEqual(new Date('2024-03-10T12:00:00Z'));
    });
  });

  // ── findByEmail ────────────────────────────────────────────────────────
  describe('findByEmail', () => {
    it('returns mapped IUsuario when row exists', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: usuarioRow,
        error: null,
        count: null,
      });

      const result = await adapter.findByEmail('ana@example.com');
      expect(result!.email).toBe('ana@example.com');
    });

    it('returns null when email not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findByEmail('missing@example.com');
      expect(result).toBeNull();
    });

    it('throws Error on DB error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'connection refused' },
        count: null,
      });

      await expect(adapter.findByEmail('x@x.com')).rejects.toThrow('connection refused');
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns paginated result with default params', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [usuarioRow, usuarioRow2],
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

    it('respects explicit pagination params', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [usuarioRow],
        error: null,
        count: 10,
      });

      const result = await adapter.findAll({ page: 2, perPage: 5 });

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(5);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(2);
    });

    it('returns empty array when no users exist', async () => {
      mockChain.range.mockResolvedValue({ success: true, data: [], error: null, count: 0 });

      const result = await adapter.findAll();
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.range.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'timeout' },
        count: null,
      });

      await expect(adapter.findAll()).rejects.toThrow('timeout');
    });
  });

  // ── findByCentro ───────────────────────────────────────────────────────
  describe('findByCentro', () => {
    it('returns mapped users belonging to a centro', async () => {
      const joinRow = { usuarios: usuarioRow };
      mockChain.eq.mockResolvedValue({ success: true, data: [joinRow], error: null, count: null });

      const result = await adapter.findByCentro(10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('filters out null usuarios from join result', async () => {
      mockChain.eq.mockResolvedValue({
        success: true,
        data: [{ usuarios: null }],
        error: null,
        count: null,
      });

      const result = await adapter.findByCentro(10);
      expect(result).toHaveLength(0);
    });

    it('returns empty array when data is null', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByCentro(10);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'foreign key error' },
        count: null,
      });

      await expect(adapter.findByCentro(10)).rejects.toThrow('foreign key error');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped IUsuario on successful insert', async () => {
      const insertedRow: IUsuariosRow = {
        ...usuarioRow,
        id: 5,
        nombre: 'Nuevo Usuario',
        email: 'nuevo@example.com',
        apellidos: '',
      };
      mockChain.single.mockResolvedValue({
        success: true,
        data: insertedRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        nombre: 'Nuevo Usuario',
        apellidos: '',
        email: 'nuevo@example.com',
      });

      expect(result.id).toBe(5);
      expect(result.nombre).toBe('Nuevo Usuario');
      expect(result.email).toBe('nuevo@example.com');
      expect(result.activo).toBe(true);
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'insert failed' },
        count: null,
      });

      await expect(
        adapter.create({ nombre: 'X', apellidos: '', email: 'x@x.com' }),
      ).rejects.toThrow('insert failed');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated IUsuario', async () => {
      const updatedRow = { ...usuarioRow, nombre: 'Ana Modificada' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { nombre: 'Ana Modificada' });
      expect(result.nombre).toBe('Ana Modificada');
    });

    it('handles activo field mapping to is_active', async () => {
      const updatedRow = { ...usuarioRow, is_active: false };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { activo: false });
      expect(result.activo).toBe(false);
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

    it('throws Error when DB returns error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'row not found' },
        count: null,
      });

      await expect(adapter.deactivate(99)).rejects.toThrow('row not found');
    });
  });
});
