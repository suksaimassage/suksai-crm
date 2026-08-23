/**
 * DashboardPage.tsx
 *
 * Shell layout for the Suksai Thai Massage CRM dashboard.
 * Implements the approved botanical design concept pixel-by-pixel.
 *
 * Layout regions (CSS Grid):
 *   ┌──────────┬──────────────────────────────┐
 *   │          │   Topbar (glassmorphism)      │
 *   │ Sidebar  ├──────────────────────────────┤
 *   │ (jungle  │                              │
 *   │  green)  │  <Outlet /> — child route    │
 *   │          │                              │
 *   └──────────┴──────────────────────────────┘
 *
 * Sidebar:   variant="suksai" → botanical jungle green + gold accents
 * Topbar:    warm-sand glassmorphism, breadcrumbs left, actions right
 * Responsive:
 *   ≥ md (768px)  → sidebar sticky in grid column
 *   < md          → sidebar overlay drawer, FAB toggle bottom-right
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useRouterState } from '@tanstack/react-router';

import { StyledDashbordLayout } from '@infra/components/ui/core/Layout/Layout.styles';
import { Sidebar } from '@infra/components/ui/common/Sidebar';
import { UserMenu } from '@infra/components/ui/common/UserMenu';
import { useUserStore } from '@app/stores/useUserStore';
import { useIsDark, useThemeActions } from '@app/stores/useThemeStore';
import { useSidebarNavigation } from '@infra/hooks/useSidebarNavigation';
import { useCurrentUserPrincipalCentro } from '@infra/hooks/useCurrentUserPrincipalCentro';
import type { SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { getNamespacesByRoute, DASHBOARD_NS } from '@infra/i18n/namespace-resolver';
import { SuksaiBrandLogo, SidebarUserFooter } from './Dashboard.brand';
import { IcoHouse, IcoCaretDown, IcoLotusSun, IcoCrescentMoon } from './Dashboard.icons';
import {
  StyledDashboardTopbar,
  StyledBreadcrumbs,
  StyledCrumbLink,
  StyledCrumbSep,
  StyledCrumbCurrent,
  StyledTopbarActions,
  StyledIconBtn,
  StyledTopbarLangToggle,
  StyledTopbarLangBtn,
  StyledUserMenuPill,
  StyledPillAvatar,
  StyledPillMeta,
  StyledPillCaret,
  StyledMainContent,
  StyledMobileFab,
  StyledDashboardFooter,
  StyledDashboardFooterCopyright,
  StyledDashboardFooterLinks,
} from './DashboardPage.styles';

// ─── Hamburger icon (mobile FAB) ────────────────────────────────────────────

const IcoHamburger = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M3 5h14M3 10h14M3 15h14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const resolveCurrentLabel = (labels: Record<string, string>, pathname: string): string => {
  const match = Object.entries(labels).find(([key]) => pathname.startsWith(key));
  return match?.[1] ?? '';
};

// ─── Component ───────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const { t, i18n } = useTranslation('common');
  const { t: tDash } = useTranslation('dashboard');
  const isDark = useIsDark();
  const { toggleTheme } = useThemeActions();
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';

  const BREADCRUMB_LABELS = {
    '/dashboard/overview': tDash('breadcrumbs.overview'),
    '/dashboard/agenda': tDash('breadcrumbs.agenda'),
    '/dashboard/clientes': tDash('breadcrumbs.clientes'),
    '/dashboard/rituales': tDash('breadcrumbs.rituales'),
    '/dashboard/terapeutas': tDash('breadcrumbs.terapeutas'),
    '/dashboard/caja': tDash('breadcrumbs.caja'),
    '/dashboard/informes': tDash('breadcrumbs.informes'),
    '/dashboard/ajustes': tDash('breadcrumbs.ajustes'),
    '/dashboard/centros': tDash('breadcrumbs.centros'),
  } as const;

  const user = useUserStore((s) => s.user);
  const sidebarGroups = useSidebarNavigation();
  const { centroNombre, isLoading: isCentroLoading } = useCurrentUserPrincipalCentro();

  const { location } = useRouterState();
  const currentLabel = resolveCurrentLabel(BREADCRUMB_LABELS, location.pathname);

  const handleChangeLang = (lang: SupportedLanguage) => {
    // Include the 'dashboard' shell namespace (Sidebar + topbar) so switching
    // language on a leaf route (whose page namespace omits 'dashboard') does not
    // re-break the shell chrome in the target language. Dedupe — overview/centros
    // already include it. Load BEFORE changeLanguage so the new bundle is present.
    const namespaces = [...new Set([...getNamespacesByRoute(location.pathname), DASHBOARD_NS])];
    void loadNamespaces(i18n, lang, namespaces).then(() => {
      void i18n.changeLanguage(lang).then(() => {
        document.documentElement.setAttribute('lang', lang);
      });
    });
  };

  const initials = user
    ? [user.nombre.charAt(0), user.apellidos.charAt(0)].filter(Boolean).join('').toUpperCase() ||
      'NA'
    : 'NA';

  const displayName = user
    ? [user.nombre, user.apellidos].filter(Boolean).join(' ').trim() || 'Naree A.'
    : 'Naree A.';

  const userRole =
    user == null
      ? tDash('userRole.recepcion')
      : user.roles.includes('superadmin')
        ? tDash('userRole.suksai')
        : user.roles.includes('recepcionista')
          ? tDash('userRole.recepcion')
          : user.roles.includes('masajista')
            ? tDash('userRole.terapeuta')
            : tDash('userRole.recepcion');

  return (
    <StyledDashbordLayout $collapsed={isCollapsed}>
      {/* ── Sidebar (botanical jungle green) ─────────────────────────────── */}
      <Sidebar
        style={{ gridArea: 'sidebar' }}
        variant="suksai"
        mobileOpen={mobileOpen}
        onCollapseChange={setIsCollapsed}
        onMobileClose={() => {
          setMobileOpen(false);
        }}
        collapsed={isCollapsed}
        groups={sidebarGroups}
        logo={{
          icon: <SuksaiBrandLogo collapsed={isCollapsed} />,
          mode: 'icon',
        }}
        footer={
          <SidebarUserFooter
            initials={initials}
            name={displayName}
            centroNombre={centroNombre}
            isCentroLoading={isCentroLoading}
            collapsed={isCollapsed}
          />
        }
        aria-label={tDash('topbar.navAriaLabel')}
      />

      {/* ── Glassmorphism topbar ──────────────────────────────────────────── */}
      <StyledDashboardTopbar style={{ gridArea: 'header' }}>
        {/* Breadcrumbs */}
        <StyledBreadcrumbs aria-label={tDash('topbar.breadcrumbAriaLabel')}>
          <StyledCrumbLink
            as={Link}
            to="/dashboard/overview"
            className="crumb-home"
            aria-label={tDash('topbar.homeAriaLabel')}
          >
            <IcoHouse size={16} />
          </StyledCrumbLink>
          <StyledCrumbSep className="crumb-sep-first" aria-hidden="true">
            /
          </StyledCrumbSep>
          <StyledCrumbLink as={Link} to="/dashboard/overview">
            {tDash('topbar.studioLabel')}
          </StyledCrumbLink>
          <StyledCrumbSep aria-hidden="true">/</StyledCrumbSep>
          <StyledCrumbCurrent aria-current="page">{currentLabel}</StyledCrumbCurrent>
        </StyledBreadcrumbs>

        {/* Right-side actions */}
        <StyledTopbarActions>
          <StyledIconBtn
            type="button"
            aria-label={isDark ? t('themeToggle.toLight') : t('themeToggle.toDark')}
            title={isDark ? t('themeToggle.toLight') : t('themeToggle.toDark')}
            onClick={toggleTheme}
          >
            {isDark ? <IcoLotusSun size={20} /> : <IcoCrescentMoon size={20} />}
          </StyledIconBtn>

          <StyledTopbarLangToggle role="group" aria-label={tDash('topbar.langGroupAriaLabel')}>
            <StyledTopbarLangBtn
              type="button"
              $active={currentLang === 'es'}
              aria-pressed={currentLang === 'es'}
              aria-label={tDash('topbar.langEsAriaLabel')}
              onClick={() => {
                handleChangeLang('es');
              }}
            >
              {t('lang.es')}
            </StyledTopbarLangBtn>
            <StyledTopbarLangBtn
              type="button"
              $active={currentLang === 'en'}
              aria-pressed={currentLang === 'en'}
              aria-label={tDash('topbar.langEnAriaLabel')}
              onClick={() => {
                handleChangeLang('en');
              }}
            >
              {t('lang.en')}
            </StyledTopbarLangBtn>
          </StyledTopbarLangToggle>

          <UserMenu
            trigger={
              <StyledUserMenuPill aria-label={tDash('topbar.accountAriaLabel')}>
                <StyledPillAvatar aria-hidden="true">{initials}</StyledPillAvatar>
                <StyledPillMeta>
                  <strong>{displayName}</strong>
                  <span>{userRole}</span>
                </StyledPillMeta>
                <StyledPillCaret aria-hidden="true">
                  <IcoCaretDown />
                </StyledPillCaret>
              </StyledUserMenuPill>
            }
          />
        </StyledTopbarActions>
      </StyledDashboardTopbar>

      {/* ── Main content (child route) ────────────────────────────────────── */}
      <StyledMainContent style={{ gridArea: 'content' }}>
        <Outlet />
      </StyledMainContent>

      {/* ── Shell footer — legal links ───────────────────────────────────── */}
      <StyledDashboardFooter style={{ gridArea: 'footer' }} role="contentinfo">
        <StyledDashboardFooterCopyright>{tDash('footer.copyright')}</StyledDashboardFooterCopyright>
        <StyledDashboardFooterLinks>
          <Link to="/legal/terminos-uso">{tDash('footer.termsLink')}</Link>
          <Link to="/legal/privacidad">{tDash('footer.privacyLink')}</Link>
        </StyledDashboardFooterLinks>
      </StyledDashboardFooter>

      {/* ── Mobile FAB — opens sidebar drawer ────────────────────────────── */}
      <StyledMobileFab
        onClick={() => {
          setMobileOpen(true);
        }}
        aria-label={tDash('topbar.openMenuAriaLabel')}
        type="button"
      >
        <IcoHamburger />
      </StyledMobileFab>
    </StyledDashbordLayout>
  );
};
