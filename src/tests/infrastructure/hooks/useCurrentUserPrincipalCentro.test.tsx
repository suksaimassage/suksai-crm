/**
 * useCurrentUserPrincipalCentro.test.tsx
 *
 * The hook resolves the authenticated user's primary-centre display name for the
 * sidebar footer. After the masajista-centro RLS bugfix, the resolution was moved
 * server-side: `get_current_user_profile()` (SECURITY DEFINER RPC) now embeds
 * `centroPrincipalNombre` directly in `IAuthenticatedUser`. The hook reads this
 * value synchronously from Zustand — no React Query, no adapter calls.
 *
 * Contract returned to the view: { centroNombre: string | null; isLoading: boolean }.
 * isLoading is always false — the value comes straight from the store.
 * No user (null) → centroNombre = null.
 *
 * Mock strategy: useUserStore is mocked with selector-pattern support so we
 * control the centroPrincipalNombre value returned to the hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ── Store mock (selector-pattern) ────────────────────────────────────────────
vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

import { useUserStore } from '@app/stores/useUserStore';
import { useCurrentUserPrincipalCentro } from '@infra/hooks/useCurrentUserPrincipalCentro';
import type { IAuthenticatedUser } from '@domain/ports';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(centroPrincipalNombre: string | null): IAuthenticatedUser {
  return {
    id: 5,
    nombre: 'test_user',
    apellidos: 'Test',
    email: 'test@example.com',
    roles: ['masajista'],
    isActive: true,
    centroPrincipalNombre,
  };
}

/** Configure the user returned by the store selector. Pass null to simulate no session. */
function setStoreUser(user: IAuthenticatedUser | null): void {
  vi.mocked(useUserStore).mockImplementation((selector) =>
    selector({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
    } as unknown as Parameters<typeof selector>[0]),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useCurrentUserPrincipalCentro — success path', () => {
  it('resolves to the primary centro display name', () => {
    setStoreUser(makeUser('Centro Chamartín'));

    const { result } = renderHook(() => useCurrentUserPrincipalCentro());

    expect(result.current.centroNombre).toBe('Centro Chamartín');
    expect(result.current.isLoading).toBe(false);
  });

  it('returns the centroPrincipalNombre embedded in IAuthenticatedUser from the store', () => {
    setStoreUser(makeUser('Centro X'));

    const { result } = renderHook(() => useCurrentUserPrincipalCentro());

    expect(result.current.centroNombre).toBe('Centro X');
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCurrentUserPrincipalCentro — no primary centre', () => {
  it('returns centroNombre = null when the user has no primary centre (null field)', () => {
    setStoreUser(makeUser(null));

    const { result } = renderHook(() => useCurrentUserPrincipalCentro());

    expect(result.current.centroNombre).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns centroNombre = null when the assignment exists but the centro is missing/inaccessible', () => {
    // The RPC returns null for centroPrincipalNombre when centro is inaccessible.
    setStoreUser(makeUser(null));

    const { result } = renderHook(() => useCurrentUserPrincipalCentro());

    expect(result.current.centroNombre).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCurrentUserPrincipalCentro — error normalisation', () => {
  it('normalises a missing user to centroNombre = null (footer never sees an error)', () => {
    // No user in store → centroNombre = null, never throws.
    setStoreUser(null);

    const { result } = renderHook(() => useCurrentUserPrincipalCentro());

    expect(result.current.centroNombre).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCurrentUserPrincipalCentro — disabled when no user', () => {
  it('returns centroNombre = null when there is no user in the store', () => {
    setStoreUser(null);

    const { result } = renderHook(() => useCurrentUserPrincipalCentro());

    expect(result.current.centroNombre).toBeNull();
    // isLoading is always false — synchronous store read, no query.
    expect(result.current.isLoading).toBe(false);
  });
});
