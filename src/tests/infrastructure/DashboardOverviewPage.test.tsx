/**
 * DashboardOverviewPage.test.tsx
 *
 * Test strategy:
 *   - All 5 React Query hooks are mocked at module level via vi.mock().
 *   - useUserStore is mocked at the module level with selector-pattern support.
 *   - The wrapper provides only i18n + styled-components theme — no QueryClientProvider
 *     is needed because every hook is mocked to return synchronously.
 *   - No snapshot tests (project policy).
 *   - No CSS / styled-components assertions.
 *   - No waitFor / act — all mocks return synchronously.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

// ── Theme ──────────────────────────────────────────────────────────────────────
import { lightTheme } from '@infra/styles/themes/light.theme';

// ── i18n translations ──────────────────────────────────────────────────────────
import esDashboard from '@infra/i18n/locales/es/dashboard.json';

// ── Module-level mocks ─────────────────────────────────────────────────────────
// All 5 dashboard hooks must be mocked before the page module is imported.

vi.mock('@infra/hooks/useDashboardCentroId', () => ({
  useDashboardCentroId: vi.fn(),
}));

vi.mock('@infra/hooks/useDashboardKPIs', () => ({
  useDashboardKPIs: vi.fn(),
}));

vi.mock('@infra/hooks/useDashboardTopClientes', () => ({
  useDashboardTopClientes: vi.fn(),
}));

vi.mock('@infra/hooks/useDashboardCitasHoy', () => ({
  useDashboardCitasHoy: vi.fn(),
}));

vi.mock('@infra/hooks/useDashboardCalendarVolume', () => ({
  useDashboardCalendarVolume: vi.fn(),
}));

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

// ── Import mocked modules so vi.mocked() can configure them per-test ──────────

import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useDashboardKPIs } from '@infra/hooks/useDashboardKPIs';
import { useDashboardTopClientes } from '@infra/hooks/useDashboardTopClientes';
import { useDashboardCitasHoy } from '@infra/hooks/useDashboardCitasHoy';
import { useDashboardCalendarVolume } from '@infra/hooks/useDashboardCalendarVolume';
import { useUserStore } from '@app/stores/useUserStore';
import { DashboardOverviewPage } from '@infra/pages/DashboardOverviewPage/DashboardOverviewPage';

// ── i18next test instance ──────────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['dashboard', 'common'],
  defaultNS: 'dashboard',
  resources: {
    es: { dashboard: esDashboard, common: {} },
  },
  interpolation: { escapeValue: false },
});

// ── Wrapper ───────────────────────────────────────────────────────────────────

interface IWrapperProps {
  readonly children: ReactNode;
}

const Wrapper = ({ children }: IWrapperProps) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── User fixtures ──────────────────────────────────────────────────────────────
// roles MUST be valid TNombreRol values: 'superadmin' | 'masajista' | 'recepcionista'.
// The two role gates in DashboardOverviewPage produce three distinct behavior tiers:
//   superadmin    → canSeeRevenue = true,  canSeeAllTherapists (LTV) = true   → 4 KPI cards, LTV shown
//   recepcionista → canSeeRevenue = false, canSeeAllTherapists (LTV) = true   → 3 KPI cards, LTV shown
//   masajista     → canSeeRevenue = false, canSeeAllTherapists (LTV) = false  → 3 KPI cards, LTV hidden

const masajistaUser = {
  id: 1,
  nombre: 'Naree Sombut',
  apellidos: '',
  email: 'naree@test.com',
  roles: ['masajista' as const],
  isActive: true,
  centroPrincipalNombre: null,
};

const recepcionistaUser = {
  id: 2,
  nombre: 'Suda Boonsri',
  apellidos: '',
  email: 'suda@test.com',
  roles: ['recepcionista' as const],
  isActive: true,
  centroPrincipalNombre: null,
};

const superadminUser = {
  id: 3,
  nombre: 'Dara Phothiwan',
  apellidos: '',
  email: 'dara@test.com',
  roles: ['superadmin' as const],
  isActive: true,
  centroPrincipalNombre: null,
};

// ── Hook mock defaults ─────────────────────────────────────────────────────────

const MOCK_CLIENTS = [
  {
    id: 1,
    nombre: 'Laleh',
    apellidos: 'Ahmadi',
    tags: ['vip', 'bono_activo'] as const,
    ltv: 4_800,
    lastAppointment: '2026-05-15T11:00:00',
    lastAppointmentServicio: 'Thai Massage 60 min',
    lastAppointmentSala: 'Sala Zen',
    numeroVisitas: 12,
  },
  {
    id: 2,
    nombre: 'Marcus',
    apellidos: 'Lindqvist',
    tags: ['frecuente'] as const,
    ltv: 2_100,
    lastAppointment: '2026-05-16T14:30:00',
    lastAppointmentServicio: 'Reflexología podal',
    lastAppointmentSala: 'Sala Lotus',
    numeroVisitas: 6,
  },
  {
    id: 3,
    nombre: 'Yuki',
    apellidos: 'Tanaka',
    tags: ['nuevo'] as const,
    ltv: 90,
    lastAppointment: null,
    lastAppointmentServicio: null,
    lastAppointmentSala: null,
    numeroVisitas: 1,
  },
] as const;

const MOCK_APPOINTMENTS = [
  {
    id: 101,
    fechaHoraInicio: '2026-05-16T09:00:00',
    clienteNombre: 'Laleh Ahmadi',
    servicioNombre: 'Thai Massage 60 min',
    terapeutaNombre: 'Naree A.',
    salaNombre: 'Sala Zen',
    duracionMinutos: '60 min',
    estado: 'confirmada' as const,
  },
  {
    id: 102,
    fechaHoraInicio: '2026-05-16T10:00:00',
    clienteNombre: 'Marcus Lindqvist',
    servicioNombre: 'Reflexología podal',
    terapeutaNombre: 'Suda B.',
    salaNombre: 'Sala Lotus',
    duracionMinutos: '30 min',
    estado: 'pendiente' as const,
  },
] as const;

// ── Helper: configure useUserStore mock ───────────────────────────────────────

type TTestUser = typeof masajistaUser | typeof recepcionistaUser | typeof superadminUser | null;

function setupUserStore(user: TTestUser): void {
  vi.mocked(useUserStore).mockImplementation((selector) =>
    selector({
      user,
      setUser: vi.fn(),
      clearUser: vi.fn(),
      status: 'authenticated',
    } as unknown as Parameters<typeof selector>[0]),
  );
}

// ── Helper: set all hooks to the default happy-path baseline ─────────────────

function setupDefaultHooks(): void {
  vi.mocked(useDashboardCentroId).mockReturnValue({
    centroId: 1,
    isLoading: false,
    isError: false,
  });

  vi.mocked(useDashboardKPIs).mockReturnValue({
    reservasHoy: { value: 8, sparklineData: [], isLoading: false, isError: false },
    ingresosSemana: { value: 132_000, sparklineData: [], isLoading: false, isError: false },
    ocupacionSemana: { value: 74, sparklineData: [], isLoading: false, isError: false },
    reservasCompletadasMes: { value: 0, sparklineData: [], isLoading: false, isError: false },
  });

  vi.mocked(useDashboardTopClientes).mockReturnValue({
    data: [...MOCK_CLIENTS],
    isLoading: false,
    isError: false,
  });

  vi.mocked(useDashboardCitasHoy).mockReturnValue({
    data: [...MOCK_APPOINTMENTS],
    isLoading: false,
    isError: false,
  });

  vi.mocked(useDashboardCalendarVolume).mockReturnValue({
    data: [{ day: '2026-05-13', hour: 9, value: 3 }],
    isLoading: false,
    isError: false,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. WelcomeBanner
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — WelcomeBanner', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders greeting with the first name of the logged-in user', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // nombre = 'Naree Sombut', firstName = 'Naree'
    // i18n key: overview.greetingWord = "Bienvenida,"
    const greeting = screen.getByText(/bienvenida,/i);
    expect(greeting).toBeInTheDocument();
    expect(greeting.closest('[id="banner-greeting"]')).toBeInTheDocument();
  });

  it('renders the user first name inside the greeting element', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const greetingEl = document.getElementById('banner-greeting');
    expect(greetingEl).not.toBeNull();
    expect(greetingEl?.textContent).toMatch(/naree/i);
  });

  it('renders the i18n tagline text', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // overview.tagline = "Que tu centro fluya con calma."
    expect(screen.getByText(/que tu centro fluya con calma/i)).toBeInTheDocument();
  });

  it('banner container has aria-labelledby="banner-greeting"', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const banner = container.querySelector('[aria-labelledby="banner-greeting"]');
    expect(banner).not.toBeNull();
  });

  it('greeting element has id="banner-greeting"', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const heading = container.querySelector('#banner-greeting');
    expect(heading).not.toBeNull();
  });

  it('renders the current year somewhere within the banner area', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const banner = container.querySelector('[aria-labelledby="banner-greeting"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toMatch(/20\d{2}/);
  });

  it('decorative SVG ornament is aria-hidden', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const hiddenSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. KPIGrid — role gates
// NOTE: canSeeRevenue = roles.includes('superadmin') — superadmin ONLY.
//       masajista / recepcionista do NOT have canSeeRevenue → 3 KPI cards (revenue excluded).
//       superadmin HAS canSeeRevenue → 4 KPI cards.
//       The 4th card is reservasCompletadasMes ("Citas completadas (mes)"); the former
//       "Satisfacción NPS" card was removed in the KPI-contract migration.
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — KPIGrid (masajista role, 3 cards)', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI title "Reservas hoy" (masajista role)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // KPICard renders KPITitle with the translated title text
    expect(screen.getByText('Reservas hoy')).toBeInTheDocument();
  });

  it('renders KPI title "Ocupación semana" (masajista role)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getByText('Ocupación semana')).toBeInTheDocument();
  });

  it('renders KPI title "Citas completadas (mes)" (masajista role)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // 4th KPI card title: dashboard:kpi.reservasCompletadasMes = "Citas completadas (mes)"
    expect(screen.getByText('Citas completadas (mes)')).toBeInTheDocument();
  });

  it('does NOT render "Ingresos semana" KPI for masajista role (revenue gate)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // masajista role does not include superadmin → canSeeRevenue = false
    expect(screen.queryByText('Ingresos semana')).toBeNull();
  });

  it('reservasCompletadasMes card renders its value (0)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // reservasCompletadasMes.value = 0 → KPICard accessible name = "Citas completadas (mes): 0"
    expect(screen.getByLabelText('Citas completadas (mes): 0')).toBeInTheDocument();
  });
});

describe('DashboardOverviewPage — KPIGrid (recepcionista role, 3 cards)', () => {
  beforeEach(() => {
    setupUserStore(recepcionistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders 3 KPI titles and hides revenue for recepcionista role', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getByText('Reservas hoy')).toBeInTheDocument();
    expect(screen.getByText('Ocupación semana')).toBeInTheDocument();
    expect(screen.getByText('Citas completadas (mes)')).toBeInTheDocument();
    expect(screen.queryByText('Ingresos semana')).toBeNull();
  });
});

describe('DashboardOverviewPage — KPIGrid (superadmin role, 4 cards)', () => {
  beforeEach(() => {
    setupUserStore(superadminUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 4 KPI titles including revenue for superadmin role', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getByText('Reservas hoy')).toBeInTheDocument();
    expect(screen.getByText('Ingresos semana')).toBeInTheDocument();
    expect(screen.getByText('Ocupación semana')).toBeInTheDocument();
    expect(screen.getByText('Citas completadas (mes)')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. ClientPanel — happy path
// NOTE: canSeeAllTherapists = roles.includes('superadmin') || roles.includes('recepcionista').
//       superadmin / recepcionista pass → showLtv=true.
//       masajista does NOT pass → showLtv=false.
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — ClientPanel (superadmin — showLtv=true)', () => {
  beforeEach(() => {
    setupUserStore(superadminUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 3 client full names', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Names appear inside ClientRow Typography elements
    expect(screen.getAllByText('Laleh Ahmadi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Marcus Lindqvist').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Yuki Tanaka').length).toBeGreaterThanOrEqual(1);
  });

  it('shows LTV values when user has superadmin role (canSeeAllTherapists=true)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Each ClientRow with showLtv=true renders Typography aria-label={t('clients.ltv')}
    // dashboard:clients.ltv = "Valor total"
    const ltvEls = screen.getAllByLabelText(/valor total/i);
    expect(ltvEls.length).toBeGreaterThan(0);
  });

  it('renders "Ver todos" button in the client panel', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /ver todos/i })).toBeInTheDocument();
  });

  it('client panel container has aria-labelledby="client-panel-heading"', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const panel = container.querySelector('[aria-labelledby="client-panel-heading"]');
    expect(panel).not.toBeNull();
  });

  it('client panel heading contains section title text', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const heading = container.querySelector('#client-panel-heading');
    expect(heading).not.toBeNull();
    // dashboard:clients.sectionTitle = "Clientes relevantes"
    expect(heading?.textContent).toMatch(/clientes relevantes/i);
  });
});

describe('DashboardOverviewPage — ClientPanel (masajista role — showLtv=false)', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT show LTV values when user has masajista role (canSeeAllTherapists=false)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const ltvEls = screen.queryAllByLabelText(/valor total/i);
    expect(ltvEls).toHaveLength(0);
  });
});

describe('DashboardOverviewPage — ClientPanel (recepcionista — showLtv=true)', () => {
  beforeEach(() => {
    setupUserStore(recepcionistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows LTV values when user has recepcionista role (canSeeAllTherapists=true)', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // recepcionista passes canSeeAllTherapists → showLtv=true for all client rows
    const ltvEls = screen.getAllByLabelText(/valor total/i);
    expect(ltvEls.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. ClientPanel — loading state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — ClientPanel loading state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardTopClientes).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPICard skeleton elements (aria-busy=true) while loading', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // KPICard with isLoading=true renders aria-busy="true" on its wrapper
    const skeletons = container.querySelectorAll('[aria-busy="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render client-panel-only names while loading', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // 'Yuki Tanaka' only exists in MOCK_CLIENTS — not in MOCK_APPOINTMENTS —
    // so absence confirms the client panel is not rendering rows during load.
    // 'Laleh Ahmadi' and 'Marcus Lindqvist' also appear in the appointment panel
    // (which is still loaded), so they cannot be used as sentinel values here.
    expect(screen.queryByText('Yuki Tanaka')).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ClientPanel — empty state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — ClientPanel empty state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardTopClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Empty component with no-data preset when client list is empty', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Empty preset="no-data" renders role="status"
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('shows "Sin clientes destacados" title from i18n key clients.emptyTitle', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:clients.emptyTitle = "Sin clientes destacados"
    expect(screen.getByText(/sin clientes destacados/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. ClientPanel — error state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — ClientPanel error state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardTopClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Empty component with error preset when hook returns isError=true', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Empty preset="error" renders role="alert"
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('shows "Error al cargar clientes" title from i18n key clients.errorTitle', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:clients.errorTitle = "Error al cargar clientes"
    expect(screen.getByText(/error al cargar clientes/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. AppointmentPanel — happy path
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — AppointmentPanel happy path', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders 2 appointment client names', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getAllByText('Laleh Ahmadi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Marcus Lindqvist').length).toBeGreaterThanOrEqual(1);
  });

  it('renders service names for each appointment', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // 'Thai Massage 60 min' also appears in the ClientPanel via lastAppointmentServicio
    // (MOCK_CLIENTS[0].lastAppointmentServicio). Use getAllByText to handle both occurrences.
    expect(screen.getAllByText('Thai Massage 60 min').length).toBeGreaterThanOrEqual(1);
    // 'Reflexología podal' appears in ClientPanel (MOCK_CLIENTS[1].lastAppointmentServicio)
    // and in AppointmentPanel for the second appointment.
    expect(screen.getAllByText('Reflexología podal').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Confirmada" status badge for the confirmada appointment', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Badge renders with aria-label matching the translated status
    // dashboard:appointments.status.confirmada = "Confirmada"
    expect(screen.getByLabelText('Confirmada')).toBeInTheDocument();
  });

  it('renders "Pendiente" status badge for the pendiente appointment', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:appointments.status.pendiente = "Pendiente"
    expect(screen.getByLabelText('Pendiente')).toBeInTheDocument();
  });

  it('renders "Ver agenda" button in the appointment panel', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:appointments.viewAgenda = "Ver agenda"
    expect(screen.getByRole('button', { name: /ver agenda/i })).toBeInTheDocument();
  });

  it('appointment panel container has aria-labelledby="appointment-panel-heading"', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const panel = container.querySelector('[aria-labelledby="appointment-panel-heading"]');
    expect(panel).not.toBeNull();
  });

  it('appointment panel heading element has id="appointment-panel-heading"', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const heading = container.querySelector('#appointment-panel-heading');
    expect(heading).not.toBeNull();
    // dashboard:appointments.sectionTitle = "Próximas citas"
    expect(heading?.textContent).toMatch(/próximas citas/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. AppointmentPanel — loading state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — AppointmentPanel loading state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardCitasHoy).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPICard skeleton elements while loading appointments', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const skeletons = container.querySelectorAll('[aria-busy="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render appointment service names while loading', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // NOTE: service names like 'Thai Massage 60 min' also appear in the ClientPanel
    // (via lastAppointmentServicio on client rows), so they cannot be used to assert
    // appointment-panel absence. Instead, assert that the combined
    // "terapeutaNombre · salaNombre" text — which is unique to AppointmentRow —
    // is not rendered (AppointmentRow is replaced by KPI skeletons while loading).
    expect(screen.queryByText(/Naree A\. · Sala Zen/)).toBeNull();
    expect(screen.queryByText(/Suda B\. · Sala Lotus/)).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. AppointmentPanel — empty state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — AppointmentPanel empty state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardCitasHoy).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Empty component with no-data preset when appointment list is empty', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('shows "Sin citas hoy" from i18n key appointments.emptyTitle', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:appointments.emptyTitle = "Sin citas hoy"
    expect(screen.getByText(/sin citas hoy/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. AppointmentPanel — error state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — AppointmentPanel error state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardCitasHoy).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Empty component with error preset when appointment hook returns isError=true', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('shows "Error al cargar citas" from i18n key appointments.errorTitle', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:appointments.errorTitle = "Error al cargar citas"
    expect(screen.getByText(/error al cargar citas/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. CalendarVolumePanel — happy path
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — CalendarVolumePanel happy path', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heatmap section heading "Densidad de citas"', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:calendarVolume.sectionTitle = "Densidad de citas"
    expect(screen.getByText(/densidad de citas/i)).toBeInTheDocument();
  });

  it('does not render an error state when data is available', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.queryByText(/error al cargar la densidad/i)).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. CalendarVolumePanel — error state
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — CalendarVolumePanel error state', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
    vi.mocked(useDashboardCalendarVolume).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Empty with error preset when calendar volume hook returns isError=true', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('shows "Error al cargar la densidad" from i18n key calendarVolume.errorTitle', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // dashboard:calendarVolume.errorTitle = "Error al cargar la densidad"
    expect(screen.getByText(/error al cargar la densidad/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. Accessibility
// ══════════════════════════════════════════════════════════════════════════════

describe('DashboardOverviewPage — Accessibility', () => {
  beforeEach(() => {
    setupUserStore(masajistaUser);
    setupDefaultHooks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('banner aria-labelledby="banner-greeting" resolves to an existing element', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const banner = container.querySelector('[aria-labelledby="banner-greeting"]');
    const heading = container.querySelector('#banner-greeting');
    expect(banner).not.toBeNull();
    expect(heading).not.toBeNull();
  });

  it('client panel aria-labelledby="client-panel-heading" resolves to heading with sectionTitle text', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const panel = container.querySelector('[aria-labelledby="client-panel-heading"]');
    const heading = container.querySelector('#client-panel-heading');
    expect(panel).not.toBeNull();
    expect(heading).not.toBeNull();
    // dashboard:clients.sectionTitle = "Clientes relevantes"
    expect(heading?.textContent).toMatch(/clientes relevantes/i);
  });

  it('appointment panel aria-labelledby="appointment-panel-heading" resolves to heading with sectionTitle text', () => {
    const { container } = render(<DashboardOverviewPage />, { wrapper: Wrapper });
    const panel = container.querySelector('[aria-labelledby="appointment-panel-heading"]');
    const heading = container.querySelector('#appointment-panel-heading');
    expect(panel).not.toBeNull();
    expect(heading).not.toBeNull();
    // dashboard:appointments.sectionTitle = "Próximas citas"
    expect(heading?.textContent).toMatch(/próximas citas/i);
  });

  it('appointment status badges have aria-label attributes', () => {
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Both badges in the mock data should be labelled
    expect(screen.getByLabelText('Confirmada')).toBeInTheDocument();
    expect(screen.getByLabelText('Pendiente')).toBeInTheDocument();
  });

  it('LTV Typography elements have aria-label linking them to their label text', () => {
    setupUserStore(superadminUser);
    render(<DashboardOverviewPage />, { wrapper: Wrapper });
    // Superadmin passes canSeeAllTherapists → showLtv=true for all 3 clients
    const ltvEls = screen.getAllByLabelText(/valor total/i);
    expect(ltvEls.length).toBe(3);
  });
});
