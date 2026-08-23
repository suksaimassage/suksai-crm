/**
 * LoginPage.test.tsx
 *
 * Validates the 7 improvements applied to the LoginPage in the feature/login-page branch.
 *
 * Test strategy:
 *   - Improvements 1, 3, 5, 6 — render once per describe block in beforeAll, capture the
 *     injected CSS string, then assert on the captured string synchronously.
 *     styled-components v6 caches injected rules; clearing <style> elements in beforeEach
 *     causes SC to skip re-injection on the next render (it believes rules are already there).
 *     The beforeAll + shared-CSS pattern avoids this entirely.
 *   - Improvement 2, 7 — parse the JSON files directly (no component mount needed).
 *   - Improvement 4, 7 — mount LoginPage with a minimal wrapper and use RTL queries.
 *
 * CSS ordering note:
 *   The light-mode checkbox describe block intentionally appears BEFORE the dark-mode
 *   describe. Because SC accumulates injected rules across the session, the light-mode
 *   CSS capture is performed while only LightWrapper renders have occurred — guaranteeing
 *   the dark-gold oklch value is absent.
 *
 * Mounting strategy:
 *   LoginPage uses useNavigate / useSearch from TanStack Router.
 *   We mock those hooks so the component can render without a full router tree.
 *   ThemeProvider is provided via a thin test wrapper.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type * as TanstackRouter from '@tanstack/react-router';
import type { ReactNode } from 'react';

// ── Theme fixtures ─────────────────────────────────────────────────────────
import { lightTheme } from '@infra/styles/themes/light.theme';
import { darkTheme } from '@infra/styles/themes/dark.theme';

// ── Styles under test ──────────────────────────────────────────────────────
import * as LoginStyles from '@infra/pages/LoginPage/LoginPage.styles';

// ── i18n JSON under test ───────────────────────────────────────────────────
import enLogin from '@infra/i18n/locales/en/login.json';
import esLogin from '@infra/i18n/locales/es/login.json';

// ── i18next minimal setup for component render tests ──────────────────────
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

// ── Module-level mocks ─────────────────────────────────────────────────────

// NOTE: LoginPage now renders <Link> (from @tanstack/react-router) for the two
// legal links in the footer copy. This suite doesn't exercise a RouterProvider,
// so Link is mocked to a plain anchor (`to` → `href`) via importOriginal partial
// mock — same idiom used in the new LoginPage.test.tsx under
// src/tests/infrastructure/pages/LoginPage/.
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearch: () => ({}),
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

vi.mock('@infra/hooks/useAuth', () => ({
  signIn: vi.fn(),
}));

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: {
    getState: () => ({ setSession: vi.fn() }),
  },
}));

vi.mock('@app/stores/useThemeStore', () => ({
  useIsDark: vi.fn(() => false),
  useThemeActions: vi.fn(() => ({ toggleTheme: vi.fn() })),
}));

vi.mock('@infra/i18n/namespace-loader', () => ({
  loadNamespaces: vi.fn(() => Promise.resolve()),
  loadNamespace: vi.fn(() => Promise.resolve()),
}));

// ── i18next test instance ──────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['login', 'common'],
  defaultNS: 'login',
  resources: {
    en: { login: enLogin, common: {} },
    es: { login: esLogin, common: {} },
  },
  interpolation: { escapeValue: false },
});

// ── Test wrapper helpers ───────────────────────────────────────────────────

interface IWrapperProps {
  children: ReactNode;
}

const LightWrapper = ({ children }: IWrapperProps) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

const DarkWrapper = ({ children }: IWrapperProps) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={darkTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

/**
 * Reads all CSS rules currently injected into jsdom's style sheets by styled-components.
 * SC v6 injects rules once per unique class (tracked internally). Rules accumulate across
 * the test session — never call this after manually removing <style> elements or SC will
 * not re-inject, leaving the result empty.
 */
function getInjectedCSS(): string {
  const sheets = Array.from(document.styleSheets);
  const rules: string[] = [];
  for (const sheet of sheets) {
    try {
      const cssRules = Array.from(sheet.cssRules);
      for (const rule of cssRules) {
        rules.push(rule.cssText);
      }
    } catch {
      // Cross-origin stylesheets throw SecurityError — ignore
    }
  }
  return rules.join('\n');
}

// ── Improvement 2 — Version string in i18n JSON (no mount needed) ──────────

describe('Improvement 2 — Version string in i18n JSON', () => {
  it('en/login.json footer.copyright contains v1.0.0', () => {
    const copyright = (enLogin as Record<string, unknown> & { footer?: { copyright?: string } })
      .footer?.copyright;
    expect(copyright).toBeDefined();
    expect(copyright).toContain('v1.0.0');
  });

  it('es/login.json footer.copyright contains v1.0.0', () => {
    const copyright = (esLogin as Record<string, unknown> & { footer?: { copyright?: string } })
      .footer?.copyright;
    expect(copyright).toBeDefined();
    expect(copyright).toContain('v1.0.0');
  });

  it('en/login.json footer.copyright does NOT contain v3.4.1', () => {
    const copyright = (enLogin as Record<string, unknown> & { footer?: { copyright?: string } })
      .footer?.copyright;
    expect(copyright).not.toContain('v3.4.1');
  });

  it('es/login.json footer.copyright does NOT contain v3.4.1', () => {
    const copyright = (esLogin as Record<string, unknown> & { footer?: { copyright?: string } })
      .footer?.copyright;
    expect(copyright).not.toContain('v3.4.1');
  });
});

describe('Improvement 2 & 4 — Removed footer link keys from i18n JSON', () => {
  it('en/login.json does NOT have footer.status key', () => {
    const footer = (enLogin as Record<string, unknown> & { footer?: Record<string, unknown> })
      .footer;
    expect(footer).not.toHaveProperty('status');
  });

  it('en/login.json does NOT have footer.docs key', () => {
    const footer = (enLogin as Record<string, unknown> & { footer?: Record<string, unknown> })
      .footer;
    expect(footer).not.toHaveProperty('docs');
  });

  it('en/login.json does NOT have footer.support key', () => {
    const footer = (enLogin as Record<string, unknown> & { footer?: Record<string, unknown> })
      .footer;
    expect(footer).not.toHaveProperty('support');
  });

  it('es/login.json does NOT have footer.status key', () => {
    const footer = (esLogin as Record<string, unknown> & { footer?: Record<string, unknown> })
      .footer;
    expect(footer).not.toHaveProperty('status');
  });

  it('es/login.json does NOT have footer.docs key', () => {
    const footer = (esLogin as Record<string, unknown> & { footer?: Record<string, unknown> })
      .footer;
    expect(footer).not.toHaveProperty('docs');
  });

  it('es/login.json does NOT have footer.support key', () => {
    const footer = (esLogin as Record<string, unknown> & { footer?: Record<string, unknown> })
      .footer;
    expect(footer).not.toHaveProperty('support');
  });
});

describe('Improvement 7 — Removed forgotPassword keys from i18n JSON', () => {
  it('en/login.json does NOT have forgotPassword key', () => {
    expect(enLogin).not.toHaveProperty('forgotPassword');
  });

  it('en/login.json does NOT have forgotPasswordDisabled key', () => {
    expect(enLogin).not.toHaveProperty('forgotPasswordDisabled');
  });

  it('es/login.json does NOT have forgotPassword key', () => {
    expect(esLogin).not.toHaveProperty('forgotPassword');
  });

  it('es/login.json does NOT have forgotPasswordDisabled key', () => {
    expect(esLogin).not.toHaveProperty('forgotPasswordDisabled');
  });
});

// ── Named exports from styles module ──────────────────────────────────────

describe('Improvement 4 — StyledBrandFooterLinks removed from styles module', () => {
  it('LoginPage.styles does NOT export StyledBrandFooterLinks', () => {
    expect((LoginStyles as Record<string, unknown>).StyledBrandFooterLinks).toBeUndefined();
  });
});

describe('Improvement 7 — StyledForgotLink removed from styles module', () => {
  it('LoginPage.styles does NOT export StyledForgotLink', () => {
    expect((LoginStyles as Record<string, unknown>).StyledForgotLink).toBeUndefined();
  });
});

// ── Improvement 1 — ZEN animation keyframes ────────────────────────────────
// Render once in beforeAll; SC injects all keyframes on first render.
// Subsequent it() blocks read from the shared CSS capture.

describe('Improvement 1 — ZEN animation keyframes injected into DOM via styled-components', () => {
  let capturedCSS = '';

  beforeAll(async () => {
    const { LoginPage } = await import('@infra/pages/LoginPage/LoginPage');
    render(<LoginPage />, { wrapper: LightWrapper });
    capturedCSS = getInjectedCSS();
  });

  it('StyledBrandLogo uses zenFadeDown animation (translateY(-12px) keyframe present)', () => {
    expect(capturedCSS).toMatch(/translateY\(-12px\)/);
    expect(capturedCSS).toMatch(/translateY\(0\)/);
  });

  it('StyledBrandEyebrow uses zenFadeUp animation (translateY(10px) keyframe present)', () => {
    expect(capturedCSS).toMatch(/translateY\(10px\)/);
  });

  it('StyledBrandHeading uses zenFadeUpHeading animation (translateY(14px) keyframe present)', () => {
    expect(capturedCSS).toMatch(/translateY\(14px\)/);
  });

  it('StyledCrumbs / StyledFormTitle use zenFadeRight animation (translateX(16px) keyframe present)', () => {
    expect(capturedCSS).toMatch(/translateX\(16px\)/);
  });

  it('zenFadeIn @keyframes (opacity: 0 → 1) is injected via StyledForm / StyledBrandDescription', () => {
    expect(capturedCSS).toMatch(/@keyframes/);
    expect(capturedCSS).toMatch(/opacity:\s*0/i);
    expect(capturedCSS).toMatch(/opacity:\s*1/i);
  });

  it('StyledLoginPage includes prefers-reduced-motion media query', () => {
    expect(capturedCSS).toContain('prefers-reduced-motion');
  });

  it('StyledFormCardWrapper does NOT reference loginEntrance animation', () => {
    expect(capturedCSS).not.toContain('loginEntrance');
  });
});

// ── Improvement 3 — Logo width 140px ─────────────────────────────────────

describe('Improvement 3 — StyledBrandLogo default width is 200px', () => {
  it('CSS contains width: 200px at base breakpoint', () => {
    // CSS was already injected by the ZEN animations beforeAll above;
    // subsequent reads from document.styleSheets still return all injected rules.
    const css = getInjectedCSS();
    expect(css).toContain('200px');
  });
});

// ── Improvement 4 — No anchor links in brand panel (DOM test) ─────────────

describe('Improvement 4 — Brand panel footer has no anchor tags', () => {
  it('renders no <a> elements inside the brand panel (aria-hidden section)', async () => {
    const { LoginPage } = await import('@infra/pages/LoginPage/LoginPage');
    const { container } = render(<LoginPage />, { wrapper: LightWrapper });

    const brandPanel = container.querySelector('[aria-hidden="true"]');
    expect(brandPanel).not.toBeNull();

    const anchorsInBrandPanel = brandPanel!.querySelectorAll('a');
    expect(anchorsInBrandPanel).toHaveLength(0);
  });
});

// ── Improvement 6 — Light-mode checkbox (MUST run before any dark render) ─
// This describe block appears before the dark-mode describe intentionally.
// SC accumulates injected rules; capturing CSS here ensures no dark rules are present yet.

describe('Improvement 6 — StyledCheckLabel light mode does NOT use dark-gold checkbox color', () => {
  let lightCSS = '';

  beforeAll(() => {
    // Rules were already injected by the ZEN animations beforeAll (light render).
    // No dark render has occurred yet at this point in the describe order.
    lightCSS = getInjectedCSS();
  });

  it('light-mode CSS does NOT contain oklch(0.84 0.06 67)', () => {
    expect(lightCSS).not.toContain('oklch(0.84 0.06 67)');
  });
});

// ── Improvement 5 — Brand panel accessibility color ───────────────────────

describe('Improvement 5 — Brand panel and heading use hardcoded cream oklch(0.97 0.01 67)', () => {
  it('injected CSS contains the hardcoded cream oklch value', () => {
    const css = getInjectedCSS();
    expect(css).toContain('oklch(0.97 0.01 67)');
  });
});

// ── Improvement 6 — Submit button accessibility ───────────────────────────

describe('Improvement 6 — StyledSubmitButton uses hardcoded cream color', () => {
  it('StyledSubmitButton injects oklch(0.97 0.01 67) as its text color', () => {
    const css = getInjectedCSS();
    expect(css).toContain('oklch(0.97 0.01 67)');
  });
});

// ── Improvement 6 — Dark-mode checkbox gold color ─────────────────────────
// This describe intentionally appears AFTER the light-mode describe above.
// Rendering with DarkWrapper adds dark-interpolated rules to the sheet.

describe('Improvement 6 — StyledCheckLabel dark mode uses gold oklch(0.84 0.06 67)', () => {
  let darkCSS = '';

  beforeAll(async () => {
    const { useIsDark } = await import('@app/stores/useThemeStore');
    vi.mocked(useIsDark).mockReturnValue(true);

    const { LoginPage } = await import('@infra/pages/LoginPage/LoginPage');
    render(<LoginPage />, { wrapper: DarkWrapper });
    darkCSS = getInjectedCSS();
  });

  it('dark-mode CSS contains oklch(0.84 0.06 67) for checkbox checked background', () => {
    expect(darkCSS).toContain('oklch(0.84 0.06 67)');
  });
});

// ── Improvement 7 — Forgot password link absent from DOM ──────────────────

describe('Improvement 7 — Forgot password link removed from rendered output', () => {
  it('does not render any element containing "Olvidaste" text', async () => {
    const { useIsDark } = await import('@app/stores/useThemeStore');
    vi.mocked(useIsDark).mockReturnValue(false);

    const { LoginPage } = await import('@infra/pages/LoginPage/LoginPage');
    render(<LoginPage />, { wrapper: LightWrapper });
    expect(screen.queryByText(/olvidaste/i)).not.toBeInTheDocument();
  });

  it('does not render any element containing "Forgot" text', async () => {
    const { LoginPage } = await import('@infra/pages/LoginPage/LoginPage');
    render(<LoginPage />, { wrapper: LightWrapper });
    expect(screen.queryByText(/forgot/i)).not.toBeInTheDocument();
  });
});
