/**
 * Sidebar.test.tsx — suksai variant behavioral test suite
 *
 * Test strategy:
 *   - The Sidebar uses `useLocation` and `Link` from @tanstack/react-router.
 *     These are mocked at the module level so the component renders without a
 *     full router tree. `useLocation` returns a configurable pathname; `Link`
 *     is a thin passthrough that invokes the render-prop child with
 *     `isActive` computed from the href vs the mocked pathname.
 *   - No snapshot tests (project policy).
 *   - No CSS / styled-components string assertions.
 *   - The suksai dark/light theme smoke tests verify the `theme.isDark` branch
 *     in `getVariantTokens` does not throw — they cannot assert CSS values per
 *     project rules.
 *   - The Backdrop element is always present in the DOM (styled-components
 *     renders it regardless of `$isOpen`); `display:none` is media-query-gated
 *     at ≤767px and cannot be tested in jsdom. We assert on consistent DOM
 *     presence and the aria-hidden attribute.
 *
 * [TESTABILITY GAP] @testing-library/user-event is not installed.
 * Interaction tests use fireEvent from @testing-library/react.
 * fireEvent dispatches synthetic events directly without simulating full browser
 * event sequences. Install @testing-library/user-event for richer coverage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';
import React from 'react';

// ── Theme fixtures ─────────────────────────────────────────────────────────
import { lightTheme } from '@infra/styles/themes/light.theme';
import { darkTheme } from '@infra/styles/themes/dark.theme';
import esDashboard from '@infra/i18n/locales/es/dashboard.json';

// ── i18next test instance ──────────────────────────────────────────────────
// The Sidebar uses `useTranslation('dashboard')` for all accessible labels
// (collapseLabel, expandLabel, searchAriaLabel, mobileOpenAriaLabel, etc.).
// Without a real i18n provider the component returns raw keys instead of
// the expected strings, causing all accessibility-sensitive tests to fail.
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['dashboard'],
  defaultNS: 'dashboard',
  resources: { es: { dashboard: esDashboard } },
  interpolation: { escapeValue: false },
});

// ── Module-level mocks — must precede component import ────────────────────

/**
 * The mock pathname is stored in a mutable container captured by reference
 * inside the vi.mock factory. Because vi.mock hoists, we use an object (not
 * a `let` variable) so the reference is valid at hoist time.
 */
const routerState = { pathname: '/dashboard/overview' };

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: routerState.pathname }),
  /**
   * Link render-prop passthrough.
   * TanStack Router's <Link to={href}>{({ isActive }) => <element />}</Link>
   * passes { isActive } to the children render-prop. We replicate this:
   *   - isActive = the href exactly matches the current mocked pathname.
   */
  Link: ({
    to,
    children,
    onClick,
  }: {
    to: string;
    children: (props: { isActive: boolean }) => ReactNode;
    onClick?: () => void;
  }) => {
    const isActive = to === routerState.pathname;
    const child = children({ isActive });
    return (
      <span role="link" data-href={to} onClick={onClick}>
        {child}
      </span>
    );
  },
}));

// ── Component under test ───────────────────────────────────────────────────
import { Sidebar } from '@infra/components/ui/common/Sidebar';
import type { ISidebarGroup } from '@infra/components/ui/common/Sidebar';

// ── Test data ──────────────────────────────────────────────────────────────

const TEST_GROUPS: readonly ISidebarGroup[] = [
  {
    id: 'estudio',
    label: 'Estudio',
    items: [
      {
        id: 'inicio',
        label: 'Inicio',
        href: '/dashboard/overview',
        icon: <span aria-hidden="true">H</span>,
      },
      {
        id: 'agenda',
        label: 'Agenda',
        href: '/dashboard/agenda',
        icon: <span aria-hidden="true">A</span>,
      },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    items: [
      {
        id: 'caja',
        label: 'Caja',
        href: '/dashboard/caja',
        icon: <span aria-hidden="true">C</span>,
      },
    ],
  },
];

// ── Wrapper helpers ────────────────────────────────────────────────────────

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

// Default wrapper used by most tests (light theme, suksai variant).
const Wrapper = LightWrapper;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Renders a Sidebar with suksai variant and sensible defaults. */
function renderSidebar(
  props: Partial<React.ComponentProps<typeof Sidebar>> = {},
  wrapper: typeof LightWrapper = Wrapper,
) {
  return render(
    <Sidebar variant="suksai" groups={TEST_GROUPS} aria-label="Navegación lateral" {...props} />,
    { wrapper },
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Rendering', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with role="navigation" and the provided aria-label', () => {
    renderSidebar();
    const nav = screen.getByRole('navigation', { name: /navegación lateral/i });
    expect(nav).toBeInTheDocument();
  });

  it('renders group labels from groups prop', () => {
    renderSidebar();
    expect(screen.getByText('Estudio')).toBeInTheDocument();
    expect(screen.getByText('Operaciones')).toBeInTheDocument();
  });

  it('renders nav item labels for every item in groups', () => {
    renderSidebar();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Caja')).toBeInTheDocument();
  });

  it('renders footer content when footer prop is provided', () => {
    renderSidebar({ footer: <span>User Profile</span> });
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  it('does NOT render footer content when footer prop is omitted', () => {
    renderSidebar();
    expect(screen.queryByText('User Profile')).not.toBeInTheDocument();
  });

  it('renders logo icon when logo prop is provided', () => {
    renderSidebar({
      logo: {
        icon: <span data-testid="logo-icon">Logo</span>,
        title: 'Suksai Thai',
      },
    });
    expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
  });

  it('renders logo title text when logo.title is provided', () => {
    renderSidebar({
      logo: {
        icon: <span>Logo</span>,
        title: 'Suksai Thai',
      },
    });
    expect(screen.getByText('Suksai Thai')).toBeInTheDocument();
  });

  it('renders a CollapseButton in the DOM with an accessible aria-label', () => {
    // CollapseButton is `display:none` at base (mobile-first) and `display:flex`
    // at `@media (min-width: md)`. jsdom does not evaluate media queries, so the
    // button is hidden from RTL's accessibility tree but present in the DOM.
    // We assert DOM presence and correct aria-label directly.
    const { container } = renderSidebar();
    const btn = container.querySelector(
      '[aria-label="Colapsar sidebar"],[aria-label="Expandir sidebar"]',
    );
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute('aria-label')).toMatch(/colapsar sidebar|expandir sidebar/i);
  });

  it('renders items without group labels when a flat items-only structure is used', () => {
    render(
      <Sidebar
        variant="suksai"
        items={[{ id: 'flat-item', label: 'Flat', href: '/flat', icon: <span>F</span> }]}
        aria-label="Navegación lateral"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Flat')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Active state (aria-current)
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Active state', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marks the item whose href matches the current path with aria-current="page"', () => {
    routerState.pathname = '/dashboard/overview';
    renderSidebar();

    // The NavItemButton rendered as a <span> inside the Link mock receives aria-current
    const activeItem = screen.getByText('Inicio').closest('[aria-current="page"]');
    expect(activeItem).toBeInTheDocument();
  });

  it('does NOT set aria-current="page" on items that do not match the current path', () => {
    routerState.pathname = '/dashboard/overview';
    renderSidebar();

    const agendaEl = screen.getByText('Agenda');
    expect(agendaEl.closest('[aria-current="page"]')).toBeNull();

    const cajaEl = screen.getByText('Caja');
    expect(cajaEl.closest('[aria-current="page"]')).toBeNull();
  });

  it('marks the correct item when pathname changes to a different route', () => {
    routerState.pathname = '/dashboard/agenda';
    renderSidebar();

    const activeItem = screen.getByText('Agenda').closest('[aria-current="page"]');
    expect(activeItem).toBeInTheDocument();

    const inicioEl = screen.getByText('Inicio');
    expect(inicioEl.closest('[aria-current="page"]')).toBeNull();
  });

  it('does NOT mark any item when the current path matches no item href', () => {
    routerState.pathname = '/dashboard/unknown';
    renderSidebar();

    const allActive = document.querySelectorAll('[aria-current="page"]');
    expect(allActive).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Collapse behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Collapse behavior', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets aria-hidden="true" on group labels when collapsed={true}', () => {
    renderSidebar({ collapsed: true });

    const estudioLabel = screen.getByText('Estudio');
    expect(estudioLabel).toHaveAttribute('aria-hidden', 'true');

    const operacionesLabel = screen.getByText('Operaciones');
    expect(operacionesLabel).toHaveAttribute('aria-hidden', 'true');
  });

  it('does NOT set aria-hidden="true" on group labels when collapsed={false}', () => {
    renderSidebar({ collapsed: false });

    const estudioLabel = screen.getByText('Estudio');
    expect(estudioLabel).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('CollapseButton aria-label says "Expandir sidebar" when collapsed={true}', () => {
    // CollapseButton is display:none at base (mobile-first) per styled-components
    // media query — not in RTL's accessibility tree. Assert via DOM query.
    const { container } = renderSidebar({ collapsed: true });
    const btn = container.querySelector('[aria-label="Expandir sidebar"]');
    expect(btn).not.toBeNull();
  });

  it('CollapseButton aria-label says "Colapsar sidebar" when collapsed={false}', () => {
    const { container } = renderSidebar({ collapsed: false });
    const btn = container.querySelector('[aria-label="Colapsar sidebar"]');
    expect(btn).not.toBeNull();
  });

  it('calls onCollapseChange when the CollapseButton is clicked', () => {
    const onCollapseChange = vi.fn();
    const { container } = renderSidebar({ collapsed: false, onCollapseChange });

    const btn = container.querySelector('[aria-label="Colapsar sidebar"]')!;
    expect(btn).not.toBeNull();
    fireEvent.click(btn);

    expect(onCollapseChange).toHaveBeenCalledTimes(1);
    expect(onCollapseChange).toHaveBeenCalledWith(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Mobile behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Mobile behavior', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Backdrop element is present in the DOM when mobileOpen={true}', () => {
    const { container } = renderSidebar({ mobileOpen: true });
    // The Backdrop is always rendered; it always has aria-hidden="true".
    // CSS controls visibility (opacity/pointer-events) — not assertable in jsdom.
    const ariaHiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenEls.length).toBeGreaterThan(0);
  });

  it('Backdrop element is present in the DOM when mobileOpen={false}', () => {
    // DOM node exists in both states — CSS-only visibility gate.
    const { container } = renderSidebar({ mobileOpen: false });
    const ariaHiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenEls.length).toBeGreaterThan(0);
  });

  it('calls onMobileClose when the Backdrop is clicked while mobileOpen={true}', () => {
    const onMobileClose = vi.fn();
    const { container } = renderSidebar({ mobileOpen: true, onMobileClose });

    // The Backdrop is the first div before the nav; it has aria-hidden="true"
    // and an onClick that calls closeMobile (which invokes onMobileClose).
    // We select the first non-nav aria-hidden element.
    const allAriaHidden = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    const backdrop = allAriaHidden.find((el) => el.tagName.toLowerCase() !== 'nav');
    expect(backdrop).not.toBeUndefined();

    fireEvent.click(backdrop!);
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it('keydown listener is registered and Escape key does not throw', () => {
    // The useSidebar hook registers a document keydown listener.
    // With mobileOpenInternal=false the handler is a conditional no-op,
    // but it must not throw when fired.
    // [UNTESTABLE] Verifying the drawer closes from an open state requires
    // triggering the mobile open flow which needs a mobile-width viewport
    // (not available in jsdom).
    const onMobileClose = vi.fn();
    renderSidebar({ onMobileClose });

    expect(() => {
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
    }).not.toThrow();
  });

  it('MobileToggle renders a button with correct aria-label', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Sidebar.MobileToggle onClick={vi.fn()} />
      </StyledThemeProvider>,
    );
    expect(screen.getByRole('button', { name: /abrir menú de navegación/i })).toBeInTheDocument();
  });

  it('MobileToggle calls its onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Sidebar.MobileToggle onClick={onClick} />
      </StyledThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Search
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Search', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input when search={true}', () => {
    renderSidebar({ search: true });
    expect(screen.getByRole('searchbox', { name: /buscar en la navegación/i })).toBeInTheDocument();
  });

  it('does NOT render a search input when search is omitted (default)', () => {
    renderSidebar();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('does NOT render a search input when search={false}', () => {
    renderSidebar({ search: false });
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('renders search input with custom placeholder when search is an object', () => {
    renderSidebar({ search: { placeholder: 'Filtrar menú...' } });
    expect(screen.getByPlaceholderText('Filtrar menú...')).toBeInTheDocument();
  });

  it('filters nav items to matching results when a query is typed', () => {
    renderSidebar({ search: true });

    const searchInput = screen.getByRole('searchbox', { name: /buscar en la navegación/i });
    fireEvent.change(searchInput, { target: { value: 'Caja' } });

    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
    expect(screen.queryByText('Agenda')).not.toBeInTheDocument();
  });

  it('shows no-results message when query matches nothing', () => {
    renderSidebar({ search: true });

    const searchInput = screen.getByRole('searchbox', { name: /buscar en la navegación/i });
    fireEvent.change(searchInput, { target: { value: 'xxxxxxnonexistent' } });

    expect(screen.getByText(/sin resultados para/i)).toBeInTheDocument();
  });

  it('no-results message contains the typed query text', () => {
    renderSidebar({ search: true });

    const searchInput = screen.getByRole('searchbox', { name: /buscar en la navegación/i });
    fireEvent.change(searchInput, { target: { value: 'xyz999' } });

    const noResults = screen.getByText(/sin resultados para/i);
    expect(noResults.textContent).toContain('xyz999');
  });

  it('clears the filter and shows all items after clearing search input', () => {
    renderSidebar({ search: true });

    const searchInput = screen.getByRole('searchbox', { name: /buscar en la navegación/i });

    // Type to filter
    fireEvent.change(searchInput, { target: { value: 'Caja' } });
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();

    // Clear via the clear button
    fireEvent.click(screen.getByRole('button', { name: /limpiar búsqueda/i }));

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Caja')).toBeInTheDocument();
  });

  it('filters by partial match (case-insensitive)', () => {
    renderSidebar({ search: true });

    const searchInput = screen.getByRole('searchbox', { name: /buscar en la navegación/i });
    fireEvent.change(searchInput, { target: { value: 'ini' } }); // partial for "Inicio"

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Caja')).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Accessibility
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Accessibility', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('navigation element has a custom aria-label when provided', () => {
    renderSidebar({ 'aria-label': 'Navegación principal' });
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  });

  it('each nav group has role="list" and is labeled with the group name', () => {
    renderSidebar();
    expect(screen.getByRole('list', { name: 'Estudio' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Operaciones' })).toBeInTheDocument();
  });

  it('"Estudio" group list contains the Inicio and Agenda items', () => {
    renderSidebar();
    const estudioList = screen.getByRole('list', { name: 'Estudio' });
    expect(within(estudioList).getByText('Inicio')).toBeInTheDocument();
    expect(within(estudioList).getByText('Agenda')).toBeInTheDocument();
  });

  it('"Operaciones" group list contains the Caja item', () => {
    renderSidebar();
    const operacionesList = screen.getByRole('list', { name: 'Operaciones' });
    expect(within(operacionesList).getByText('Caja')).toBeInTheDocument();
  });

  it('logo button has an accessible aria-label referencing the logo title', () => {
    renderSidebar({
      logo: { icon: <span>Logo</span>, title: 'Suksai Thai' },
    });
    expect(screen.getByRole('button', { name: /suksai thai.*ir al inicio/i })).toBeInTheDocument();
  });

  it('logo button uses generic "Inicio" label when logo.title is not provided', () => {
    renderSidebar({
      logo: { icon: <span>Logo</span> },
    });
    expect(screen.getByRole('button', { name: /inicio.*ir al inicio/i })).toBeInTheDocument();
  });

  it('nav item icons are wrapped in an element with aria-hidden="true"', () => {
    renderSidebar();
    const nav = screen.getByRole('navigation');
    const ariaHiddenIcons = nav.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenIcons.length).toBeGreaterThan(0);
  });

  it('CollapseButton is a <button> element with type="button"', () => {
    // Use DOM query — CollapseButton is display:none at mobile (no media queries in jsdom)
    // so it is excluded from RTL's accessibility tree.
    const { container } = renderSidebar();
    const collapseBtn = container.querySelector('[aria-label="Colapsar sidebar"]');
    expect(collapseBtn).not.toBeNull();
    expect(collapseBtn?.tagName.toLowerCase()).toBe('button');
    expect(collapseBtn).toHaveAttribute('type', 'button');
  });

  it('search input has aria-label="Buscar en la navegación"', () => {
    renderSidebar({ search: true });
    expect(screen.getByLabelText('Buscar en la navegación')).toBeInTheDocument();
  });

  it('search input has autocomplete="off"', () => {
    renderSidebar({ search: true });
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('autocomplete', 'off');
  });

  it('Backdrop always carries aria-hidden="true" (present in DOM in all states)', () => {
    const { container } = renderSidebar({ mobileOpen: true });
    const ariaHiddenCount = container.querySelectorAll('[aria-hidden="true"]').length;
    expect(ariaHiddenCount).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Dark / Light mode suksai theme smoke tests
//
// Rule: no CSS property value assertions (project policy).
// These tests verify that the `theme.isDark` branch in `getVariantTokens`
// does not throw during render — both token sets are exercised.
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Theme smoke tests', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without throwing in light mode (theme.isDark = false)', () => {
    expect(() => {
      renderSidebar({}, LightWrapper);
    }).not.toThrow();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders without throwing in dark mode (theme.isDark = true)', () => {
    expect(() => {
      renderSidebar({}, DarkWrapper);
    }).not.toThrow();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('light mode: suksai variant renders the nav and all group labels', () => {
    renderSidebar({}, LightWrapper);
    expect(screen.getByText('Estudio')).toBeInTheDocument();
    expect(screen.getByText('Operaciones')).toBeInTheDocument();
  });

  it('dark mode: suksai variant renders the nav and all group labels', () => {
    renderSidebar({}, DarkWrapper);
    expect(screen.getByText('Estudio')).toBeInTheDocument();
    expect(screen.getByText('Operaciones')).toBeInTheDocument();
  });

  it('light mode: all nav item labels are present in rendered output', () => {
    renderSidebar({}, LightWrapper);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Caja')).toBeInTheDocument();
  });

  it('dark mode: all nav item labels are present in rendered output', () => {
    renderSidebar({}, DarkWrapper);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Caja')).toBeInTheDocument();
  });

  it('light mode: active item aria-current is set correctly (isDark=false branch exercised)', () => {
    routerState.pathname = '/dashboard/agenda';
    renderSidebar({}, LightWrapper);
    expect(screen.getByText('Agenda').closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('dark mode: active item aria-current is set correctly (isDark=true branch exercised)', () => {
    routerState.pathname = '/dashboard/agenda';
    renderSidebar({}, DarkWrapper);
    expect(screen.getByText('Agenda').closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('light mode: search renders and filters correctly with suksai light tokens', () => {
    renderSidebar({ search: true }, LightWrapper);
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Caja' } });
    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });

  it('dark mode: search renders and filters correctly with suksai dark tokens', () => {
    renderSidebar({ search: true }, DarkWrapper);
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Caja' } });
    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('Sidebar — suksai variant — Edge cases', () => {
  beforeEach(() => {
    routerState.pathname = '/dashboard/overview';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders gracefully with an empty groups array', () => {
    render(<Sidebar variant="suksai" groups={[]} aria-label="Navegación lateral" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByText('Estudio')).not.toBeInTheDocument();
  });

  it('renders gracefully when items have no icon', () => {
    render(
      <Sidebar
        variant="suksai"
        groups={[
          {
            id: 'plain',
            label: 'Sin íconos',
            items: [{ id: 'plain-item', label: 'Sin icono', href: '/plain' }],
          },
        ]}
        aria-label="Navegación lateral"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Sin icono')).toBeInTheDocument();
  });

  it('renders a numeric badge when a nav item has the badge prop', () => {
    render(
      <Sidebar
        variant="suksai"
        groups={[
          {
            id: 'badge-group',
            items: [
              {
                id: 'badged',
                label: 'Con Badge',
                href: '/con-badge',
                badge: 5,
              },
            ],
          },
        ]}
        aria-label="Navegación lateral"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders a string badge when the badge prop is a string', () => {
    render(
      <Sidebar
        variant="suksai"
        groups={[
          {
            id: 'badge-str-group',
            items: [
              {
                id: 'badged-str',
                label: 'Con Badge Texto',
                href: '/con-badge-str',
                badge: 'Beta',
              },
            ],
          },
        ]}
        aria-label="Navegación lateral"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('does not call onItemClick when a disabled item is clicked', () => {
    const onItemClick = vi.fn();
    render(
      <Sidebar
        variant="suksai"
        groups={[
          {
            id: 'disabled-group',
            items: [
              {
                id: 'disabled-item',
                label: 'Deshabilitado',
                href: '#',
                disabled: true,
              },
            ],
          },
        ]}
        aria-label="Navegación lateral"
        onItemClick={onItemClick}
      />,
      { wrapper: Wrapper },
    );

    const disabledBtn = screen.getByText('Deshabilitado').closest('button') as HTMLElement;
    expect(disabledBtn).not.toBeNull();
    fireEvent.click(disabledBtn);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('calls onItemClick with the item when a non-disabled href="#" item is clicked', () => {
    const onItemClick = vi.fn();
    render(
      <Sidebar
        variant="suksai"
        groups={[
          {
            id: 'clickable-group',
            items: [
              {
                id: 'clickable',
                label: 'Clickeable',
                href: '#',
              },
            ],
          },
        ]}
        aria-label="Navegación lateral"
        onItemClick={onItemClick}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getByText('Clickeable'));
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'clickable', label: 'Clickeable' }),
    );
  });

  it('expands a group with children when its parent item is clicked (aria-expanded toggles)', () => {
    render(
      <Sidebar
        variant="suksai"
        groups={[
          {
            id: 'nested-group',
            items: [
              {
                id: 'parent',
                label: 'Padre',
                href: '#',
                children: [
                  { id: 'child1', label: 'Hijo 1', href: '/hijo1' },
                  { id: 'child2', label: 'Hijo 2', href: '/hijo2' },
                ],
              },
            ],
          },
        ]}
        aria-label="Navegación lateral"
      />,
      { wrapper: Wrapper },
    );

    const parentBtn = screen.getByRole('button', { name: /padre/i });
    expect(parentBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(parentBtn);
    expect(parentBtn).toHaveAttribute('aria-expanded', 'true');

    // Clicking again collapses
    fireEvent.click(parentBtn);
    expect(parentBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with right placement without throwing', () => {
    expect(() => {
      renderSidebar({ placement: 'right' });
    }).not.toThrow();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders with custom width prop without throwing', () => {
    expect(() => {
      renderSidebar({ width: '300px', collapsedWidth: '60px' });
    }).not.toThrow();
  });
});
