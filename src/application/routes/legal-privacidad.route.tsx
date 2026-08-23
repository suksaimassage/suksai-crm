import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.route';
import { i18n, type SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { getNamespacesByRoute } from '@infra/i18n/namespace-resolver';

// Public route — no auth check, no useUserStore read. Política de Privacidad
// is accessible to anyone (linked from LoginPage and DashboardPage footer).
export const legalPrivacidadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/privacidad',
  beforeLoad: async () => {
    const language = i18n.language as SupportedLanguage;
    await loadNamespaces(i18n, language, getNamespacesByRoute('/legal/privacidad'));
  },
  component: lazyRouteComponent(() => import('@infra/pages/LegalPage'), 'PoliticaPrivacidadPage'),
});
