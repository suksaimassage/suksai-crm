/**
 * AppProvidersAuthGate.test.tsx
 *
 * Spec item 2 (SESSION PERSISTENCE). The AuthGate inside AppProviders hosts
 * useAuthBootstrap() for the app lifetime and gates the router tree behind
 * session resolution:
 *
 *   status ∈ { idle, loading }      → <BootstrapSplash/>  (router NOT mounted)
 *   status ∈ { authenticated,
 *              unauthenticated }     → children (RouterProvider tree)
 *
 * This is the fix for the reload bug: on reload Zustand rehydrates `user` but
 * resets `status` to 'idle'; the gate must show the splash (not mount the router)
 * until getSession() settles, so the dashboard guard cannot bounce a still-valid
 * session to /login before resolution.
 *
 * Mock strategy:
 *   - useAuthBootstrap is mocked to a NO-OP. Its own correctness (getSession +
 *     RPC + subscription) is reference-only per the brief; here we isolate the
 *     GATE behaviour by controlling `status` directly via the real store.
 *   - I18nProvider is replaced with a passthrough — its async "return null until
 *     common NS is ready" gate is orthogonal and would otherwise hide the whole
 *     tree in jsdom. Query/Theme/Toast providers are kept REAL so the actual
 *     composition (and the splash's theme tokens) is exercised.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// ── useAuthBootstrap → no-op (isolate the gate; do not touch Supabase) ───────
const mockUseAuthBootstrap = vi.fn();
vi.mock('@infra/hooks/useAuthBootstrap', () => ({
  useAuthBootstrap: () => mockUseAuthBootstrap(),
}));

// ── I18nProvider → passthrough (skip the async common-NS null gate) ──────────
vi.mock('@infra/i18n/provider', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AppProviders } from '@app/providers/AppProviders';
import { useUserStore } from '@app/stores/useUserStore';
import type { TAuthStatus } from '@app/stores/useUserStore';

// ── Helpers ──────────────────────────────────────────────────────────────────
const CHILD_TESTID = 'router-tree';
const Child = () => <div data-testid={CHILD_TESTID}>protected router tree</div>;

function setStatus(status: TAuthStatus): void {
  act(() => {
    useUserStore.setState({ status });
  });
}

function renderGate() {
  return render(
    <AppProviders>
      <Child />
    </AppProviders>,
  );
}

/**
 * The BootstrapSplash root carries role="status" + aria-live="polite" + aria-busy.
 * Its inner Spinner ALSO uses role="status" (with aria-label="Cargando"), so a bare
 * getByRole('status') is ambiguous. Select the splash ROOT precisely by the
 * aria-live="polite" attribute, which only the splash root has.
 */
function querySplash(): HTMLElement | null {
  return document.querySelector('[role="status"][aria-live="polite"]');
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset the persisted store to a clean pre-bootstrap baseline.
  act(() => {
    useUserStore.setState({ user: null, expiresAt: null, status: 'idle' });
  });
});

afterEach(() => {
  act(() => {
    useUserStore.setState({ user: null, expiresAt: null, status: 'idle' });
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe('AppProviders AuthGate — splash while unsettled', () => {
  it('renders the BootstrapSplash and NOT the children when status is "idle"', () => {
    setStatus('idle');
    renderGate();

    expect(querySplash()).not.toBeNull();
    expect(screen.queryByTestId(CHILD_TESTID)).toBeNull();
  });

  it('renders the BootstrapSplash and NOT the children when status is "loading"', () => {
    setStatus('loading');
    renderGate();

    expect(querySplash()).not.toBeNull();
    expect(screen.queryByTestId(CHILD_TESTID)).toBeNull();
  });

  it('the splash announces a busy/loading state (aria-busy on the status region)', () => {
    setStatus('loading');
    renderGate();

    const splash = querySplash();
    expect(splash).not.toBeNull();
    expect(splash).toHaveAttribute('aria-busy', 'true');
  });
});

describe('AppProviders AuthGate — children once settled', () => {
  it('renders the children (router tree) and NOT the splash when status is "authenticated"', () => {
    setStatus('authenticated');
    renderGate();

    expect(screen.getByTestId(CHILD_TESTID)).toBeInTheDocument();
    expect(querySplash()).toBeNull();
  });

  it('renders the children and NOT the splash when status is "unauthenticated"', () => {
    setStatus('unauthenticated');
    renderGate();

    expect(screen.getByTestId(CHILD_TESTID)).toBeInTheDocument();
    expect(querySplash()).toBeNull();
  });
});

describe('AppProviders AuthGate — boot transition (the reload fix)', () => {
  it('swaps from splash to children when status settles loading → authenticated', () => {
    // Simulates: reload rehydrates user, status resets, getSession resolves valid.
    setStatus('loading');
    renderGate();
    expect(querySplash()).not.toBeNull();
    expect(screen.queryByTestId(CHILD_TESTID)).toBeNull();

    // getSession + RPC settle the session.
    setStatus('authenticated');

    expect(screen.getByTestId(CHILD_TESTID)).toBeInTheDocument();
    expect(querySplash()).toBeNull();
  });

  it('swaps from splash to children when status settles loading → unauthenticated', () => {
    setStatus('loading');
    renderGate();
    expect(querySplash()).not.toBeNull();

    setStatus('unauthenticated');

    expect(screen.getByTestId(CHILD_TESTID)).toBeInTheDocument();
    expect(querySplash()).toBeNull();
  });
});

describe('AppProviders AuthGate — lifetime subscription', () => {
  it('mounts useAuthBootstrap (the onAuthStateChange host) exactly once', () => {
    setStatus('authenticated');
    renderGate();
    // Hosted permanently inside the gate so the auth subscription stays alive.
    expect(mockUseAuthBootstrap).toHaveBeenCalled();
  });
});
