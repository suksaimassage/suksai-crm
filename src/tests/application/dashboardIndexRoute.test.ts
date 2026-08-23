/**
 * dashboardIndexRoute.test.ts
 *
 * Spec item 1 (ROUTER REDIRECT). Visiting exactly /dashboard must redirect to
 * /dashboard/overview. The implementation is a dashboard index route
 * (path '/', child of dashboardRoute) whose beforeLoad throws
 * redirect({ to: '/dashboard/overview' }).
 *
 * We assert the route's contract directly (no full RouterProvider needed):
 *   - it owns the bare path '/' under the dashboard parent,
 *   - its beforeLoad throws a TanStack redirect targeting /dashboard/overview.
 *
 * The parent dashboardRoute.beforeLoad (auth guard) runs FIRST in the real
 * router, so unauthenticated users still bounce to /login before this redirect —
 * that ordering is covered by the dashboard auth-guard / RBAC tests; here we
 * verify only the index route's own redirect behaviour.
 */

import { describe, it, expect } from 'vitest';
import { isRedirect } from '@tanstack/react-router';
import { dashboardIndexRoute } from '@app/routes/dashboard-index.route';
import { dashboardRoute } from '@app/routes/dashboard.route';

describe('dashboardIndexRoute — item 1: /dashboard → /dashboard/overview', () => {
  it('owns the bare path "/" so it matches exact /dashboard', () => {
    // The configured path lives on options at runtime; TanStack types narrow
    // `options.path` to a union that omits the literal, so cast to read it.
    const opts = dashboardIndexRoute.options as { path?: string };
    expect(opts.path).toBe('/');
  });

  it('is a child of dashboardRoute (so the parent auth guard runs first)', () => {
    expect(dashboardIndexRoute.options.getParentRoute()).toBe(dashboardRoute);
  });

  it('beforeLoad throws a redirect to /dashboard/overview', () => {
    const beforeLoad = dashboardIndexRoute.options.beforeLoad;
    expect(beforeLoad).toBeTypeOf('function');

    let thrown: unknown;
    try {
      // beforeLoad takes no inputs in this route — the redirect is unconditional.
      (beforeLoad as () => void)();
      expect.unreachable('beforeLoad must throw a redirect');
    } catch (err) {
      thrown = err;
    }

    expect(isRedirect(thrown)).toBe(true);
    // TanStack stores the redirect target under `.options.to` on the thrown value.
    expect((thrown as { options: { to: string } }).options.to).toBe('/dashboard/overview');
  });
});
