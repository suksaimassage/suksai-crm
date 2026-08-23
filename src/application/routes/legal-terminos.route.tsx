import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.route';
import { i18n, type SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { getNamespacesByRoute } from '@infra/i18n/namespace-resolver';

// Public route — no auth check, no useUserStore read. Términos de Uso is
// accessible to anyone (linked from LoginPage and DashboardPage footer).
export const legalTerminosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/terminos-uso',
  beforeLoad: async () => {
    const language = i18n.language as SupportedLanguage;
    await loadNamespaces(i18n, language, getNamespacesByRoute('/legal/terminos-uso'));
  },
  component: lazyRouteComponent(() => import('@infra/pages/LegalPage'), 'TerminosDeUsoPage'),
});
