/**
 * SupabaseUsuarioCentroAdapter.findPrincipalByUsuario.test.ts
 *
 * Spec item 5 (data layer / adapter). Covers the new
 * `findPrincipalByUsuario` method that resolves the user's ACTIVE primary
 * assignment (suksai.usuarios_centro WHERE es_principal = true AND activo = true).
 *
 * The adapter terminates the query with `.maybeSingle()` (custom result shape
 * { success, data, error, count } — NOT { data, error }). Mirrors the existing
 * SupabaseUsuarioCentroAdapter.test.ts setup exactly.
 *
 * Behavior under test (not implementation):
 *   - returns a mapped IUsuarioCentro when a primary row exists (hit),
 *   - returns null when no row matches (miss — maybeSingle resolves data: null),
 *   - throws when the DB reports an error,
 *   - constrains the query to es_principal = true AND activo = true (the contract
 *     that makes an inactive-only assignment resolve to "no primary").
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IUsuariosCentroRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseUsuarioCentroAdapter } =
  await import('@infra/adapters/SupabaseUsuarioCentroAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const principalRow: IUsuariosCentroRow = {
  id: 7,
  usuario_id: 5,
  centro_id: 10,
  es_principal: true,
  activo: true,
  created_at: '2024-02-01T00:00:00Z',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function resetMocks() {
  vi.clearAllMocks();
  const methods = ['select', 'eq', 'neq', 'in', 'or', 'gte', 'lte', 'lt', 'range', 'order'];
  for (const m of methods) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockSupabase.from.mockReturnValue(mockChain);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('SupabaseUsuarioCentroAdapter.findPrincipalByUsuario', () => {
  let adapter: InstanceType<typeof SupabaseUsuarioCentroAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseUsuarioCentroAdapter();
  });

  it('returns the mapped IUsuarioCentro when an active primary row exists', async () => {
    mockChain.maybeSingle.mockResolvedValue({
      success: true,
      data: principalRow,
      error: null,
      count: null,
    });

    const result = await adapter.findPrincipalByUsuario(5);

    expect(result).not.toBeNull();
    expect(result?.usuarioId).toBe(5);
    expect(result?.centroId).toBe(10);
    expect(result?.esPrincipal).toBe(true);
    expect(result?.activo).toBe(true);
    expect(result?.assignedAt).toEqual(new Date('2024-02-01T00:00:00Z'));
  });

  it('returns null when no primary row matches (maybeSingle resolves data: null)', async () => {
    mockChain.maybeSingle.mockResolvedValue({
      success: true,
      data: null,
      error: null,
      count: null,
    });

    const result = await adapter.findPrincipalByUsuario(5);
    expect(result).toBeNull();
  });

  it('throws an Error when the DB reports a failure', async () => {
    mockChain.maybeSingle.mockResolvedValue({
      success: false,
      data: null,
      error: { message: 'multiple (or no) rows returned' },
      count: null,
    });

    await expect(adapter.findPrincipalByUsuario(5)).rejects.toThrow(
      'multiple (or no) rows returned',
    );
  });

  it('constrains the query to the usuario, es_principal = true AND activo = true', async () => {
    mockChain.maybeSingle.mockResolvedValue({
      success: true,
      data: principalRow,
      error: null,
      count: null,
    });

    await adapter.findPrincipalByUsuario(5);

    expect(mockSupabase.from).toHaveBeenCalledWith('usuarios_centro');
    expect(mockChain.eq).toHaveBeenCalledWith('usuario_id', 5);
    expect(mockChain.eq).toHaveBeenCalledWith('es_principal', true);
    expect(mockChain.eq).toHaveBeenCalledWith('activo', true);
    // Terminal is maybeSingle (single primary row, null-safe), not single.
    expect(mockChain.maybeSingle).toHaveBeenCalledTimes(1);
    expect(mockChain.single).not.toHaveBeenCalled();
  });
});
