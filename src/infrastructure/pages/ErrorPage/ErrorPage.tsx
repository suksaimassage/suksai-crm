/**
 * NotFoundPage
 *
 * Página de error 404 para rutas no encontradas.
 *
 * Principios aplicados:
 * - Single Responsibility: Solo gestiona el estado de ruta no encontrada.
 *
 * ✅ FIX: Reemplazado `useNavigate` por `<Link>` de TanStack Router.
 *
 * PROBLEMA:
 *   useNavigate() + navigate({ to: "/" }) → Error de compilación:
 *   "Property 'search' is missing in type '{ to: "/" }'"
 *
 *   En TanStack Router v1, cuando `navigate()` se llama sin `from`,
 *   el compilador no puede resolver el tipo de `search` params de la ruta
 *   destino. Al no poder inferirlo, TypeScript lo marca como requerido.
 *
 * SOLUCIÓN PREFERIDA — `<Link>` en lugar de `useNavigate`:
 *   - El componente `Link` tiene tipado automático: infiere `to` y `search`
 *     directamente del routeTree sin necesidad de `from`.
 *   - Semánticamente correcto: un botón "Volver al inicio" es un enlace.
 *   - Mejor accesibilidad: `<a>` nativo vs `<button onClick>`.
 *   - Sin `useCallback` innecesario.
 *
 * ALTERNATIVA si se necesita navegación imperativa (dentro de lógica):
 *   navigate({ to: "/", search: {} })
 *   navigate({ to: APP_ROUTES.home.path as never })
 */

import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Typography } from '@infra/components/ui/core/Typography';
import * as S from './ErrorPage.styles';

export function ErrorPage() {
  const { t } = useTranslation('common');

  return (
    <S.Page id="main-content" role="main" aria-label={t('error.notFound.ariaLabel')}>
      <S.Content>
        <Typography variant="largeTitle" align="center" gutterBottom>
          404
        </Typography>
        <Typography variant="h3" align="center" gutterBottom>
          {t('error.notFound.heading')}
        </Typography>
        <Typography variant="body" color="secondary" align="center" gutterBottom>
          {t('error.notFound.description')}
        </Typography>
        <S.BackLink as={Link} to={'/'}>
          <Typography variant="body" weight="medium" color="inverse">
            {t('error.notFound.backHome')}
          </Typography>
        </S.BackLink>
      </S.Content>
    </S.Page>
  );
}
