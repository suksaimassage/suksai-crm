import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { rootRoute } from './root.route';
import { useUserStore } from '@app/stores/useUserStore';
import { getRoleHomePath } from './home-by-role';
import { i18n, type SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { getNamespacesByRoute } from '@infra/i18n/namespace-resolver';

const loginSearchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/[a-zA-Z0-9/_-]*$/)
    .optional(),
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ location, search }) => {
    const language = i18n.language as SupportedLanguage;
    const requiredNamespaces = getNamespacesByRoute(location.pathname);
    await loadNamespaces(i18n, language, requiredNamespaces);

    const { status, user } = useUserStore.getState();
    if (status === 'authenticated') {
      const homePath = user ? getRoleHomePath(user.roles) : '/dashboard/overview';
      throw redirect({ to: search.redirect ?? homePath });
    }
  },
  component: lazyRouteComponent(() => import('@infra/pages/LoginPage'), 'LoginPage'),
});
