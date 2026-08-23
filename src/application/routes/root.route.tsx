import { createRootRoute, Outlet } from '@tanstack/react-router';
import { BootstrapSplash } from '@infra/components/ui/shared/BootstrapSplash';
import { COMMON_NS, i18n, type SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { ErrorPage } from '@infra/pages/ErrorPage';

export const rootRoute = createRootRoute({
  beforeLoad: async () => {
    const language = i18n.language as SupportedLanguage;
    await loadNamespaces(i18n, language, [COMMON_NS]);
  },
  component: () => <Outlet />,
  pendingComponent: BootstrapSplash,
  notFoundComponent: () => <ErrorPage />,
});
