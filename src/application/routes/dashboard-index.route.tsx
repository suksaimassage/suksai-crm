import { createRoute, redirect } from '@tanstack/react-router';
import { dashboardRoute } from './dashboard.route';

/**
 * Dashboard index route — owns the bare `/dashboard` path and redirects to
 * `/dashboard/overview`. The parent `dashboardRoute.beforeLoad` (auth guard)
 * runs first, so unauthenticated users still bounce to `/login` before this
 * redirect is reached. Registered as the FIRST child of dashboardRoute.
 */
export const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/overview' });
  },
});
