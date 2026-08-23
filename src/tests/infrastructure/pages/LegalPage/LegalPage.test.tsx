/**
 * LegalPage.test.tsx
 *
 * Covers the shared LegalPage component (slug='terminos-uso' | 'privacidad')
 * — a public page rendering translated legal content from the `legal` i18n
 * namespace, plus a table of contents, back-to-top affordance, and header/
 * footer chrome.
 *
 * Mocking strategy:
 *   - react-i18next: real i18next instance with the actual es/legal.json
 *     resource bundle (so section counts/text come from the real fixture,
 *     not a hand-rolled mock) — mirrors the AgendaPage.test.tsx idiom of
 *     using the genuine locale JSON against a scoped i18next instance.
 *   - @tanstack/react-router: `Link` is mocked to a plain anchor (`to` → `href`)
 *     via importOriginal partial mock, since LegalPage renders <Link> outside
 *     a RouterProvider (no route-tree/browser-history context is present).
 *   - @app/stores/useThemeStore: useIsDark / useThemeActions mocked directly
 *     (no ThemeProvider Zustand wiring needed for these assertions).
 *   - @infra/i18n/namespace-loader: loadNamespaces mocked to a no-op resolved
 *     promise — the language toggle only needs to call it, not actually load
 *     bundles over the network.
 *
 * Section counts are read directly from the real locale JSON fixtures
 * (8 sections for terminos-uso, 12 for privacidad) rather than hardcoded
 * guesses.
 *
 * NOTE on interaction style: `@testing-library/user-event` is NOT an
 * installed dependency in this repo (confirmed absent from package.json and
 * node_modules — every existing interaction test, e.g. AgendaPage.test.tsx,
 * uses `fireEvent` + `act`). Per repo convention this file uses the same
 * `fireEvent`/`act` idiom rather than introducing a new, uninstalled package.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type * as TanstackRouter from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esLegal from '@infra/i18n/locales/es/legal.json';

// ── Module-level mocks ──────────────────────────────────────────────────────

vi.mock('@infra/i18n/namespace-loader', () => ({
  loadNamespaces: vi.fn(() => Promise.resolve()),
}));

const mockToggleTheme = vi.fn();
let mockIsDark = false;
vi.mock('@app/stores/useThemeStore', () => ({
  useIsDark: () => mockIsDark,
  useThemeActions: () => ({ toggleTheme: mockToggleTheme }),
}));

// Link rendered outside a RouterProvider — mock it to a plain anchor while
// preserving every other export (isRedirect, createRoute, etc. unused here
// but kept intact for safety).
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>();
  return {
    ...actual,
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

import { LegalPage } from '@infra/pages/LegalPage/LegalPage';
import { TerminosDeUsoPage, PoliticaPrivacidadPage } from '@infra/pages/LegalPage';

// ── i18next test instance (real es/legal.json fixture) ─────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['legal'],
  defaultNS: 'legal',
  resources: {
    es: { legal: esLegal },
  },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

const TERMINOS_SECTION_COUNT = esLegal['terminos-uso'].sections.length;
const PRIVACIDAD_SECTION_COUNT = esLegal.privacidad.sections.length;

beforeEach(() => {
  vi.clearAllMocks();
  mockIsDark = false;
  window.scrollY = 0;
});

afterEach(() => {
  void testI18n.changeLanguage('es');
});

// ── Content varies by slug ──────────────────────────────────────────────────

describe('LegalPage — content varies by slug', () => {
  it('renders the "terminos-uso" title and dateline', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(
      screen.getByRole('heading', { level: 1, name: esLegal['terminos-uso'].title }),
    ).toBeInTheDocument();
    expect(screen.getByText(esLegal['terminos-uso'].lastUpdated)).toBeInTheDocument();
  });

  it('renders the "privacidad" title and dateline', () => {
    render(<LegalPage slug="privacidad" />, { wrapper: Wrapper });
    expect(
      screen.getByRole('heading', { level: 1, name: esLegal.privacidad.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(esLegal.privacidad.lastUpdated)).toBeInTheDocument();
  });

  it('renders a different title for each slug (content is not hardcoded)', () => {
    const { unmount } = render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const terminosTitle = screen.getByRole('heading', { level: 1 }).textContent;
    unmount();

    render(<LegalPage slug="privacidad" />, { wrapper: Wrapper });
    const privacidadTitle = screen.getByRole('heading', { level: 1 }).textContent;

    expect(terminosTitle).not.toBe(privacidadTitle);
  });
});

// ── Barrel wrapper exports (index.tsx) ──────────────────────────────────────

describe('LegalPage barrel — prop-less named wrappers', () => {
  it('TerminosDeUsoPage renders LegalPage with slug="terminos-uso"', () => {
    render(<TerminosDeUsoPage />, { wrapper: Wrapper });
    expect(
      screen.getByRole('heading', { level: 1, name: esLegal['terminos-uso'].title }),
    ).toBeInTheDocument();
  });

  it('PoliticaPrivacidadPage renders LegalPage with slug="privacidad"', () => {
    render(<PoliticaPrivacidadPage />, { wrapper: Wrapper });
    expect(
      screen.getByRole('heading', { level: 1, name: esLegal.privacidad.title }),
    ).toBeInTheDocument();
  });
});

// ── Sections ─────────────────────────────────────────────────────────────────

describe('LegalPage — sections', () => {
  it(`renders all ${TERMINOS_SECTION_COUNT} h2 section headings for terminos-uso`, () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(TERMINOS_SECTION_COUNT);
  });

  it(`renders all ${PRIVACIDAD_SECTION_COUNT} h2 section headings for privacidad`, () => {
    render(<LegalPage slug="privacidad" />, { wrapper: Wrapper });
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(PRIVACIDAD_SECTION_COUNT);
  });

  it('renders at least one paragraph of body text per section for terminos-uso', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    for (const section of esLegal['terminos-uso'].sections) {
      expect(screen.getByText(section.body[0])).toBeInTheDocument();
    }
  });

  it('renders each section heading text from the locale fixture', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    for (const section of esLegal['terminos-uso'].sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
    }
  });
});

// ── Landmarks (banner / main / contentinfo) ─────────────────────────────────

describe('LegalPage — landmarks', () => {
  it('renders exactly one banner, one main, and one contentinfo landmark', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('the main region has id="main-content"', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});

// ── Table of contents ───────────────────────────────────────────────────────

describe('LegalPage — table of contents', () => {
  it('renders a nav with an accessible name', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(screen.getByRole('navigation', { name: esLegal.toc.ariaLabel })).toBeInTheDocument();
  });

  it('contains one link per section, matching the section count', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const nav = screen.getByRole('navigation', { name: esLegal.toc.ariaLabel });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(TERMINOS_SECTION_COUNT);
  });

  it('each toc link has an href="#{sectionId}" matching an anchor present in the article', () => {
    const { container } = render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const nav = screen.getByRole('navigation', { name: esLegal.toc.ariaLabel });
    const links = within(nav).getAllByRole('link');

    for (const section of esLegal['terminos-uso'].sections) {
      const matchingLink = links.find((link) => link.getAttribute('href') === `#${section.id}`);
      expect(matchingLink).toBeDefined();

      expect(matchingLink!).toHaveTextContent(section.heading);

      // the anchor target must exist somewhere in the rendered article
      expect(container.querySelector(`#${section.id}`)).not.toBeNull();
    }
  });
});

// ── Back link ────────────────────────────────────────────────────────────────

describe('LegalPage — back link', () => {
  it('the "Volver" footer link points to "/"', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const backLink = screen.getByRole('link', { name: esLegal.backLink });
    expect(backLink).toHaveAttribute('href', '/');
  });
});

// ── Focus management ────────────────────────────────────────────────────────

describe('LegalPage — focus on mount', () => {
  it('moves focus to the main region on mount', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });
});

// ── Back-to-top button ──────────────────────────────────────────────────────

describe('LegalPage — back-to-top button', () => {
  // NOTE: an element with aria-hidden="true" on itself computes an EMPTY
  // accessible name per the accname spec — dom-testing-library still lists
  // the node when querying with `{ hidden: true }`, but a `name` filter will
  // never match it while hidden. So: query by role only (there is exactly one
  // other <button> with a plain aria-label, distinguishable by content/attrs)
  // and assert the aria-label attribute directly instead of via `name`.

  const getBackToTopButton = () =>
    screen
      .getAllByRole('button', { hidden: true })
      .find((btn) => btn.getAttribute('aria-label') === esLegal.backToTop);

  it('is not interactable (tabIndex=-1, aria-hidden) before scrolling', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const button = getBackToTopButton();
    expect(button).toBeDefined();

    expect(button!).toHaveAttribute('tabindex', '-1');
    expect(button!).toHaveAttribute('aria-hidden', 'true');
  });

  it('becomes visible/interactable after scrolling past the threshold (600px)', async () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const button = getBackToTopButton();
    expect(button).toBeDefined();

    const el = button!;

    // Component listens on `window` scroll (passive) and reads window.scrollY,
    // throttled via requestAnimationFrame. Simulate scrolling past 600px.
    act(() => {
      window.scrollY = 650;
      window.dispatchEvent(new Event('scroll'));
    });

    await vi.waitFor(() => {
      expect(el).toHaveAttribute('tabindex', '0');
    });
    expect(el).toHaveAttribute('aria-hidden', 'false');
    // Now that it is visible (no longer aria-hidden), it resolves via a
    // regular non-hidden getByRole query with its accessible name.
    expect(screen.getByRole('button', { name: esLegal.backToTop })).toBe(el);
  });

  it('stays hidden when scrolling below the threshold', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const button = getBackToTopButton();
    expect(button).toBeDefined();

    const el = button!;

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(el).toHaveAttribute('tabindex', '-1');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('coalesces rapid-fire scroll events into a single rAF tick (throttle guard)', async () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const button = getBackToTopButton();
    expect(button).toBeDefined();
    const el = button!;

    // Two scroll events dispatched synchronously, before the rAF callback has
    // a chance to flush: the second dispatch must hit the
    // `if (frameId !== null) return` guard instead of scheduling a second frame.
    act(() => {
      window.scrollY = 650;
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });

    await vi.waitFor(() => {
      expect(el).toHaveAttribute('aria-hidden', 'false');
    });
  });

  it('clicking the button scrolls the window back to the top', () => {
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    const button = getBackToTopButton();
    expect(button).toBeDefined();
    const el = button!;

    act(() => {
      fireEvent.click(el);
    });

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});

// ── Theme toggle ─────────────────────────────────────────────────────────────

describe('LegalPage — theme toggle', () => {
  it('shows the "switch to dark" label when in light mode and calls toggleTheme on click', () => {
    mockIsDark = false;
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });

    const toggle = screen.getByRole('button', { name: esLegal.header.themeToggle.toDark });
    act(() => {
      fireEvent.click(toggle);
    });
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows the "switch to light" label when in dark mode', () => {
    mockIsDark = true;
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(
      screen.getByRole('button', { name: esLegal.header.themeToggle.toLight }),
    ).toBeInTheDocument();
  });
});

// ── ES/EN language toggle ───────────────────────────────────────────────────

describe('LegalPage — language toggle', () => {
  it('ES button reflects aria-pressed=true when i18n.language is "es"', () => {
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('EN button reflects aria-pressed=true when i18n.language is "en"', async () => {
    await testI18n.changeLanguage('en');
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking the EN button triggers loadNamespaces for the "en" language', async () => {
    const { loadNamespaces } = await import('@infra/i18n/namespace-loader');
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    });

    expect(loadNamespaces).toHaveBeenCalledWith(expect.anything(), 'en', ['common', 'legal']);
  });

  it('clicking the ES button triggers loadNamespaces for the "es" language', async () => {
    const { loadNamespaces } = await import('@infra/i18n/namespace-loader');
    render(<LegalPage slug="terminos-uso" />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    });

    expect(loadNamespaces).toHaveBeenCalledWith(expect.anything(), 'es', ['common', 'legal']);
  });
});
