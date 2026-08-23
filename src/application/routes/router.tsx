import { createRouter } from '@tanstack/react-router';

import { rootRoute } from './root.route';
import { indexRoute } from './index.route';
import { loginRoute } from './login.route';
import { legalTerminosRoute } from './legal-terminos.route';
import { legalPrivacidadRoute } from './legal-privacidad.route';
import { dashboardRoute } from './dashboard.route';
import { dashboardIndexRoute } from './dashboard-index.route';
import { dashboardOverviewRoute } from './dashboard-overview.route';
import { dashboardAgendaRoute } from './dashboard-agenda.route';
import { dashboardClientesRoute } from './dashboard-clientes.route';
import { dashboardRitualesRoute } from './dashboard-rituales.route';
import { dashboardTerapeutasRoute } from './dashboard-terapeutas.route';
import { dashboardCajaRoute } from './dashboard-caja.route';
import { dashboardInformesRoute } from './dashboard-informes.route';
import { dashboardAjustesRoute } from './dashboard-ajustes.route';
import { dashboardCentrosRoute } from './dashboard-centros.route';
import { ErrorPage } from '@infra/pages/ErrorPage';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  legalTerminosRoute,
  legalPrivacidadRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    dashboardOverviewRoute,
    dashboardAgendaRoute,
    dashboardClientesRoute,
    dashboardRitualesRoute,
    dashboardTerapeutasRoute,
    dashboardCajaRoute,
    dashboardInformesRoute,
    dashboardAjustesRoute,
    dashboardCentrosRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: () => {
    return <ErrorPage />;
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
