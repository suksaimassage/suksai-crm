/**
 * TerapeutasPage.test.tsx
 *
 * Tests for the TerapeutasPage component (Option B / Tabs refactor).
 * Strategy:
 *   - Data hooks (useTerapeutas, useTerapeutasFilter, useCentrosActivos,
 *     useActiveCentroStore) are mocked at module level.
 *   - The real Tabs component provides the page-level tab semantics under test.
 *   - WorkScheduleSection is stubbed (its own test file covers it) so the
 *     'horarios' tab is isolated from hook/QueryClient wiring.
 *   - TerapeutaModal is stubbed but reflects its mode/open props so we can assert
 *     the edit flow opens.
 *   - i18n uses the real es/terapeutas.json. fireEvent (no user-event dep).
 *   - No snapshot tests. No CSS assertions. Behaviour only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esTerapeutas from '@infra/i18n/locales/es/terapeutas.json';
import type { ITerapeutaAggregate } from '@infra/hooks/useTerapeutas';

// ── Module-level mocks ─────────────────────────────────────────────────────────

// Stubbed schedule section — its own suite covers behaviour. Marker lets us
// assert the 'horarios' tab actually mounted it.
vi.mock('@infra/pages/TerapeutasPage/components/WorkScheduleSection', () => ({
  WorkScheduleSection: ({ centroId }: { centroId: number | null }) => (
    <div data-testid="schedule-section">schedule:{String(centroId)}</div>
  ),
}));

// TerapeutaModal stub reflects open/mode so the edit flow is observable.
vi.mock('@infra/components/ui/domain/modals/TerapeutaModal', () => ({
  TerapeutaModal: ({ mode }: { mode: string }) => (
    <div data-testid="terapeuta-modal">modal:{mode}</div>
  ),
}));

vi.mock('@infra/hooks/useTerapeutas', () => ({
  useTerapeutas: vi.fn(),
}));

vi.mock('@infra/hooks/useTerapeutasFilter', () => ({
  useTerapeutasFilter: vi.fn(),
}));

vi.mock('@infra/hooks/useCentrosActivos', () => ({
  useCentrosActivos: vi.fn(),
}));

vi.mock('@app/stores/useActiveCentroStore', () => ({
  useActiveCentroStore: vi.fn(),
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { useTerapeutas } from '@infra/hooks/useTerapeutas';
import { useTerapeutasFilter } from '@infra/hooks/useTerapeutasFilter';
import { useCentrosActivos } from '@infra/hooks/useCentrosActivos';
import { useActiveCentroStore } from '@app/stores/useActiveCentroStore';
import { TerapeutasPage } from '@infra/pages/TerapeutasPage/TerapeutasPage';

// ── i18next test instance ──────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['terapeutas'],
  defaultNS: 'terapeutas',
  resources: { es: { terapeutas: esTerapeutas } },
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

// ── Aggregate fixture factory ──────────────────────────────────────────────────

let _uid = 1;

function makeAggregate(overrides: Partial<ITerapeutaAggregate> = {}): ITerapeutaAggregate {
  const id = _uid++;
  return {
    usuarioId: id,
    nombre: `Terapeuta ${id}`,
    apellidos: '',
    email: '',
    telefono: null,
    activo: true,
    createdAt: new Date('2023-01-01'),
    estadoActual: 'disponible',
    salaActual: null,
    proximaCita: null,
    proximaCitaSala: null,
    horariosSemanales: [],
    totalHorasSemana: 0,
    sesionesEstaSemana: 2,
    ingresosSemana: 120,
    valoracionMedia: null,
    especialidades: [],
    roles: ['masajista'],
    servicioMasRealizado: null,
    ...overrides,
  };
}

let agg1: ITerapeutaAggregate;
let agg2: ITerapeutaAggregate;

// ── Default mock return values ─────────────────────────────────────────────────

const defaultFilterState = {
  tab: 'todos' as const,
  search: '',
  especialidad: null,
  sort: 'nombre_asc' as const,
};

function setupMocks(
  overrides: {
    data?: readonly ITerapeutaAggregate[];
    isLoading?: boolean;
    isError?: boolean;
    filtered?: readonly ITerapeutaAggregate[];
    isDirty?: boolean;
    setTab?: () => void;
    setSearch?: () => void;
  } = {},
) {
  const data = overrides.data ?? [agg1, agg2];
  const filtered = overrides.filtered ?? data;

  vi.mocked(useCentrosActivos).mockReturnValue({
    data: [{ id: 10, nombre: 'Centro Test' }],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useCentrosActivos>);

  vi.mocked(useActiveCentroStore).mockReturnValue({
    centroId: 10,
    setCentroId: vi.fn(),
    clearCentroId: vi.fn(),
  });

  vi.mocked(useTerapeutas).mockReturnValue({
    data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    refetch: vi.fn(),
  });

  vi.mocked(useTerapeutasFilter).mockReturnValue({
    filtered,
    filterState: defaultFilterState,
    setTab: overrides.setTab ?? vi.fn(),
    setSearch: overrides.setSearch ?? vi.fn(),
    setEspecialidad: vi.fn(),
    setSort: vi.fn(),
    clearFilters: vi.fn(),
    isDirty: overrides.isDirty ?? false,
    counts: {
      todos: data.length,
      en_sala: data.filter((a) => a.estadoActual === 'en_sala').length,
      disponibles: data.filter((a) => a.estadoActual === 'disponible').length,
      descanso: data.filter((a) => a.estadoActual === 'descanso' || a.estadoActual === 'ausente')
        .length,
      inactivos: data.filter((a) => a.estadoActual === 'inactivo').length,
    },
    allEspecialidades: [],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  _uid = 1;
  agg1 = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
  agg2 = makeAggregate({ estadoActual: 'en_sala', nombre: 'Bruno Díaz' });
  setupMocks();
});

// ── Page header ────────────────────────────────────────────────────────────────

describe('TerapeutasPage — page header', () => {
  it('renders the page title from i18n', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terapeutas');
  });

  it('renders the add-therapist action button', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /Nuevo terapeuta/i })).toBeInTheDocument();
  });
});

// ── Page-level tabs (Directorio / Horarios) ──────────────────────────────────

describe('TerapeutasPage — page-level tabs', () => {
  it('renders a tablist with exactly two page tabs', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('renders the Directorio and Horarios tab labels', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: /Directorio/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Horarios/i })).toBeInTheDocument();
  });

  it('Directorio is the active tab on first paint', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    const directorio = screen.getByRole('tab', { name: /Directorio/i });
    expect(directorio).toHaveAttribute('aria-selected', 'true');
  });

  it('does NOT mount the schedule section while Directorio is active (destroyOnHide)', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.queryByTestId('schedule-section')).not.toBeInTheDocument();
  });

  it('mounts the schedule section and passes the active centroId when Horarios is selected', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('tab', { name: /Horarios/i }));

    const section = screen.getByTestId('schedule-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent('schedule:10');
    expect(screen.getByRole('tab', { name: /Horarios/i })).toHaveAttribute('aria-selected', 'true');
  });
});

// ── Status filters (NOT a tab layer) ─────────────────────────────────────────

describe('TerapeutasPage — status filters', () => {
  it('exposes the status filters as a group, not a second tablist', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    // Exactly ONE tablist (the page tabs). The status filters are a group.
    expect(screen.getAllByRole('tablist')).toHaveLength(1);
    expect(
      screen.getByRole('group', { name: esTerapeutas.toolbar.statusFilter }),
    ).toBeInTheDocument();
  });

  it('renders status filters as aria-pressed toggle buttons (not role=tab)', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    const group = screen.getByRole('group', { name: esTerapeutas.toolbar.statusFilter });
    const toggles = within(group).getAllByRole('button');
    expect(toggles).toHaveLength(5);
    // Active "Todos" filter is pressed; the rest are not.
    const todos = within(group).getByRole('button', { name: /Todos/i });
    expect(todos).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls setTab when a status filter is clicked', () => {
    const setTab = vi.fn();
    setupMocks({ setTab });
    render(<TerapeutasPage />, { wrapper: Wrapper });

    const group = screen.getByRole('group', { name: esTerapeutas.toolbar.statusFilter });
    fireEvent.click(within(group).getByRole('button', { name: /En sala/i }));
    expect(setTab).toHaveBeenCalledWith('en_sala');
  });
});

// ── Loading skeleton ───────────────────────────────────────────────────────────

describe('TerapeutasPage — loading state', () => {
  it('renders skeleton grid (aria-busy) when isLoading=true', () => {
    setupMocks({ isLoading: true, data: [], filtered: [] });
    render(<TerapeutasPage />, { wrapper: Wrapper });

    const grid = screen.getByRole('list', { hidden: true });
    expect(grid).toHaveAttribute('aria-busy', 'true');
  });

  it('skeleton grid aria-label uses the i18n loading key', () => {
    setupMocks({ isLoading: true, data: [], filtered: [] });
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.queryByLabelText(esTerapeutas.page.loading)).toBeInTheDocument();
  });
});

// ── Error state ────────────────────────────────────────────────────────────────

describe('TerapeutasPage — error state', () => {
  it('renders error state when isError=true', () => {
    setupMocks({ isError: true, data: [], filtered: [] });
    render(<TerapeutasPage />, { wrapper: Wrapper });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(esTerapeutas.error.title)).toBeInTheDocument();
  });

  it('renders retry button in error state', () => {
    setupMocks({ isError: true, data: [], filtered: [] });
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', () => {
    const refetchMock = vi.fn();
    setupMocks({ isError: true, data: [], filtered: [] });
    vi.mocked(useTerapeutas).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    });

    render(<TerapeutasPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(refetchMock).toHaveBeenCalledOnce();
  });
});

// ── Empty state ────────────────────────────────────────────────────────────────

describe('TerapeutasPage — empty state', () => {
  it('renders empty state when no data and not loading/error', () => {
    setupMocks({ data: [], filtered: [] });
    render(<TerapeutasPage />, { wrapper: Wrapper });

    expect(screen.getByText(esTerapeutas.empty.title)).toBeInTheDocument();
    expect(screen.getByText(esTerapeutas.empty.description)).toBeInTheDocument();
  });

  it('renders filtered-empty state when isDirty=true and no results', () => {
    setupMocks({ data: [agg1, agg2], filtered: [], isDirty: true });
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByText(esTerapeutas.empty_filtered.title)).toBeInTheDocument();
  });
});

// ── Card grid ──────────────────────────────────────────────────────────────────

describe('TerapeutasPage — card grid', () => {
  it('exposes the card grid as a list of listitems', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    const list = screen.getByRole('list', { name: esTerapeutas.page.title });
    expect(list).toBeInTheDocument();
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
  });

  it('renders one card article per aggregate', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders therapist names in cards', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Bruno Díaz')).toBeInTheDocument();
  });
});

// ── Card actions → page wiring ────────────────────────────────────────────────

describe('TerapeutasPage — card actions wiring', () => {
  it('switches to the Horarios tab when a card "Horario de trabajo" entry is selected', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });

    // Open the first card's actions menu.
    const triggers = screen.getAllByRole('button', { name: /Acciones de/i });
    fireEvent.click(triggers[0]);

    // Select "Horario de trabajo".
    fireEvent.click(screen.getByRole('menuitem', { name: esTerapeutas.card.menu.horario }));

    // The page must now show the schedule tab content.
    expect(screen.getByTestId('schedule-section')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Horarios/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens the edit modal when a card "Editar" entry is selected', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.queryByTestId('terapeuta-modal')).not.toBeInTheDocument();

    const triggers = screen.getAllByRole('button', { name: /Acciones de/i });
    fireEvent.click(triggers[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: esTerapeutas.card.menu.editar }));

    const modal = screen.getByTestId('terapeuta-modal');
    expect(modal).toHaveTextContent('modal:edit');
  });
});

// ── Create modal ────────────────────────────────────────────────────────────

describe('TerapeutasPage — create modal', () => {
  it('opens the create modal when the header add button is clicked', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.queryByTestId('terapeuta-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Nuevo terapeuta/i }));
    expect(screen.getByTestId('terapeuta-modal')).toHaveTextContent('modal:create');
  });
});

// ── Search toolbar ─────────────────────────────────────────────────────────────

describe('TerapeutasPage — search toolbar', () => {
  it('renders the search input', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(
      screen.getByRole('searchbox', { name: esTerapeutas.toolbar.search_placeholder }),
    ).toBeInTheDocument();
  });

  it('calls setSearch on input change', () => {
    const setSearch = vi.fn();
    setupMocks({ setSearch });
    render(<TerapeutasPage />, { wrapper: Wrapper });

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ana' } });
    expect(setSearch).toHaveBeenCalled();
  });
});

// ── KPI strip ──────────────────────────────────────────────────────────────────

describe('TerapeutasPage — KPI strip', () => {
  it('renders the KPI region', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    expect(screen.getByRole('region', { name: esTerapeutas.page.eyebrow })).toBeInTheDocument();
  });

  it('shows the total active therapists KPI label', () => {
    render(<TerapeutasPage />, { wrapper: Wrapper });
    const region = screen.getByRole('region', { name: esTerapeutas.page.eyebrow });
    expect(within(region).getByText(esTerapeutas.kpi.equipo_activo)).toBeInTheDocument();
  });
});
