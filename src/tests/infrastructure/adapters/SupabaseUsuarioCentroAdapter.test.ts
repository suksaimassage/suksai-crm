import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IUsuariosCentroRow } from '@infra/adapters/database.types';
import { BusinessRuleViolation } from '@domain/types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseUsuarioCentroAdapter } =
  await import('@infra/adapters/SupabaseUsuarioCentroAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const usuarioCentroRow: IUsuariosCentroRow = {
  id: 1,
  usuario_id: 5,
  centro_id: 10,
  es_principal: false,
  activo: true,
  created_at: '2024-01-10T00:00:00Z',
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
describe('SupabaseUsuarioCentroAdapter', () => {
  let adapter: InstanceType<typeof SupabaseUsuarioCentroAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseUsuarioCentroAdapter();
  });

  // ── assign ─────────────────────────────────────────────────────────────
  describe('assign', () => {
    it('returns mapped IUsuarioCentro on success', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: usuarioCentroRow,
        error: null,
        count: null,
      });

      const result = await adapter.assign(5, 10);

      expect(result.usuarioId).toBe(5);
      expect(result.centroId).toBe(10);
      expect(result.esPrincipal).toBe(false);
      expect(result.activo).toBe(true);
      expect(result.assignedAt).toBeInstanceOf(Date);
    });

    it('maps assignedAt from created_at', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: usuarioCentroRow,
        error: null,
        count: null,
      });

      const result = await adapter.assign(5, 10);
      expect(result.assignedAt).toEqual(new Date('2024-01-10T00:00:00Z'));
    });

    it('throws BusinessRuleViolation when already assigned', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { code: '23505', message: 'unique constraint violation' },
        count: null,
      });

      await expect(adapter.assign(5, 10)).rejects.toThrow(BusinessRuleViolation);
      await expect(adapter.assign(5, 10)).rejects.toMatchObject({
        code: 'USUARIO_ALREADY_ASSIGNED',
      });
    });

    it('throws generic Error on non-duplicate DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { code: '42601', message: 'syntax error in query' },
        count: null,
      });

      await expect(adapter.assign(5, 10)).rejects.toThrow('syntax error in query');
      await expect(adapter.assign(5, 10)).rejects.not.toThrow(BusinessRuleViolation);
    });

    it('passes esPrincipal to the insert payload', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: { ...usuarioCentroRow, es_principal: true },
        error: null,
        count: null,
      });

      const result = await adapter.assign(5, 10, true);
      expect(result.esPrincipal).toBe(true);
    });

    it('sets activo: true in the insert payload', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: usuarioCentroRow,
        error: null,
        count: null,
      });

      await adapter.assign(5, 10);
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({ activo: true }));
    });
  });

  // ── unassign ───────────────────────────────────────────────────────────
  // This method chains .delete().eq().eq() where the whole expression is awaited.
  // The chain object itself must be thenable — use setResolution() helper.
  describe('unassign', () => {
    it('resolves without error on success', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await expect(adapter.unassign(5, 10)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'update failed' },
      });

      await expect(adapter.unassign(5, 10)).rejects.toThrow('update failed');
    });
  });

  // ── findByUsuario ──────────────────────────────────────────────────────
  describe('findByUsuario', () => {
    it('returns centros assigned to a usuario', async () => {
      // Adapter chains .eq('usuario_id', ...).eq('activo', true) — use setResolution
      mockChain.setResolution({
        success: true,
        data: [usuarioCentroRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByUsuario(5);

      expect(result).toHaveLength(1);
      expect(result[0].usuarioId).toBe(5);
      expect(result[0].centroId).toBe(10);
    });

    it('returns empty array when user has no centros', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByUsuario(5);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'query error' },
        count: null,
      });

      await expect(adapter.findByUsuario(5)).rejects.toThrow('query error');
    });
  });

  // ── findByCentro ───────────────────────────────────────────────────────
  describe('findByCentro', () => {
    it('returns usuarios assigned to a centro', async () => {
      // Adapter chains .eq('centro_id', ...).eq('activo', true) — use setResolution
      mockChain.setResolution({
        success: true,
        data: [usuarioCentroRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByCentro(10);

      expect(result).toHaveLength(1);
      expect(result[0].centroId).toBe(10);
    });

    it('returns empty array when centro has no usuarios', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByCentro(10);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'lookup failed' },
        count: null,
      });

      await expect(adapter.findByCentro(10)).rejects.toThrow('lookup failed');
    });
  });

  // ── setPrincipal ───────────────────────────────────────────────────────
  describe('setPrincipal', () => {
    it('resets all centers then sets the target as principal', async () => {
      // First update (reset all to false): resolved via the chain's then()
      // Second update (set target to true): also resolved via chain's then()
      mockChain.setResolution({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      await expect(adapter.setPrincipal(5, 10)).resolves.toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios_centro');
      expect(mockChain.update).toHaveBeenCalledWith({ es_principal: false });
      expect(mockChain.update).toHaveBeenCalledWith({ es_principal: true });
    });

    it('throws Error when the reset update fails', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'reset failed' },
        count: null,
      });

      await expect(adapter.setPrincipal(5, 10)).rejects.toThrow('reset failed');
    });
  });
});
