/**
 * AgendaPage.test.tsx
 *
 * Integration tests for the AgendaPage top-level component (post-CRUD enhancement).
 *
 * Mocking strategy:
 *   - useUserStore: mocked at module level using the selector pattern.
 *   - useDashboardCentroId: returns centroId=1 by default.
 *   - All admin + therapist data hooks are mocked to stable empty values so both
 *     views render deterministically (the page composes AdminAgendaView and
 *     TherapistAgendaView, which each pull in many data + mutation hooks).
 *   - Cita mutation hooks return an idle mutation; CitaModal is stubbed.
 *   - react-i18next: real translations from es/agenda.json.
 *   - ToastProvider wraps everything (AdminAgendaView uses useToast).
 *
 * AgendaPage is imported STATICALLY (after the mocks, which vitest hoists) so the
 * one-time module-graph evaluation happens at file load rather than inside a
 * per-test 5s timer — the role mock is read at render time, not import time.
 *
 * Role taxonomy (canonical TNombreRol = superadmin | recepcionista | masajista):
 *   deriveInitialView treats ONLY superadmin + recepcionista as admin; every
 *   other role (incl. the legacy 'propietario') falls back to the therapist view.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as TanstackRouter from '@tanstack/react-router';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import esAgenda from '@infra/i18n/locales/es/agenda.json';

// ── Module-level mocks ─────────────────────────────────────────────────────────

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('@infra/hooks/useDashboardCentroId', () => ({
  useDashboardCentroId: vi.fn(() => ({ centroId: 1, isLoading: false, isError: false })),
}));

vi.mock('@infra/hooks/useUsuarioCentros', () => ({
  useUsuarioCentros: vi.fn(() => ({
    centros: [{ id: 1, nombre: 'Centro Madrid', esPrincipal: true }],
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@infra/hooks/useAdminAgendaData', () => ({
  useAdminAgendaData: vi.fn(() => ({
    therapists: [],
    appointments: [],
    unassignedAppointments: [],
    kpis: [
      {
        id: 'reservas-hoy',
        label: 'Reservas · Hoy',
        value: 0,
        denominator: null,
        unit: 'citas',
        subtext: null,
        isAccent: false,
      },
    ],
    alerts: [],
    legendItems: [],
    adminCount: 0,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@infra/hooks/useAdminWeekData', () => ({
  useAdminWeekData: vi.fn(() => ({
    weekDays: [],
    therapists: [],
    colorMap: {},
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@infra/hooks/useAdminMonthData', () => ({
  useAdminMonthData: vi.fn(() => ({
    cells: [],
    footerKpis: { totalCitas: 0, monthLabel: '', ocupacionPct: null, peakDays: [] },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@infra/hooks/useCentrosActivos', () => ({
  useCentrosActivos: vi.fn(() => ({ data: [{ id: 1, nombre: 'Centro Madrid' }] })),
}));

vi.mock('@infra/hooks/useServiciosActivosCentro', () => ({
  useServiciosActivosCentro: vi.fn(() => ({ servicios: [], isLoading: false, isError: false })),
}));

const idleMutation = { mutate: vi.fn(), isPending: false };
vi.mock('@infra/hooks/useConfirmCita', () => ({ useConfirmCita: vi.fn(() => idleMutation) }));
vi.mock('@infra/hooks/useChangeCitaEstado', () => ({
  useChangeCitaEstado: vi.fn(() => idleMutation),
}));
vi.mock('@infra/hooks/useCancelCita', () => ({ useCancelCita: vi.fn(() => idleMutation) }));

vi.mock('@infra/hooks/useTherapistAgendaData', () => ({
  useTherapistAgendaData: vi.fn(() => ({
    appointments: [],
    stats: {
      citasTotal: 0,
      citasCompletadas: 0,
      horasEnSala: 0,
      propinas: 0,
      valoracionMedia: 0,
    },
    notes: null,
    reviews: [],
    sala: '—',
    therapistCount: 0,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@infra/hooks/useTherapistWeekData', () => ({
  useTherapistWeekData: vi.fn(() => ({
    weekDays: [],
    balance: {
      citasTotal: 0,
      citasCompletadas: 0,
      horasEnSala: 0,
      propinas: 0,
      valoracionMedia: 0,
      weekLabel: '',
    },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@infra/hooks/useCentroMasajistas', () => ({
  useCentroMasajistas: vi.fn(() => ({ masajistas: [], isLoading: false, isError: false })),
}));

vi.mock('@infra/components/ui/domain/modals', () => ({
  CitaModal: () => <div data-testid="cita-modal" />,
}));

// AdminAgendaView reads the clienteId search param and navigates (the cliente
// prefill flow). These tests render it without a <RouterProvider>, so the real
// useSearch/useNavigate throw ("Cannot read properties of null (reading 'stores')").
// Partial-mock the router: no clienteId param (the sync effect early-returns) and a
// stable no-op navigate. importActual preserves every other export untouched.
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>();
  const navigate = vi.fn();
  return {
    ...actual,
    useNavigate: () => navigate,
    useSearch: () => ({ clienteId: undefined }),
  };
});

import { useUserStore } from '@app/stores/useUserStore';
import { AgendaPage } from '@infra/pages/AgendaPage/AgendaPage';

// ── i18next test instance ──────────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: {
    es: { agenda: esAgenda },
  },
  interpolation: { escapeValue: false },
});

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={makeQueryClient()}>
    <I18nextProvider i18n={testI18n}>
      <StyledThemeProvider theme={lightTheme}>
        <ToastProvider>{children}</ToastProvider>
      </StyledThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

// Helper: set the user store to return a specific user
function mockUserWithRoles(roles: string[], nombre = 'Test User') {
  vi.mocked(useUserStore).mockImplementation((selector) =>
    selector({ user: { roles, nombre, id: 1 } } as unknown as Parameters<typeof selector>[0]),
  );
}

function mockNoUser() {
  vi.mocked(useUserStore).mockImplementation((selector) =>
    selector({ user: null } as unknown as Parameters<typeof selector>[0]),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Admin view rendering ───────────────────────────────────────────────────────

describe('AgendaPage — admin view (recepcionista role)', () => {
  beforeEach(() => {
    mockUserWithRoles(['recepcionista'], 'Ana García');
  });

  it('renders the admin view when user has "recepcionista" role', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // Admin view renders a filter bar with role="toolbar"
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('renders the KPI strip in admin view', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // useAdminAgendaData mock returns KPI with label 'Reservas · Hoy'
    expect(screen.getByText('Reservas · Hoy')).toBeInTheDocument();
  });

  it('renders page title "Agenda del estudio." for admin view', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    expect(screen.getByText('Agenda del estudio.')).toBeInTheDocument();
  });
});

describe('AgendaPage — admin view (superadmin role)', () => {
  beforeEach(() => {
    mockUserWithRoles(['superadmin'], 'Super Admin');
  });

  it('renders admin view when user has "superadmin" role', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });
});

// ── Therapist view rendering ───────────────────────────────────────────────────

describe('AgendaPage — therapist view (masajista role)', () => {
  beforeEach(() => {
    mockUserWithRoles(['masajista'], 'Som Ongkham');
  });

  it('renders therapist view when user has "masajista" role', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // TherapistHeroBanner renders "Buen día, Som." (greeting key + firstName from user.nombre)
    expect(screen.getByText('Buen día, Som.')).toBeInTheDocument();
  });

  it('renders therapist toolbar in therapist view', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // Therapist view has a date mode filter strip with role="toolbar"
    const toolbars = screen.getAllByRole('toolbar');
    expect(toolbars.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Non-admin role (legacy 'propietario') falls back to therapist view ──────────

describe('AgendaPage — propietario role (non-admin) → therapist view', () => {
  beforeEach(() => {
    mockUserWithRoles(['propietario'], 'Carlos Gómez');
  });

  it('falls back to the therapist view (only superadmin/recepcionista are admin)', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // deriveInitialView no longer treats 'propietario' as admin → therapist greeting
    expect(screen.getByText('Buen día, Carlos.')).toBeInTheDocument();
  });
});

// ── No user (null) falls back to therapist view ────────────────────────────────

describe('AgendaPage — null user', () => {
  beforeEach(() => {
    mockNoUser();
  });

  it('renders therapist view when user is null (no roles → therapist fallback)', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // With empty roles[], deriveInitialView returns 'therapist'
    // TherapistAgendaView renders — filter strip has role="toolbar"
    const toolbars = screen.getAllByRole('toolbar');
    expect(toolbars.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Role toggle ────────────────────────────────────────────────────────────────

describe('AgendaPage — role toggle rendered', () => {
  beforeEach(() => {
    mockUserWithRoles(['recepcionista'], 'Ana García');
  });

  it('renders the role toggle with both tabs', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('Terapeuta')).toBeInTheDocument();
  });

  it('admin + therapist tab badges show 0 (no real data in tests)', () => {
    render(<AgendaPage />, { wrapper: Wrapper });
    // Both toggle badges show 0 (adminCount / therapistCount mocked to 0)
    const allZeros = screen.getAllByText('0');
    expect(allZeros.length).toBeGreaterThanOrEqual(2);
  });

  it('the role toggle group is present in the DOM', () => {
    const { container } = render(<AgendaPage />, { wrapper: Wrapper });
    const toggle = container.querySelector('[role="group"]');
    expect(toggle).toBeInTheDocument();
  });
});

// ── View switching via toggle ──────────────────────────────────────────────────

describe('AgendaPage — view switching', () => {
  beforeEach(() => {
    mockUserWithRoles(['recepcionista'], 'Ana García');
  });

  it('switches to therapist view when the therapist tab is clicked', () => {
    render(<AgendaPage />, { wrapper: Wrapper });

    // Initially admin view
    expect(screen.getByText('Agenda del estudio.')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Terapeuta'));
    });

    // Now therapist view — hero banner rendered with greeting for Ana
    // (admin in therapist view with no therapist selected shows own name)
    expect(screen.getByText('Buen día, Ana.')).toBeInTheDocument();
  });

  it('switches back to admin view when admin tab is clicked after switching to therapist', () => {
    render(<AgendaPage />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByText('Terapeuta'));
    });
    expect(screen.getByText('Buen día, Ana.')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Administración'));
    });
    expect(screen.getByText('Agenda del estudio.')).toBeInTheDocument();
  });

  it('title changes to therapist variant when switching to therapist view', () => {
    render(<AgendaPage />, { wrapper: Wrapper });

    act(() => {
      fireEvent.click(screen.getByText('Terapeuta'));
    });

    // Title pattern for therapist: "Tu agenda, {firstName}."  (Ana García → Ana)
    expect(screen.getByText(/Tu agenda, Ana\./)).toBeInTheDocument();
  });
});

// ── Date eyebrow ───────────────────────────────────────────────────────────────

describe('AgendaPage — date eyebrow', () => {
  beforeEach(() => {
    mockUserWithRoles(['recepcionista'], 'Ana García');
  });

  it('renders the date eyebrow element with aria-hidden="true"', () => {
    const { container } = render(<AgendaPage />, { wrapper: Wrapper });
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenEls.length).toBeGreaterThan(0);
  });
});
