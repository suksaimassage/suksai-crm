/**
 * supabase.mock.ts — Shared Supabase client mock factory for adapter tests.
 *
 * Builds a fully chainable mock that mirrors the Supabase JS client API.
 * Each test sets the resolved value on the appropriate terminal method
 * (maybeSingle, single, or the chain itself for list queries).
 */
import { vi } from 'vitest';

// ── Types ──────────────────────────────────────────────────────────────────────

interface IMockChainResolution {
  readonly success: boolean;
  readonly data: unknown;
  readonly error: { message?: string; code?: string } | null;
  readonly count?: number | null;
}

export interface IMockChainExtras {
  setResolution: (value: IMockChainResolution) => void;
  _thenResolution: IMockChainResolution;
}

// Build a chainable mock object where every method returns `this`
// so the full fluent chain resolves at the terminal await point.
export function buildMockChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'gte',
    'lte',
    'lt',
    'not',
    'range',
    'order',
    'insert',
    'update',
    'delete',
    'upsert',
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal async methods — tests set .mockResolvedValue on these
  chain.single = vi.fn();
  chain.maybeSingle = vi.fn();

  // Make the chain object itself thenable so that `await chain` works.
  // Tests that need a specific resolution for the chain call setChainResolution().
  // Default: resolves to a success response with no data
  (chain as Record<string, unknown>)._thenResolution = {
    success: true,
    data: null,
    error: null,
    count: null,
  };

  chain.then = vi
    .fn()
    .mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve((chain as Record<string, unknown>)._thenResolution).then(resolve),
    );

  // Helper to set what `await chain` resolves to for delete/update chains
  (chain as Record<string, unknown>).setResolution = (value: unknown) => {
    (chain as Record<string, unknown>)._thenResolution = value;
    chain.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve((chain as Record<string, unknown>)._thenResolution).then(resolve),
    );
  };

  return chain as typeof chain & IMockChainExtras;
}

export type TMockChain = ReturnType<typeof buildMockChain>;

export function buildSupabaseMock() {
  const mockChain = buildMockChain();
  const mockFrom = vi.fn().mockReturnValue(mockChain);
  const mockRpc = vi.fn();

  const mockSupabase = {
    from: mockFrom,
    rpc: mockRpc,
  };

  return { mockSupabase, mockChain, mockFrom, mockRpc };
}
