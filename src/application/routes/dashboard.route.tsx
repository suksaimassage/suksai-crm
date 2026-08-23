import { createRoute, redirect, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.route';
import { useUserStore } from '@app/stores/useUserStore';
import { i18n, type SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { getNamespacesByRoute, DASHBOARD_NS } from '@infra/i18n/namespace-resolver';

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async ({ location }) => {
    const language = i18n.language as SupportedLanguage;
    // 'dashboard' is the shell namespace (Sidebar + topbar) and must load for
    // EVERY /dashboard/* leaf, not just the routes whose page namespace happens
    // to be 'dashboard'. Without this, a hard reload of e.g. /dashboard/agenda
    // would render the shell chrome as raw dashboard:* keys (useSuspense=false,
    // no fallbackNS). Dedupe — overview/centros already include it.
    const requiredNamespaces = [
      ...new Set([...getNamespacesByRoute(location.pathname), DASHBOARD_NS]),
    ];
    await loadNamespaces(i18n, language, requiredNamespaces);

    const { status, expiresAt } = useUserStore.getState();

    if (status === 'idle' || status === 'loading') {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }

    if (status === 'unauthenticated') {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }

    // Supabase Auth auto-refreshes tokens; this is a last-resort fallback guard.
    // clearUser() is intentionally omitted here — onAuthStateChange (SIGNED_OUT)
    // handles it reactively via useAuthBootstrap.
    if (expiresAt !== null && Date.now() > expiresAt) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
  },
  component: lazyRouteComponent(() => import('@infra/pages/DashboardPage'), 'DashboardPage'),
});
