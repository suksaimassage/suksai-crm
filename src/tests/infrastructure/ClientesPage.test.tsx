/**
 * ClientesPage.test.tsx
 *
 * Integration tests for the ClientesPage component.
 *
 * Mocking strategy:
 *   - useClientes and useClienteDetalle are mocked at the module level so we
 *     control the data fed to the page without any network or Query Client setup.
 *   - TanStack Router hooks that the page (or its deps) call are stubbed.
 *   - The theme store is mocked to avoid matchMedia dependency.
 *   - i18next is initialised with the English clientes.json.
 *   - fireEvent is used for all interactions (@testing-library/user-event not installed).
 *
 * [TESTABILITY GAP] @testing-library/user-event is not installed.
 * fireEvent.change is used for typing into inputs (simulates value change event).
 * Install @testing-library/user-event for realistic keyboard event sequences.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import enClientes from '@infra/i18n/locales/en/clientes.json';
import esClientes from '@infra/i18n/locales/es/clientes.json';
import {
  MOCK_CLIENTES_TABLE,
  MOCK_KPI,
  MOCK_LUCIA_DETALLE,
} from '@infra/pages/ClientesPage/Clientes.fixtures';
import type { IUseClientesResult } from '@infra/hooks/useClientes';
import type { IUseClienteDetalleResult } from '@infra/hooks/useClienteDetalle';

// ── Module-level mocks ────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useParams: () => ({}),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('@app/stores/useThemeStore', () => ({
  useIsDark: vi.fn(() => false),
  useThemeActions: vi.fn(() => ({ toggleTheme: vi.fn(), setTheme: vi.fn() })),
}));

vi.mock('@infra/hooks/useClientes', () => ({
  useClientes: vi.fn(),
}));

vi.mock('@infra/hooks/useClienteDetalle', () => ({
  useClienteDetalle: vi.fn(),
}));

vi.mock('@infra/i18n/namespace-loader', () => ({
  loadNamespaces: vi.fn(() => Promise.resolve()),
  loadNamespace: vi.fn(() => Promise.resolve()),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useClientes } from '@infra/hooks/useClientes';
import { useClienteDetalle } from '@infra/hooks/useClienteDetalle';
import { useUserStore } from '@app/stores/useUserStore';
import { ClientesPage } from '@infra/pages/ClientesPage/ClientesPage';

// ── i18n test instance ────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['clientes', 'common'],
  defaultNS: 'clientes',
  resources: {
    en: { clientes: enClientes, common: {} },
    es: { clientes: esClientes, common: {} },
  },
  interpolation: { escapeValue: false },
});

// ── Wrapper ───────────────────────────────────────────────────────────────────

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient()}>
      <I18nextProvider i18n={testI18n}>
        <StyledThemeProvider theme={lightTheme}>
          <ToastProvider>{children}</ToastProvider>
        </StyledThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

// ── Default hook return values ────────────────────────────────────────────────

const DEFAULT_CLIENTES_RESULT: IUseClientesResult = {
  rows: MOCK_CLIENTES_TABLE,
  total: MOCK_CLIENTES_TABLE.length,
  kpi: MOCK_KPI,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

const DEFAULT_DETALLE_RESULT: IUseClienteDetalleResult = {
  detalle: null,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

// ── beforeEach — reset mocks to defaults ─────────────────────────────────────

beforeEach(() => {
  // Reset to English before every test. The "table column changes" suite switches
  // to Spanish to assert i18n-reactive date formatting; this guard prevents that
  // language change from leaking into the English-based assertions of other suites.
  if (testI18n.language !== 'en') void testI18n.changeLanguage('en');

  vi.mocked(useClientes).mockReturnValue(DEFAULT_CLIENTES_RESULT);
  vi.mocked(useClienteDetalle).mockReturnValue(DEFAULT_DETALLE_RESULT);

  // Seed user store with a minimal authenticated user
  useUserStore.setState({
    user: {
      id: 1,
      nombre: 'Test Admin',
      apellidos: '',
      email: 'admin@test.com',
      roles: ['superadmin'],
      isActive: true,
      centroPrincipalNombre: null,
    },
    status: 'authenticated',
    expiresAt: Date.now() + 3_600_000,
  });
});

// ── KPI grid ─────────────────────────────────────────────────────────────────

describe('ClientesPage — KPI grid', () => {
  it('renders 4 KPI cards with their titles', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    expect(screen.getByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('New (30 days)')).toBeInTheDocument();
    expect(screen.getByText('Recurrence')).toBeInTheDocument();
    expect(screen.getByText('Avg. Spend')).toBeInTheDocument();
  });

  it('KPI value for totalClientes comes from the mock KPI fixture (642)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    // 642 appears in both the KPI strip value and the "Todos" tab count (both sourced from kpi.totalClientes)
    expect(screen.getAllByText('642').length).toBeGreaterThanOrEqual(1);
  });

  it('KPI value for nuevos30Dias comes from the mock KPI fixture (24)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByText('24')).toBeInTheDocument();
  });
});

// ── Segment filter pills ──────────────────────────────────────────────────────

describe('ClientesPage — segment filter pills', () => {
  it('renders all 6 segment filter pills', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    // Pill buttons sit inside a role="group" — query within that group to avoid
    // ambiguity with SegmentoBadge text rendered inside table rows.
    const pillGroup = screen.getByRole('group', { name: /filter by segment/i });
    const pillButtons = within(pillGroup).getAllByRole('button');
    expect(pillButtons).toHaveLength(6);
  });

  it('"All" pill has aria-pressed=true on initial render', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    const allPill = screen.getByRole('button', { name: /^All/i });
    expect(allPill).toHaveAttribute('aria-pressed', 'true');
  });

  it('VIP pill has aria-pressed=false on initial render', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    const vipPill = screen.getByRole('button', { name: /^VIP/i });
    expect(vipPill).toHaveAttribute('aria-pressed', 'false');
  });

  it('segment filter group has accessible aria-label', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByRole('group', { name: /filter by segment/i })).toBeInTheDocument();
  });
});

// ── Search input ──────────────────────────────────────────────────────────────

describe('ClientesPage — search input', () => {
  it('renders the search input with the correct placeholder', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText(/Search by name, email or phone/i)).toBeInTheDocument();
  });

  it('search input has accessible aria-label', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(
      screen.getByRole('searchbox', { name: /Search by name, email or phone/i }),
    ).toBeInTheDocument();
  });
});

// ── Table rendering ───────────────────────────────────────────────────────────

describe('ClientesPage — table rendering', () => {
  it('renders a row button for each of the 8 mock clients', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    for (const row of MOCK_CLIENTES_TABLE) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`View detail for ${row.nombreCompleto}`, 'i'),
        }),
      ).toBeInTheDocument();
    }
  });

  it('renders Lucía Ramos name in the table', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByText('Lucía Ramos')).toBeInTheDocument();
  });

  it('renders Diego Romero (inactivo) in the table', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByText('Diego Romero')).toBeInTheDocument();
  });
});

// ── Row click → detail panel ──────────────────────────────────────────────────

describe('ClientesPage — row click opens detail panel', () => {
  it('clicking Lucía row triggers useClienteDetalle with clienteId=1', () => {
    // Set up detail mock to return data after click triggers a re-render
    vi.mocked(useClienteDetalle).mockReturnValue({
      detalle: MOCK_LUCIA_DETALLE,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ClientesPage />, { wrapper: Wrapper });

    const luciaBtn = screen.getByRole('button', { name: /View detail for Lucía Ramos/i });
    act(() => {
      fireEvent.click(luciaBtn);
    });

    // After click useClienteDetalle should have been called with id=1
    expect(vi.mocked(useClienteDetalle)).toHaveBeenCalledWith(1);
  });

  it('detail panel (role="complementary") becomes visible after clicking a row', () => {
    // Initially no panel — after click the panel should appear
    // We need to update what useClienteDetalle returns after click triggers re-render
    vi.mocked(useClienteDetalle).mockReturnValueOnce(DEFAULT_DETALLE_RESULT).mockReturnValue({
      detalle: MOCK_LUCIA_DETALLE,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ClientesPage />, { wrapper: Wrapper });

    // Panel is not open initially
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /View detail for Lucía Ramos/i }));
    });

    // Panel should now be present
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});

// ── Close panel ───────────────────────────────────────────────────────────────

describe('ClientesPage — close panel', () => {
  it('closes the detail panel when the close button is clicked', () => {
    vi.mocked(useClienteDetalle).mockReturnValue({
      detalle: MOCK_LUCIA_DETALLE,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ClientesPage />, { wrapper: Wrapper });

    // Open panel
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /View detail for Lucía Ramos/i }));
    });

    const panel = screen.getByRole('complementary');
    expect(panel).toBeInTheDocument();

    // Close it
    act(() => {
      fireEvent.click(within(panel).getByRole('button', { name: /close client panel/i }));
    });

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});

// ── Segment filtering ─────────────────────────────────────────────────────────

describe('ClientesPage — segment filtering', () => {
  it('clicking VIP filter shows only VIP clients (Lucía Ramos and Paula Herrera)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^VIP/i }));
    });

    // VIP clients in fixture: Lucía Ramos (1) and Paula Herrera (8)
    expect(
      screen.getByRole('button', { name: /View detail for Lucía Ramos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /View detail for Paula Herrera/i }),
    ).toBeInTheDocument();

    // Adrián Torres is activo — must NOT be visible
    expect(
      screen.queryByRole('button', { name: /View detail for Adrián Torres/i }),
    ).not.toBeInTheDocument();
  });

  it('clicking "All" after VIP filter restores all 8 clients', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^VIP/i }));
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^All/i }));
    });

    for (const row of MOCK_CLIENTES_TABLE) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`View detail for ${row.nombreCompleto}`, 'i'),
        }),
      ).toBeInTheDocument();
    }
  });

  it('clicking "Inactive" shows only Diego Romero', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^Inactive/i }));
    });

    expect(
      screen.getByRole('button', { name: /View detail for Diego Romero/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /View detail for Lucía Ramos/i }),
    ).not.toBeInTheDocument();
  });

  it('clicked filter pill becomes aria-pressed=true', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    const vipPill = screen.getByRole('button', { name: /^VIP/i });
    act(() => {
      fireEvent.click(vipPill);
    });

    expect(vipPill).toHaveAttribute('aria-pressed', 'true');
  });
});

// ── Search filtering ──────────────────────────────────────────────────────────
// useDebouncedValue delays filter application by 200 ms — tests use fake timers
// so they can advance past the debounce window without real waiting.

describe('ClientesPage — search filtering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('searching "Lucía" filters to show Lucía Ramos', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    const searchInput = screen.getByRole('searchbox');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Lucía' } });
      vi.advanceTimersByTime(250); // advance past the 200 ms debounce
    });

    expect(
      screen.getByRole('button', { name: /View detail for Lucía Ramos/i }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /View detail for Adrián Torres/i }),
    ).not.toBeInTheDocument();
  });

  it('clearing search text restores all rows', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    const searchInput = screen.getByRole('searchbox');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Lucía' } });
      vi.advanceTimersByTime(250);
    });

    act(() => {
      fireEvent.change(searchInput, { target: { value: '' } });
      vi.advanceTimersByTime(250);
    });

    for (const row of MOCK_CLIENTES_TABLE) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`View detail for ${row.nombreCompleto}`, 'i'),
        }),
      ).toBeInTheDocument();
    }
  });

  it('searching by email filters correctly', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    const searchInput = screen.getByRole('searchbox');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'sara.castillo' } });
      vi.advanceTimersByTime(250);
    });

    expect(
      screen.getByRole('button', { name: /View detail for Sara Castillo/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /View detail for Lucía Ramos/i }),
    ).not.toBeInTheDocument();
  });

  it('searching by phone number filters correctly', () => {
    render(<ClientesPage />, { wrapper: Wrapper });

    const searchInput = screen.getByRole('searchbox');
    // Inés Vega's phone: +34 633 456 789
    act(() => {
      fireEvent.change(searchInput, { target: { value: '633 456 789' } });
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByRole('button', { name: /View detail for Inés Vega/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /View detail for Lucía Ramos/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('ClientesPage — loading state', () => {
  it('renders the page without crashing when isLoading=true', () => {
    vi.mocked(useClientes).mockReturnValue({
      ...DEFAULT_CLIENTES_RESULT,
      isLoading: true,
    });

    // Should not throw and should render the main layout
    expect(() => render(<ClientesPage />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders the page title even during loading', () => {
    vi.mocked(useClientes).mockReturnValue({
      ...DEFAULT_CLIENTES_RESULT,
      isLoading: true,
    });

    render(<ClientesPage />, { wrapper: Wrapper });

    // The page-level title is always visible; KPI cards hide their content in loading state
    expect(screen.getByText('Clients')).toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('ClientesPage — error state', () => {
  it('renders a page-level error alert with retry button when isError=true', () => {
    vi.mocked(useClientes).mockReturnValue({
      ...DEFAULT_CLIENTES_RESULT,
      rows: [] as IUseClientesResult['rows'],
      total: 0,
      isError: true,
    });

    render(<ClientesPage />, { wrapper: Wrapper });

    // A role="alert" banner appears with the error description and a retry button
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText(/could not load clients/i)).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

// ── Page header ───────────────────────────────────────────────────────────────

describe('ClientesPage — page header', () => {
  it('renders the page title "Clients"', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByText('Clients')).toBeInTheDocument();
  });

  it('renders the eyebrow "Client Management"', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByText('Client Management')).toBeInTheDocument();
  });

  it('renders the "New client" add button with accessible label', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /new client/i })).toBeInTheDocument();
  });
});

// ── Table column changes ───────────────────────────────────────────────────────
//
// These suites pin the recently-reworked client-table columns:
//   1. the `segmento` column header reads "Estado"/"Status" (not "Segmento")
//   2. `ultimaVisita` is formatted per the ACTIVE language (es ≠ en) and shows "—"
//      with a screen-reader label when the date is null
//   3. the `servicioTop` column renders `row.ritualFavorito`, "—" when null
//   4. the old `gastoAnual` / "Gasto año" column has been removed from the table
//
// Column order rendered by buildColumns():
//   [0] Cliente (sticky) · [1] Estado · [2] Frecuencia · [3] Última visita ·
//   [4] Servicio más solicitado · [5] acciones (empty header)

/**
 * Return the <tr> that renders a client by their (language-independent) name.
 * Locating by the visible name text — rather than the trigger's aria-label —
 * keeps the helper valid after a language switch, since the label is translated
 * ("View detail for …" → "Ver detalle de …") but the client name is not.
 */
function getRowByClientName(name: string): HTMLElement {
  const nameNode = screen.getByText(name, { selector: 'tr td *' });
  const row = nameNode.closest('tr');
  if (row === null) throw new Error(`No <tr> ancestor for client row "${name}"`);
  return row;
}

const COL_ULTIMA_VISITA = 3;
const COL_SERVICIO_TOP = 4;

// Functional goal: the segmento column is labelled "Estado" (es) / "Status" (en),
// distinct from the per-row SegmentoBadge values (Active / VIP / …).
describe('ClientesPage — table: "Estado" column header', () => {
  it('renders a column header "Status" (en) for the segmento column', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.getByRole('columnheader', { name: /^Status$/i })).toBeInTheDocument();
  });

  it('does NOT render a "Segmento" column header (the header is "Estado", not the raw field name)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.queryByRole('columnheader', { name: /segmento/i })).not.toBeInTheDocument();
  });

  it('renders the header as "Estado" after switching the language to Spanish', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    act(() => {
      void testI18n.changeLanguage('es');
    });
    expect(screen.getByRole('columnheader', { name: /^Estado$/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /^Status$/i })).not.toBeInTheDocument();
  });
});

// Functional goal: the Última visita cell is locale-formatted and reacts to a
// language switch; a null date degrades to "—" plus an accessible label.
describe('ClientesPage — table: "Última visita" locale-aware formatting', () => {
  it('formats Lucía Ramos’s last visit as a non-empty date string for the year 2026 (en)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    const cell = within(getRowByClientName('Lucía Ramos')).getAllByRole('cell')[COL_ULTIMA_VISITA];
    // Fixture date is 2026-04-10 → some localized form that still contains the year.
    expect(cell.textContent).toMatch(/2026/);
  });

  it('renders a DIFFERENT formatted string for the same date when the language changes es↔en', () => {
    const { rerender } = render(<ClientesPage />, { wrapper: Wrapper });

    const readCell = () =>
      within(getRowByClientName('Lucía Ramos'))
        .getAllByRole('cell')
        [COL_ULTIMA_VISITA].textContent.trim();

    const enText = readCell();

    act(() => {
      void testI18n.changeLanguage('es');
    });
    rerender(<ClientesPage />);
    const esText = readCell();

    // Core contract: the column reacts to the active language (es-ES vs en-GB month
    // abbreviations differ), so the two renderings must NOT be identical — and both
    // still describe the same 2026 visit.
    expect(esText).not.toBe(enText);
    expect(enText).toMatch(/2026/);
    expect(esText).toMatch(/2026/);
  });

  it('shows an em dash with an accessible "No visits recorded" label when ultimaVisita is null', () => {
    // Inés Vega (id 4) has ritualFavorito=null but a real ultimaVisita; we need a
    // client whose ultimaVisita is null, so inject one via the mock.
    vi.mocked(useClientes).mockReturnValue({
      ...DEFAULT_CLIENTES_RESULT,
      rows: [
        {
          ...MOCK_CLIENTES_TABLE[0],
          clienteId: 999,
          nombreCompleto: 'Sin Visita Cliente',
          ultimaVisita: null,
        },
      ] as IUseClientesResult['rows'],
      total: 1,
    });

    render(<ClientesPage />, { wrapper: Wrapper });

    const cell = within(getRowByClientName('Sin Visita Cliente')).getAllByRole('cell')[
      COL_ULTIMA_VISITA
    ];
    // Visible glyph is the em dash; the SR-only text carries the meaning.
    expect(cell.textContent).toContain('—');
    expect(within(cell).getByText('No visits recorded')).toBeInTheDocument();
  });
});

// Functional goal: the "Servicio más solicitado" column surfaces ritualFavorito,
// degrading to "—" + SR label when the client has no recorded service.
describe('ClientesPage — table: "Servicio más solicitado" column', () => {
  it('renders the column header "Most requested service" (en)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(
      screen.getByRole('columnheader', { name: /most requested service/i }),
    ).toBeInTheDocument();
  });

  it('renders ritualFavorito text for a client that has one (Lucía → "Tradicional Tailandés")', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    const cell = within(getRowByClientName('Lucía Ramos')).getAllByRole('cell')[COL_SERVICIO_TOP];
    expect(cell).toHaveTextContent('Tradicional Tailandés');
  });

  it('shows an em dash with an accessible "No service recorded" label when ritualFavorito is null (Inés Vega)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    // Inés Vega (id 4) has ritualFavorito: null in the fixture.
    const cell = within(getRowByClientName('Inés Vega')).getAllByRole('cell')[COL_SERVICIO_TOP];
    expect(cell.textContent).toContain('—');
    expect(within(cell).getByText('No service recorded')).toBeInTheDocument();
  });
});

// Functional goal: regression guard — the legacy gastoAnual / "Gasto año" column
// is gone from the client table. (The string still exists for the detail PANEL,
// which is closed here, so a table-scoped assertion is the precise check.)
describe('ClientesPage — table: legacy "Gasto año" column removed', () => {
  it('renders no "Annual spend" / "Gasto año" column header (en)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    expect(screen.queryByRole('columnheader', { name: /annual spend/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /gasto a/i })).not.toBeInTheDocument();
  });

  it('renders no "Annual spend" column header after switching to Spanish either', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    act(() => {
      void testI18n.changeLanguage('es');
    });
    expect(screen.queryByRole('columnheader', { name: /gasto a[ñn]o/i })).not.toBeInTheDocument();
  });

  it('exposes exactly the 5 expected labelled column headers (Cliente, Estado, Frecuencia, Última visita, Servicio)', () => {
    render(<ClientesPage />, { wrapper: Wrapper });
    // The acciones column has an empty header string, so it is not an accessible
    // columnheader by name; the 5 data columns are the labelled set.
    const headers = screen
      .getAllByRole('columnheader')
      .map((h) => h.textContent.trim())
      .filter((txt) => txt.length > 0);

    expect(headers).toEqual([
      'Client',
      'Status',
      'Frequency',
      'Last visit',
      'Most requested service',
    ]);
  });
});
