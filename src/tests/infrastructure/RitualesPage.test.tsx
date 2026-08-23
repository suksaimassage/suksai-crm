/**
 * RitualesPage.test.tsx
 *
 * Comprehensive tests for the RitualesPage component.
 * Strategy:
 *   - All hooks (useServicios, useTipoServicios, useDashboardCentroId, useUserStore)
 *     are mocked at module level so no QueryClientProvider or real network is needed.
 *   - i18n provider uses real en/rituales.json translations so text assertions are stable.
 *   - Layout primitives (PageLayout, Section, Container) are pass-through mocks to avoid
 *     styled-components theme requirement on layout shells.
 *   - No snapshot tests. No CSS assertions. Behaviour and semantics only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import enRituales from '@infra/i18n/locales/en/rituales.json';
import type { IServicio, ITipoServicio } from '@domain/models';

// ── Module-level mocks ─────────────────────────────────────────────────────────

vi.mock('@infra/hooks/useServicios', () => ({
  useServicios: vi.fn(),
}));

vi.mock('@infra/hooks/useTipoServicios', () => ({
  useTipoServicios: vi.fn(),
}));

vi.mock('@infra/hooks/useDashboardCentroId', () => ({
  useDashboardCentroId: vi.fn(),
}));

vi.mock('@infra/hooks/useReservasMes', () => ({
  useReservasMes: vi.fn(),
}));

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

// Layout primitives are pass-through so styled-components doesn't need full theme providers
// for the outer shell — our Wrapper already supplies the theme for page internals.
vi.mock('@infra/components/ui/core/Layout', () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Section: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Container: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { useServicios } from '@infra/hooks/useServicios';
import { useTipoServicios } from '@infra/hooks/useTipoServicios';
import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useReservasMes } from '@infra/hooks/useReservasMes';
import { useUserStore } from '@app/stores/useUserStore';
import { RitualesPage } from '@infra/pages/RitualesPage/RitualesPage';

// ── i18next test instance ──────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['rituales'],
  defaultNS: 'rituales',
  resources: { en: { rituales: enRituales } },
  interpolation: { escapeValue: false },
});

// ── Wrapper ────────────────────────────────────────────────────────────────────

interface IWrapperProps {
  readonly children: ReactNode;
}

const Wrapper = ({ children }: IWrapperProps) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockTipoServicios: ITipoServicio[] = [
  { id: 1, nombre: 'Masajes tradicionales', descripcion: null },
  { id: 2, nombre: 'Con aceites cálidos', descripcion: null },
];

const mockServicios: IServicio[] = [
  {
    id: 1,
    tipoServicioId: 1,
    nombre: 'Masaje Thai',
    descripcion: 'Presión profunda',
    duracionMinutos: 60,
    precioBase: 55,
    esBono: false,
    sesionesTotales: null,
    tieneDescuento: false,
    porcentajeDescuento: 0,
    estado: 'activo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    tipoServicioId: 2,
    nombre: 'Aceites de Jazmín',
    descripcion: 'Aceites cálidos',
    duracionMinutos: 75,
    precioBase: 75,
    esBono: false,
    sesionesTotales: null,
    tieneDescuento: true,
    porcentajeDescuento: 10,
    estado: 'activo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 3,
    tipoServicioId: 1,
    nombre: 'Bolsas herbales',
    descripcion: 'Complemento',
    duracionMinutos: 15,
    precioBase: 12,
    esBono: true,
    sesionesTotales: 5,
    tieneDescuento: false,
    porcentajeDescuento: 0,
    estado: 'activo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// ── Helper: default mock setup ─────────────────────────────────────────────────

interface ISetupOptions {
  readonly servicios?: IServicio[];
  readonly tipoServicios?: ITipoServicio[];
  readonly servLoading?: boolean;
  readonly tipoLoading?: boolean;
  readonly servError?: boolean;
  readonly roles?: readonly string[];
  readonly refetch?: () => unknown;
}

function setupMocks(opts: ISetupOptions = {}): ReturnType<typeof vi.fn> {
  const refetchMock = vi.fn();

  vi.mocked(useUserStore).mockImplementation((selector) =>
    selector({
      user: {
        id: 1,
        nombre: 'Admin',
        apellidos: '',
        email: 'a@b.com',
        roles: opts.roles ?? ['superadmin'],
        isActive: true,
        centroPrincipalNombre: null,
      },
    } as unknown as Parameters<typeof selector>[0]),
  );

  vi.mocked(useDashboardCentroId).mockReturnValue({
    centroId: 1,
    isLoading: false,
    isError: false,
  });

  // RitualesPage reads only `.data` from useReservasMes; a minimal stub avoids the
  // QueryClientProvider requirement that this hook's internal useQuery would impose.
  // `data: undefined` mirrors the "no reservas data yet" state → the Bookings/month
  // KPI falls back to the N/A label, which several assertions below rely on.
  vi.mocked(useReservasMes).mockReturnValue({
    data: undefined,
  } as unknown as ReturnType<typeof useReservasMes>);

  vi.mocked(useServicios).mockReturnValue({
    servicios: opts.servicios ?? mockServicios,
    isLoading: opts.servLoading ?? false,
    isError: opts.servError ?? false,
    refetch: opts.refetch ?? refetchMock,
  });

  vi.mocked(useTipoServicios).mockReturnValue({
    tipoServicios: opts.tipoServicios ?? mockTipoServicios,
    isLoading: opts.tipoLoading ?? false,
    isError: false,
  });

  return refetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('RitualesPage — loading state', () => {
  it('renders skeleton grid with aria-busy when service query is loading', () => {
    setupMocks({ servLoading: true });
    render(<RitualesPage />, { wrapper: Wrapper });

    // SkeletonGrid renders a grid with aria-busy="true"
    // The aria-label comes from en/rituales.json loading.services = "Loading services…"
    expect(screen.getByLabelText('Loading services…')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders skeleton grid with aria-busy when tipo query is loading', () => {
    setupMocks({ tipoLoading: true });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByLabelText('Loading services…')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders KPI skeleton strip with aria-busy when loading', () => {
    setupMocks({ servLoading: true });
    render(<RitualesPage />, { wrapper: Wrapper });

    // The aria-label comes from en/rituales.json loading.kpis = "Loading KPIs…"
    expect(screen.getByLabelText('Loading KPIs…')).toHaveAttribute('aria-busy', 'true');
  });

  it('does not render service cards while loading', () => {
    setupMocks({ servLoading: true });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByText('Masaje Thai')).not.toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('RitualesPage — error state', () => {
  it('renders error empty state when service query fails', () => {
    setupMocks({ servError: true });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/could not load the catalogue/i)).toBeInTheDocument();
  });

  it('renders retry button when error state is active', () => {
    setupMocks({ servError: true });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined);
    setupMocks({ servError: true, refetch: refetchMock });
    render(<RitualesPage />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('RitualesPage — empty data state', () => {
  it('renders no-data message when servicios array is empty', () => {
    setupMocks({ servicios: [] });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/no massages yet/i)).toBeInTheDocument();
  });

  it('does not render complementos section when no bono services exist', () => {
    setupMocks({
      servicios: mockServicios.filter((s) => !s.esBono),
    });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByText(/add-ons/i)).not.toBeInTheDocument();
  });
});

// ── KPI strip ─────────────────────────────────────────────────────────────────

describe('RitualesPage — KPI strip', () => {
  it('renders "Active massages" KPI label', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // "Active massages" is shared by the KPI label and the grid section title,
    // so getAllByText is the correct variant — assert the label renders at least once.
    expect(screen.getAllByText(/active massages/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders correct active massages count (non-bono activos only)', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // mockServicios has 2 non-bono active services (ids 1 and 2).
    // "Active massages" appears in both the KPI strip and the grid section title;
    // pick the occurrence whose KPI cell also holds the numeric count.
    const labels = screen.getAllByText(/active massages/i);
    const kpiCell = labels
      .map((label) => label.closest('div') as HTMLElement)
      .find((cell) => within(cell).queryByText('2') !== null);
    expect(kpiCell).toBeDefined();
    expect(within(kpiCell!).getByText('2')).toBeInTheDocument();
  });

  it('renders "N/A" for Bookings / month (kpi:unavailable)', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/bookings \/ month/i)).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders "Average price" KPI label at least once (KPI strip)', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // "Average price" appears in KPI strip and also rail footer summary — getAllBy is correct
    expect(screen.getAllByText(/average price/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Categories" KPI with correct distinct category count', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // 2 non-bono services: tipoServicioId 1 and 2 → 2 distinct categories
    // Use exact text match to avoid matching "Catalogue categories" in the rail header
    const kpiLabel = screen.getByText('Categories');
    const kpiCell = kpiLabel.closest('div') as HTMLElement;
    expect(within(kpiCell).getByText('2')).toBeInTheDocument();
  });
});

// ── Tab strip ─────────────────────────────────────────────────────────────────

describe('RitualesPage — tab strip', () => {
  it('renders tablist with accessible label', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('tablist', { name: /filter by status/i })).toBeInTheDocument();
  });

  it('renders 4 tabs: Active, Inactive, Archived, All', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });

  it('"Active" tab is selected by default', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const activeTab = screen.getByRole('tab', { name: /^active/i });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('other tabs are not selected by default', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const allTab = screen.getByRole('tab', { name: /^all/i });
    const inactiveTab = screen.getByRole('tab', { name: /^inactive/i });
    const archivedTab = screen.getByRole('tab', { name: /^archived/i });

    expect(allTab).toHaveAttribute('aria-selected', 'false');
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    expect(archivedTab).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking "All" tab sets it as selected', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const allTab = screen.getByRole('tab', { name: /^all/i });
    fireEvent.click(allTab);

    expect(allTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /^active/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking "Inactive" tab shows coming-soon grid state', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('tab', { name: /^inactive/i }));

    expect(screen.getByText(/this view will be available soon/i)).toBeInTheDocument();
  });

  it('clicking "Archived" tab shows coming-soon grid state', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('tab', { name: /^archived/i }));

    expect(screen.getByText(/this view will be available soon/i)).toBeInTheDocument();
  });

  it('coming-soon state is NOT shown on Active tab', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByText(/this view will be available soon/i)).not.toBeInTheDocument();
  });

  it('tab count badge on Active tab reflects non-bono active services', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // Active tab: non-bono activos = 2 (Masaje Thai + Aceites de Jazmín)
    const tablist = screen.getByRole('tablist');
    const activeTab = within(tablist).getByRole('tab', { name: /^active/i });
    expect(within(activeTab).getByText('2')).toBeInTheDocument();
  });

  it('tab count badge on All tab reflects total non-bono services', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const tablist = screen.getByRole('tablist');
    const allTab = within(tablist).getByRole('tab', { name: /^all/i });
    expect(within(allTab).getByText('2')).toBeInTheDocument();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe('RitualesPage — search', () => {
  it('renders search input with accessible label', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/search massages/i)).toBeInTheDocument();
  });

  it('filters cards by service name on input (case-insensitive)', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/search massages/i);
    fireEvent.change(input, { target: { value: 'masaje' } });

    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.queryByText('Aceites de Jazmín')).not.toBeInTheDocument();
  });

  it('restores full card list when search is cleared', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/search massages/i);
    fireEvent.change(input, { target: { value: 'masaje' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.getByText('Aceites de Jazmín')).toBeInTheDocument();
  });

  it('shows no-results empty state when search yields no matches', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/search massages/i);
    fireEvent.change(input, { target: { value: 'zzznomatch' } });

    expect(screen.getByText(/no results for/i)).toBeInTheDocument();
  });

  it('live region announces result count when search is active', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/search massages/i);
    fireEvent.change(input, { target: { value: 'masaje' } });

    // The visually-hidden live region (aria-live="polite") should have the count
    const liveRegion = document.getElementById('rituales-search-status');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toMatch(/1 massages found/i);
  });

  it('live region is empty when no search query is active', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const liveRegion = document.getElementById('rituales-search-status');
    expect(liveRegion?.textContent).toBe('');
  });
});

// ── Category rail ─────────────────────────────────────────────────────────────

describe('RitualesPage — category rail', () => {
  it('renders listbox with accessible label', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('listbox', { name: /filter by category/i })).toBeInTheDocument();
  });

  it('renders "All massages" option in the rail', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('option', { name: /all massages/i })).toBeInTheDocument();
  });

  it('"All massages" option is selected by default', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('option', { name: /all massages/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('renders a row for each tipoServicio', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('option', { name: /masajes tradicionales/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /con aceites cálidos/i })).toBeInTheDocument();
  });

  it('"All massages" option shows total non-bono count', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const allOption = screen.getByRole('option', { name: /all massages/i });
    // 2 non-bono services in mockServicios
    expect(within(allOption).getByText('2')).toBeInTheDocument();
  });

  it('clicking a category row filters the grid to that category', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // tipoServicioId=1 (Masajes tradicionales) has Masaje Thai
    // tipoServicioId=2 (Con aceites cálidos) has Aceites de Jazmín
    fireEvent.click(screen.getByRole('option', { name: /masajes tradicionales/i }));

    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.queryByText('Aceites de Jazmín')).not.toBeInTheDocument();
  });

  it('selecting the active category row marks it as aria-selected', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('option', { name: /masajes tradicionales/i }));

    expect(screen.getByRole('option', { name: /masajes tradicionales/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('clicking "All massages" after category selection resets to all services', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // First select a category
    fireEvent.click(screen.getByRole('option', { name: /masajes tradicionales/i }));
    expect(screen.queryByText('Aceites de Jazmín')).not.toBeInTheDocument();

    // Then click "All massages"
    fireEvent.click(screen.getByRole('option', { name: /all massages/i }));

    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.getByText('Aceites de Jazmín')).toBeInTheDocument();
  });

  it('category rows are keyboard-activatable with Enter', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const masajesOption = screen.getByRole('option', { name: /masajes tradicionales/i });
    masajesOption.focus();
    fireEvent.keyDown(masajesOption, { key: 'Enter' });

    expect(masajesOption).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Aceites de Jazmín')).not.toBeInTheDocument();
  });

  it('category rows are keyboard-activatable with Space', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const masajesOption = screen.getByRole('option', { name: /masajes tradicionales/i });
    masajesOption.focus();
    fireEvent.keyDown(masajesOption, { key: ' ' });

    expect(masajesOption).toHaveAttribute('aria-selected', 'true');
  });
});

// ── Service cards ─────────────────────────────────────────────────────────────

describe('RitualesPage — service cards', () => {
  it('renders a card for each non-bono service', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.getByText('Aceites de Jazmín')).toBeInTheDocument();
  });

  it('does not render bono service in the main grid', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // Bolsas herbales is esBono=true — should not appear in the main grid
    // It appears in the complementos section instead
    const grid = document.getElementById('rituales-grid')!;
    expect(within(grid).queryByText('Bolsas herbales')).not.toBeInTheDocument();
  });

  it('card shows the duration pill with "X min"', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/60 min/i)).toBeInTheDocument();
    expect(screen.getByText(/75 min/i)).toBeInTheDocument();
  });

  it('card shows estado Tag (activo → "Active")', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // "Active" appears in KPI strip and as card status tags — both are valid
    const activeTags = screen.getAllByText('Active');
    expect(activeTags.length).toBeGreaterThanOrEqual(2);
  });

  it('card shows discount Tag when tieneDescuento=true and porcentajeDescuento>0', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // Aceites de Jazmín has 10% discount
    expect(screen.getByText(/10% off/i)).toBeInTheDocument();
  });

  it('card does not show any discount Tag when no services have a discount', () => {
    // Only provide services with tieneDescuento=false to verify no discount tag appears
    const noDiscountServicios: IServicio[] = [
      { ...mockServicios[0], tieneDescuento: false, porcentajeDescuento: 0 },
    ];
    setupMocks({ servicios: noDiscountServicios });
    render(<RitualesPage />, { wrapper: Wrapper });

    // No discount percentage tags of any kind should appear
    expect(screen.queryByText(/% off/i)).not.toBeInTheDocument();
  });

  it('card shows "Package" Tag when esBono=true (in complementos section)', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // Bolsas herbales is in complementos section and has esBono=true
    expect(screen.getByText('Package')).toBeInTheDocument();
  });

  it('card has accessible aria-label for editing', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/edit masaje thai/i)).toBeInTheDocument();
  });
});

// ── Role-based "Add new" card ─────────────────────────────────────────────────

describe('RitualesPage — role-based add new card', () => {
  it('renders "Create new massage" dashed card for superadmin', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<RitualesPage />, { wrapper: Wrapper });

    // "Create new massage" add card appears in both main grid and complementos section
    // when canWrite=true and bono services exist — getAllBy is the correct variant
    const addCards = screen.getAllByRole('button', { name: /create new massage/i });
    expect(addCards.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render "Create new massage" card for propietario', () => {
    // Per .claude/rules/database-schema.md RBAC matrix, `propietario` has
    // terapeuta-equivalent access and CANNOT INSERT into `servicios` — only
    // `superadmin` manages the massage catalogue. canWrite() is superadmin-only.
    setupMocks({ roles: ['propietario'] });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByRole('button', { name: /create new massage/i })).not.toBeInTheDocument();
  });

  it('does NOT render "Create new massage" card for recepcionista', () => {
    setupMocks({ roles: ['recepcionista'] });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByRole('button', { name: /create new massage/i })).not.toBeInTheDocument();
  });

  it('does NOT render "Create new massage" card for terapeuta', () => {
    setupMocks({ roles: ['terapeuta'] });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByRole('button', { name: /create new massage/i })).not.toBeInTheDocument();
  });
});

// ── Complementos section ──────────────────────────────────────────────────────

describe('RitualesPage — complementos section', () => {
  it('renders complementos section when bono services exist', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // "Add-ons &" is part of the complementos section title
    expect(screen.getByText(/add-ons &/i)).toBeInTheDocument();
  });

  it('complementos section contains esBono=true services', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const complementosSection = screen.getByRole('region', {
      name: /add-ons/i,
    });
    expect(within(complementosSection).getByText('Bolsas herbales')).toBeInTheDocument();
  });

  it('does NOT render complementos section when no bono services exist', () => {
    setupMocks({
      servicios: mockServicios.filter((s) => !s.esBono),
    });
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByText(/add-ons &/i)).not.toBeInTheDocument();
  });

  it('complementos section does NOT render non-bono services', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const complementosSection = screen.getByRole('region', { name: /add-ons/i });
    expect(within(complementosSection).queryByText('Masaje Thai')).not.toBeInTheDocument();
  });
});

// ── Header actions ────────────────────────────────────────────────────────────

describe('RitualesPage — header actions', () => {
  it('"New massage" header button renders and is enabled', () => {
    // Use non-canWrite role to avoid the "Create new massage" add card appearing in the DOM,
    // which would also match a /new massage/i name query.
    setupMocks({ roles: ['recepcionista'] });
    render(<RitualesPage />, { wrapper: Wrapper });

    const newBtn = screen.getByRole('button', { name: /^new massage$/i });
    expect(newBtn).toBeEnabled();
  });

  it('does not render an "Import catalogue" button (removed)', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.queryByRole('button', { name: /import catalogue/i })).not.toBeInTheDocument();
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('RitualesPage — accessibility', () => {
  it('tab strip has role="tablist" with aria-label', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('tablist', { name: /filter by status/i })).toBeInTheDocument();
  });

  it('each tab has role="tab"', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(4);
  });

  it('each tab has aria-selected attribute', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('service grid has role="tabpanel" and search results announce via a dedicated polite live region', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // The grid is the tabpanel for the status tabs. It is intentionally NOT a
    // live region — making the whole panel aria-live would over-announce every
    // card on each filter change. The search-results count is announced through
    // a dedicated visually-hidden live region (#rituales-search-status) instead.
    const grid = document.getElementById('rituales-grid')!;
    expect(grid).toHaveAttribute('role', 'tabpanel');
    expect(grid).not.toHaveAttribute('aria-live');

    const searchStatus = document.getElementById('rituales-search-status')!;
    expect(searchStatus).toHaveAttribute('aria-live', 'polite');
  });

  it('category rail has role="listbox"', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('each category option has role="option"', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const options = screen.getAllByRole('option');
    // "All massages" + 2 categories = at least 3
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it('each category option has aria-selected attribute', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const options = screen.getAllByRole('option');
    options.forEach((option) => {
      expect(option).toHaveAttribute('aria-selected');
    });
  });

  it('search input has aria-label', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label');
  });

  it('search input has aria-describedby pointing to live region', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/search massages/i);
    const describedById = input.getAttribute('aria-describedby');
    expect(describedById).toBe('rituales-search-status');
    expect(document.getElementById(describedById!)).toBeInTheDocument();
  });

  it('N/A KPI cell has accessible aria-label describing its meaning', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    const ndEl = screen.getByText('N/A');
    expect(ndEl.getAttribute('aria-label')).toMatch(/available in next version/i);
  });
});

// ── Filter interaction — category + tab combined ───────────────────────────────

describe('RitualesPage — combined filter interactions', () => {
  it('combining category filter with "All" tab shows correct filtered cards', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // Switch to "All" tab first
    fireEvent.click(screen.getByRole('tab', { name: /^all/i }));
    // Then filter by category 1
    fireEvent.click(screen.getByRole('option', { name: /masajes tradicionales/i }));

    // tipoServicioId=1 has Masaje Thai only
    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.queryByText('Aceites de Jazmín')).not.toBeInTheDocument();
  });

  it('switching from Inactive back to Active shows real data again', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    // Go to Inactive (coming-soon)
    fireEvent.click(screen.getByRole('tab', { name: /^inactive/i }));
    expect(screen.getByText(/this view will be available soon/i)).toBeInTheDocument();

    // Return to Active
    fireEvent.click(screen.getByRole('tab', { name: /^active/i }));

    expect(screen.queryByText(/this view will be available soon/i)).not.toBeInTheDocument();
    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
  });
});

// ── Page header content ───────────────────────────────────────────────────────

describe('RitualesPage — page header', () => {
  it('renders the eyebrow text', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/service catalogue/i)).toBeInTheDocument();
  });

  it('renders the page title', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/massages &/i)).toBeInTheDocument();
  });

  it('renders the title accent', () => {
    setupMocks();
    render(<RitualesPage />, { wrapper: Wrapper });

    expect(screen.getByText(/services\./i)).toBeInTheDocument();
  });
});
