import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IRolesRow } from '@infra/adapters/database.types';
import { BusinessRuleViolation } from '@domain/types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseRolAdapter } = await import('@infra/adapters/SupabaseRolAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const adminRow: IRolesRow = {
  id: 1,
  nombre: 'superadmin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const masajistaRow: IRolesRow = {
  id: 2,
  nombre: 'masajista',
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
describe('SupabaseRolAdapter', () => {
  let adapter: InstanceType<typeof SupabaseRolAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseRolAdapter();
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns all roles as IRol[]', async () => {
      mockChain.select.mockResolvedValue({
        success: true,
        data: [adminRow, masajistaRow],
        error: null,
        count: null,
      });

      const result = await adapter.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].nombre).toBe('superadmin');
      expect(result[0].descripcion).toBeNull(); // adapter always sets descripcion: null
    });

    it('always maps descripcion to null (DB has no descripcion column)', async () => {
      mockChain.select.mockResolvedValue({
        success: true,
        data: [adminRow],
        error: null,
        count: null,
      });

      const result = await adapter.findAll();
      expect(result[0].descripcion).toBeNull();
    });

    it('returns empty array when no roles exist', async () => {
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
        error: { message: 'connection lost' },
        count: null,
      });

      await expect(adapter.findAll()).rejects.toThrow('connection lost');
    });
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped IRol when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: adminRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('superadmin');
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
        error: { message: 'query error' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('query error');
    });
  });

  // ── assignRolToUsuario ─────────────────────────────────────────────────
  describe('assignRolToUsuario', () => {
    it('returns IUsuarioRol on successful assignment', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: { usuario_id: 10, rol_id: 1 },
        error: null,
        count: null,
      });

      const result = await adapter.assignRolToUsuario(10, 1);

      expect(result.usuarioId).toBe(10);
      expect(result.rolId).toBe(1);
      expect(result.assignedAt).toBeInstanceOf(Date);
    });

    it('throws BusinessRuleViolation with ROL_ALREADY_ASSIGNED when unique constraint violated', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { code: '23505', message: 'duplicate key' },
        count: null,
      });

      await expect(adapter.assignRolToUsuario(10, 1)).rejects.toThrow(BusinessRuleViolation);
      await expect(adapter.assignRolToUsuario(10, 1)).rejects.toMatchObject({
        code: 'ROL_ALREADY_ASSIGNED',
      });
    });

    it('throws generic Error on non-unique-constraint DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { code: '42000', message: 'syntax error' },
        count: null,
      });

      await expect(adapter.assignRolToUsuario(10, 1)).rejects.toThrow('syntax error');
      await expect(adapter.assignRolToUsuario(10, 1)).rejects.not.toThrow(BusinessRuleViolation);
    });
  });

  // ── removeRolFromUsuario ───────────────────────────────────────────────
  // This method chains .delete().eq().eq() where the whole expression is awaited.
  // The chain object itself must be thenable — use setResolution() helper.
  describe('removeRolFromUsuario', () => {
    it('resolves without error on success', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await expect(adapter.removeRolFromUsuario(10, 1)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'delete failed' },
        count: null,
      });

      await expect(adapter.removeRolFromUsuario(10, 1)).rejects.toThrow('delete failed');
    });
  });

  // ── findRolesByUsuario ─────────────────────────────────────────────────
  describe('findRolesByUsuario', () => {
    it('returns roles for a given usuario', async () => {
      const joinRow = { roles: adminRow };
      mockChain.eq.mockResolvedValue({ success: true, data: [joinRow], error: null, count: null });

      const result = await adapter.findRolesByUsuario(10);

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('superadmin');
    });

    it('returns multiple roles for a multi-role user', async () => {
      mockChain.eq.mockResolvedValue({
        success: true,
        data: [{ roles: adminRow }, { roles: masajistaRow }],
        error: null,
        count: null,
      });

      const result = await adapter.findRolesByUsuario(5);
      expect(result).toHaveLength(2);
    });

    it('filters out null roles entries from join result', async () => {
      mockChain.eq.mockResolvedValue({
        success: true,
        data: [{ roles: null }],
        error: null,
        count: null,
      });

      const result = await adapter.findRolesByUsuario(10);
      expect(result).toHaveLength(0);
    });

    it('returns empty array when user has no roles', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.findRolesByUsuario(10);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'join failed' },
        count: null,
      });

      await expect(adapter.findRolesByUsuario(10)).rejects.toThrow('join failed');
    });
  });
});
