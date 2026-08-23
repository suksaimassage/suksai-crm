/**
 * DashboardPage.test.tsx
 *
 * NEW test file — DashboardPage previously had zero test coverage (pre-existing
 * gap, not introduced by this change). Per the task brief this file is scoped
 * ONLY to the new shell footer (role="contentinfo", copyright text, two legal
 * links rendered same-tab — the one deliberate difference from LoginPage's
 * target="_blank" links). Sidebar navigation, breadcrumbs, topbar actions,
 * and the Outlet content are explicitly out of scope for this task.
 *
 * Mocking strategy (mirrors AgendaPage.test.tsx's idiom — heavy child hooks
 * stubbed to stable values so the shell renders deterministically):
 *   - @app/stores/useUserStore: mocked with the selector pattern.
 *   - @infra/hooks/useSidebarNavigation / useCurrentUserPrincipalCentro: stubbed.
 *   - @infra/components/ui/common/Sidebar, UserMenu: stubbed to lightweight
 *     placeholders (their own behavior is unrelated to the footer under test;
 *     Sidebar itself pulls in useTranslation('common') + heavy internal state
 *     that would only add noise here).
 *   - @tanstack/react-router: `useRouterState` mocked (DashboardPage calls it
 *     directly for breadcrumbs), `Outlet` stubbed to a marker, `Link` mocked
 *     to a plain anchor (`to` → `href`) via importOriginal partial mock.
 *   - @app/stores/useThemeStore: useIsDark / useThemeActions mocked directly.
 *   - react-i18next: real i18next instance using the actual es/dashboard.json
 *     + es/common.json resource bundles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type * as TanstackRouter from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esDashboard from '@infra/i18n/locales/es/dashboard.json';
import esCommon from '@infra/i18n/locales/es/common.json';

// ── Module-level mocks ──────────────────────────────────────────────────────

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('@infra/hooks/useSidebarNavigation', () => ({
  useSidebarNavigation: vi.fn(() => []),
}));

vi.mock('@infra/hooks/useCurrentUserPrincipalCentro', () => ({
  useCurrentUserPrincipalCentro: vi.fn(() => ({ centroNombre: null, isLoading: false })),
}));

vi.mock('@app/stores/useThemeStore', () => ({
  useIsDark: () => false,
  useThemeActions: () => ({ toggleTheme: vi.fn() }),
}));

vi.mock('@infra/i18n/namespace-loader', () => ({
  loadNamespaces: vi.fn(() => Promise.resolve()),
}));

vi.mock('@infra/components/ui/common/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar-stub" />,
}));

vi.mock('@infra/components/ui/common/UserMenu', () => ({
  UserMenu: ({ trigger }: { trigger: ReactNode }) => (
    <div data-testid="user-menu-stub">{trigger}</div>
  ),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>();
  return {
    ...actual,
    useRouterState: () => ({ location: { pathname: '/dashboard/overview' } }),
    Outlet: () => <div data-testid="outlet-stub" />,
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string;
      children?: ReactNode;
      [key: string]: unknown;
    }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

import { useUserStore } from '@app/stores/useUserStore';
import { DashboardPage } from '@infra/pages/DashboardPage/DashboardPage';

// ── i18next test instance (real es/dashboard.json + es/common.json) ────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['dashboard', 'common'],
  defaultNS: 'dashboard',
  resources: {
    es: { dashboard: esDashboard, common: esCommon },
  },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

function mockNoUser(): void {
  vi.mocked(useUserStore).mockImplementation((selector) =>
    selector({ user: null } as unknown as Parameters<typeof selector>[0]),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNoUser();
});

// ── Footer landmark ──────────────────────────────────────────────────────────

describe('DashboardPage — footer landmark', () => {
  it('renders exactly one contentinfo landmark (no collision with Sidebar)', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });
});

// ── Footer content ───────────────────────────────────────────────────────────

describe('DashboardPage — footer content', () => {
  it('renders the copyright text', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(esDashboard.footer.copyright)).toBeInTheDocument();
  });

  it('renders a link to /legal/terminos-uso with the terms label', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const footer = screen.getByRole('contentinfo');
    const link = within(footer).getByRole('link', { name: esDashboard.footer.termsLink });
    expect(link).toHaveAttribute('href', '/legal/terminos-uso');
  });

  it('renders a link to /legal/privacidad with the privacy label', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const footer = screen.getByRole('contentinfo');
    const link = within(footer).getByRole('link', { name: esDashboard.footer.privacyLink });
    expect(link).toHaveAttribute('href', '/legal/privacidad');
  });
});

// ── Same-tab navigation (deliberate difference from LoginPage) ─────────────

describe('DashboardPage — footer links open same-tab (not target="_blank")', () => {
  it('the terms link has no target="_blank" attribute', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const footer = screen.getByRole('contentinfo');
    const link = within(footer).getByRole('link', { name: esDashboard.footer.termsLink });
    expect(link).not.toHaveAttribute('target', '_blank');
  });

  it('the privacy link has no target="_blank" attribute', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const footer = screen.getByRole('contentinfo');
    const link = within(footer).getByRole('link', { name: esDashboard.footer.privacyLink });
    expect(link).not.toHaveAttribute('target', '_blank');
  });

  it('neither footer link carries rel="noopener noreferrer" (no new-tab affordance)', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const footer = screen.getByRole('contentinfo');
    const termsLink = within(footer).getByRole('link', { name: esDashboard.footer.termsLink });
    const privacyLink = within(footer).getByRole('link', { name: esDashboard.footer.privacyLink });

    expect(termsLink).not.toHaveAttribute('rel');
    expect(privacyLink).not.toHaveAttribute('rel');
  });
});

// ── Single language-toggle group ────────────────────────────────────────────

describe('DashboardPage — no duplicate language toggle', () => {
  it('renders exactly one language-toggle group on the page (topbar only, none in footer)', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const langGroups = screen.getAllByRole('group', {
      name: esDashboard.topbar.langGroupAriaLabel,
    });
    expect(langGroups).toHaveLength(1);

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).queryByRole('group')).not.toBeInTheDocument();
  });
});
