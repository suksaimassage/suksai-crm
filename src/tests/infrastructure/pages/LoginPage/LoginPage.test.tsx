/**
 * LoginPage.test.tsx
 *
 * NEW test file — LoginPage previously had zero test coverage (pre-existing
 * gap, not introduced by this change). Per the task brief this file is
 * scoped ONLY to the new/changed behavior: the two legal links rendered via
 * `<Trans i18nKey="login:legalWithLinks">` (termsLink/privacyLink, each with
 * a visually-hidden "opens in a new tab" suffix). Full auth-flow coverage
 * (form submission, validation, password toggle, etc.) is explicitly out of
 * scope for this task.
 *
 * Mocking strategy (mirrors AgendaPage.test.tsx's idiom):
 *   - @tanstack/react-router: `useNavigate`/`useSearch` mocked (LoginPage
 *     calls `useSearch({ from: '/login' })`, which throws outside a
 *     RouterProvider). `Link` is mocked to a plain anchor (`to` → `href`,
 *     preserving target/rel) via importOriginal partial mock, since the
 *     legal links render <Link> with no RouterProvider present.
 *   - @infra/hooks/useAuth (signIn), @app/stores/useUserStore, domain Email,
 *     @app/routes/home-by-role, @infra/utils/auth-error-mapping: all mocked
 *     as inert stubs — the auth submission path is out of scope here and
 *     must not execute for real.
 *   - react-i18next: real i18next instance using the actual es/login.json
 *     resource bundle, so the Trans composition renders genuine translated
 *     text (including the literal "(abre en una pestaña nueva)" suffix).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type * as TanstackRouter from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esLogin from '@infra/i18n/locales/es/login.json';

// ── Module-level mocks ──────────────────────────────────────────────────────

vi.mock('@infra/hooks/useAuth', () => ({
  signIn: vi.fn(),
}));

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: { getState: () => ({ setSession: vi.fn() }) },
}));

vi.mock('@app/routes/home-by-role', () => ({
  getRoleHomePath: vi.fn(() => '/dashboard/overview'),
}));

vi.mock('@infra/utils/auth-error-mapping', () => ({
  mapAuthErrorToI18nKey: vi.fn(() => 'login:error.unknown'),
}));

vi.mock('@app/stores/useThemeStore', () => ({
  useIsDark: () => false,
  useThemeActions: () => ({ toggleTheme: vi.fn() }),
}));

vi.mock('@infra/i18n/namespace-loader', () => ({
  loadNamespaces: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearch: () => ({ redirect: undefined }),
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

import { LoginPage } from '@infra/pages/LoginPage/LoginPage';

// ── i18next test instance (real es/login.json fixture) ─────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['login', 'common'],
  defaultNS: 'login',
  resources: {
    es: { login: esLogin, common: {} },
  },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Legal links — presence and target ───────────────────────────────────────

describe('LoginPage — legal links', () => {
  it('renders two real, focusable links (not inert spans) for terms and privacy', () => {
    render(<LoginPage />, { wrapper: Wrapper });

    const termsLink = screen.getByRole('link', { name: /términos.*abre en una pestaña nueva/i });
    const privacyLink = screen.getByRole('link', {
      name: /política de privacidad.*abre en una pestaña nueva/i,
    });

    expect(termsLink.tagName).toBe('A');
    expect(privacyLink.tagName).toBe('A');
  });

  it('the terms link points to /legal/terminos-uso', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    const termsLink = screen.getByRole('link', { name: /términos.*abre en una pestaña nueva/i });
    expect(termsLink).toHaveAttribute('href', '/legal/terminos-uso');
  });

  it('the privacy link points to /legal/privacidad', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    const privacyLink = screen.getByRole('link', {
      name: /política de privacidad.*abre en una pestaña nueva/i,
    });
    expect(privacyLink).toHaveAttribute('href', '/legal/privacidad');
  });

  it('both links open in a new tab with rel="noopener noreferrer"', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    const termsLink = screen.getByRole('link', { name: /términos.*abre en una pestaña nueva/i });
    const privacyLink = screen.getByRole('link', {
      name: /política de privacidad.*abre en una pestaña nueva/i,
    });

    for (const link of [termsLink, privacyLink]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it("each link's accessible name includes the visually-hidden new-tab suffix", () => {
    render(<LoginPage />, { wrapper: Wrapper });
    // Both legal links carry the suffix in their accessible name (proven by
    // the regex `name` filter matching each one individually above); here we
    // additionally confirm there are exactly two such links on the page.
    const matches = screen.getAllByRole('link', { name: /abre en una pestaña nueva/i });
    expect(matches).toHaveLength(2);
  });

  it('links are reachable via Tab (not tabIndex=-1) and appear as real links in the tree', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    const termsLink = screen.getByRole('link', { name: /términos.*abre en una pestaña nueva/i });
    const privacyLink = screen.getByRole('link', {
      name: /política de privacidad.*abre en una pestaña nueva/i,
    });

    expect(termsLink).not.toHaveAttribute('tabindex', '-1');
    expect(privacyLink).not.toHaveAttribute('tabindex', '-1');
  });

  it('the surrounding legal paragraph renders the full translated sentence', () => {
    render(<LoginPage />, { wrapper: Wrapper });
    // Sanity: the Trans composition renders the static text around the links too.
    expect(screen.getByText(/al continuar aceptas los/i)).toBeInTheDocument();
  });
});

// ── EN locale variant (sanity for translation parity) ───────────────────────

describe('LoginPage — legal links (EN locale)', () => {
  it('renders the English suffix and link text when i18n.language is "en"', async () => {
    const enLogin = (await import('@infra/i18n/locales/en/login.json')).default;
    testI18n.addResourceBundle('en', 'login', enLogin, true, true);
    await testI18n.changeLanguage('en');

    render(<LoginPage />, { wrapper: Wrapper });

    expect(screen.getByRole('link', { name: /terms.*opens in a new tab/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /privacy policy.*opens in a new tab/i }),
    ).toBeInTheDocument();

    await testI18n.changeLanguage('es');
  });
});
