/**
 * AdminAgendaView.test.tsx
 *
 * View-level integration of the admin agenda. Focused on the two contracts that
 * are hard to verify at the leaf level:
 *   - centroId === null → explicit "Sin centro asignado" empty state (not a blank
 *     grid), with the filter bar disabled (no chips, no Nueva-cita action);
 *   - canManageCitas gating: a masajista (read-only) gets NO Nueva-cita button
 *     and NO rail write controls, while a superadmin/recepcionista does.
 *
 * Mock strategy: the heavy data + mutation hooks are mocked to stable values so
 * the view renders deterministically; useUserStore and useDashboardCentroId are
 * mocked to drive roles + centroId. The CitaModal is stubbed (it has its own
 * test and pulls in many pickers). Real sub-components otherwise.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { TNombreRol } from '@domain/types';
import type {
  IAgendaWeekDay,
  IAgendaAppointment,
  IAgendaMonthCell,
} from '@domain/models/agenda.models';

// ── Mocks ────────────────────────────────────────────────────────────────────────
interface IMockCentro {
  readonly id: number;
  readonly nombre: string;
}
let mockRoles: TNombreRol[] = ['superadmin'];
let mockCentroId: number | null = 1;
let mockCentrosActivos: IMockCentro[] = [{ id: 1, nombre: 'Centro Madrid' }];

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown): unknown =>
    selector({
      user: {
        id: 1,
        nombre: 'Admin User',
        apellidos: '',
        email: 'a@b.c',
        roles: mockRoles,
        isActive: true,
        centroPrincipalNombre: null,
      },
    }),
}));
vi.mock('@infra/hooks/useDashboardCentroId', () => ({
  useDashboardCentroId: (): { centroId: number | null } => ({ centroId: mockCentroId }),
}));
// AdminAgendaView reads the `clienteId` search param + navigates (deep-link to
// open the create modal). Outside a RouterProvider those hooks throw, so stub the
// two it uses.
vi.mock('@tanstack/react-router', () => ({
  useSearch: (): { clienteId?: number } => ({}),
  useNavigate: (): (() => Promise<void>) => () => Promise.resolve(),
}));

const emptyAdmin = {
  therapists: [],
  appointments: [],
  unassignedAppointments: [],
  kpis: [],
  alerts: [],
  legendItems: [],
  adminCount: 0,
  isLoading: false,
  isError: false,
};
// Spies (not plain functions) so date-preservation / list-mode-week-fetch tests
// can inspect the exact (centroId, activeDate) / (centroId, weekStart, enabled)
// arguments AdminAgendaView passed on each render — the ground truth for
// "did switching view modes silently rewrite activeDate" without reaching into
// component internals.
const mockUseAdminAgendaDataFn = vi.fn((..._args: unknown[]) => emptyAdmin);
vi.mock('@infra/hooks/useAdminAgendaData', () => ({
  useAdminAgendaData: (...a: unknown[]): typeof emptyAdmin => mockUseAdminAgendaDataFn(...a),
}));
let mockWeekDaysReturn: unknown[] = [];
const mockUseAdminWeekDataFn = vi.fn((..._args: unknown[]) => ({
  weekDays: mockWeekDaysReturn,
  therapists: [],
  colorMap: {},
  isLoading: false,
  isError: false,
}));
vi.mock('@infra/hooks/useAdminWeekData', () => ({
  useAdminWeekData: (...a: unknown[]): unknown => mockUseAdminWeekDataFn(...a),
}));
let mockCellsReturn: unknown[] = [];
vi.mock('@infra/hooks/useAdminMonthData', () => ({
  useAdminMonthData: (): unknown => ({
    cells: mockCellsReturn,
    footerKpis: { totalCitas: 0, monthLabel: '', ocupacionPct: null, peakDays: [] },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@infra/hooks/useCentrosActivos', () => ({
  useCentrosActivos: (): { data: IMockCentro[] } => ({ data: mockCentrosActivos }),
}));
let mockServicios: { nombre: string }[] = [];
vi.mock('@infra/hooks/useServiciosActivosCentro', () => ({
  useServiciosActivosCentro: (): unknown => ({
    servicios: mockServicios,
    isLoading: false,
    isError: false,
  }),
}));
const idleMutation = { mutate: vi.fn(), isPending: false };
vi.mock('@infra/hooks/useConfirmCita', () => ({ useConfirmCita: (): unknown => idleMutation }));
vi.mock('@infra/hooks/useChangeCitaEstado', () => ({
  useChangeCitaEstado: (): unknown => idleMutation,
}));
vi.mock('@infra/hooks/useCancelCita', () => ({ useCancelCita: (): unknown => idleMutation }));
vi.mock('@infra/hooks/useRescheduleCita', () => ({
  useRescheduleCita: (): unknown => idleMutation,
}));
// The create/edit surface is now the AgendaCalendarOverlay (own test file); stub
// it so these view-level asserts stay focused on gating + null-centre, not the
// overlay's data pickers. Exposes the resolved mode + centroId so the two
// contracts below (mode mapping, non-null centroId) can still be inspected.
vi.mock('@infra/pages/AgendaPage/components/admin/AgendaCalendarOverlay', () => ({
  AgendaCalendarOverlay: (props: { mode: string; centroId: number }) => (
    <div
      data-testid="agenda-calendar-overlay"
      data-mode={props.mode}
      data-centroid={String(props.centroId)}
    />
  ),
}));

import { AdminAgendaView } from '@infra/pages/AgendaPage/views/AdminAgendaView';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>
      <ToastProvider>{children}</ToastProvider>
    </StyledThemeProvider>
  </I18nextProvider>
);

beforeEach(() => {
  mockRoles = ['superadmin'];
  mockCentroId = 1;
  mockCentrosActivos = [{ id: 1, nombre: 'Centro Madrid' }];
  mockServicios = [];
  mockWeekDaysReturn = [];
  mockCellsReturn = [];
  vi.clearAllMocks();
});

// ── null centro ──────────────────────────────────────────────────────────────────

describe('AdminAgendaView — centroId === null', () => {
  it('renders the explicit "Sin centro asignado" configuration empty state', () => {
    mockCentroId = null;
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.getByText('Sin centro asignado')).toBeInTheDocument();
    expect(screen.getByText(/Tu usuario no está asignado a ningún centro/)).toBeInTheDocument();
  });

  it('disables the filter bar (no filter chips rendered) when there is no centre', () => {
    mockCentroId = null;
    render(<AdminAgendaView />, { wrapper: Wrapper });
    // The chip group renders no chips when disabled → no aria-pressed filter buttons.
    expect(screen.queryByRole('button', { name: /Centro · /i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Estado · /i })).not.toBeInTheDocument();
  });

  it('does not render the calendar grid when there is no centre', () => {
    mockCentroId = null;
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.queryByLabelText('Calendario de agenda')).not.toBeInTheDocument();
  });
});

// ── canManageCitas gating ───────────────────────────────────────────────────────

describe('AdminAgendaView — canManageCitas gating', () => {
  it('superadmin sees the Nueva-cita action', () => {
    mockRoles = ['superadmin'];
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Nueva cita' })).toBeInTheDocument();
  });

  it('recepcionista also sees the Nueva-cita action', () => {
    mockRoles = ['recepcionista'];
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Nueva cita' })).toBeInTheDocument();
  });

  it('masajista (read-only) does NOT see the Nueva-cita action', () => {
    mockRoles = ['masajista'];
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: 'Nueva cita' })).not.toBeInTheDocument();
  });
});

// ── Overlay wiring (Nueva cita → AgendaCalendarOverlay) ──────────────────────────

describe('AdminAgendaView — create opens the calendar overlay', () => {
  it('does not mount the overlay until Nueva-cita is clicked', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.queryByTestId('agenda-calendar-overlay')).not.toBeInTheDocument();
  });

  it('clicking Nueva cita mounts the overlay in create mode with the resolved centroId', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Nueva cita' }));
    const overlay = screen.getByTestId('agenda-calendar-overlay');
    expect(overlay).toHaveAttribute('data-mode', 'create');
    expect(overlay).toHaveAttribute('data-centroid', '1');
  });
});

// ── Filter chips present when centre resolved ───────────────────────────────────

describe('AdminAgendaView — filter bar (centre resolved)', () => {
  it('renders the four filter chips with their value summaries', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /Centro · /i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Terapeutas · /i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Servicio · /i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estado · /i })).toBeInTheDocument();
  });

  it('renders the day calendar grid by default', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Calendario de agenda')).toBeInTheDocument();
  });
});

// ── Fixtures for the date-preservation / list / day-nav tests below ────────────

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Cliente Semana',
  visitInfo: null,
  serviceName: 'Masaje',
  sala: 'Sala 1',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 60,
  ...overrides,
});

const makeWeekDay = (overrides: Partial<IAgendaWeekDay> = {}): IAgendaWeekDay => ({
  dateStr: '2026-05-18',
  label: 'LUN',
  dateNumber: 18,
  appointments: [],
  isDayOff: false,
  citaCount: 0,
  isToday: false,
  ...overrides,
});

const SEVEN_WEEK_DAYS: IAgendaWeekDay[] = [
  makeWeekDay({ dateStr: '2026-05-18', label: 'LUN', dateNumber: 18 }),
  makeWeekDay({ dateStr: '2026-05-19', label: 'MAR', dateNumber: 19 }),
  makeWeekDay({ dateStr: '2026-05-20', label: 'MIÉ', dateNumber: 20 }),
  makeWeekDay({ dateStr: '2026-05-21', label: 'JUE', dateNumber: 21 }),
  makeWeekDay({ dateStr: '2026-05-22', label: 'VIE', dateNumber: 22 }),
  makeWeekDay({ dateStr: '2026-05-23', label: 'SÁB', dateNumber: 23 }),
  makeWeekDay({ dateStr: '2026-05-24', label: 'DOM', dateNumber: 24 }),
];

const makeMonthCell = (overrides: Partial<IAgendaMonthCell> = {}): IAgendaMonthCell => ({
  dateStr: '2026-05-07',
  dateNumber: 7,
  isCurrentMonth: true,
  isToday: false,
  citaCount: 0,
  densityLevel: 0,
  chips: [],
  overflowCount: 0,
  ...overrides,
});

/** Reads the `activeDate` (2nd arg) of the most recent useAdminAgendaData call. */
function lastActiveDate(): string | undefined {
  const calls = mockUseAdminAgendaDataFn.mock.calls;
  return calls.at(-1)?.[1] as string | undefined;
}

/** Reads the `centroId` (1st arg) of the most recent useAdminAgendaData call. */
function lastCentroId(): number | null | undefined {
  const calls = mockUseAdminAgendaDataFn.mock.calls;
  return calls.at(-1)?.[0] as number | null | undefined;
}

// ── Multi-centre selector (Slice A) ─────────────────────────────────────────────
// Options come from useCentrosActivos() — ALL active centros system-wide, not
// just the ones the logged-in user is personally assigned to (superadmin /
// recepcionista must be able to operate on any centro).

describe('AdminAgendaView — centre selector (multi-centre)', () => {
  it('lists ALL active centres in the Centro menu', () => {
    mockCentrosActivos = [
      { id: 1, nombre: 'Centro Madrid' },
      { id: 2, nombre: 'Centro Barcelona' },
    ];
    render(<AdminAgendaView />, { wrapper: Wrapper });

    // The chip shows the active (primary) centre by default.
    expect(screen.getByRole('button', { name: 'Centro · Centro Madrid' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Centro · /i }));
    // Both centres are offered as options.
    expect(screen.getByText('Centro Barcelona')).toBeInTheDocument();
    expect(screen.getAllByText('Centro Madrid').length).toBeGreaterThan(0);
  });

  it('switching centre re-fetches with the new centroId and resets the servicio filter', () => {
    mockCentrosActivos = [
      { id: 1, nombre: 'Centro Madrid' },
      { id: 2, nombre: 'Centro Barcelona' },
    ];
    mockServicios = [{ nombre: 'Masaje' }];
    render(<AdminAgendaView />, { wrapper: Wrapper });

    // Initial fetch uses the primary centre id.
    expect(lastCentroId()).toBe(1);

    // Arrange a centre-scoped filter: pick the "Masaje" servicio. The Popover
    // renders its options in a portal (document.body), so query the document.
    fireEvent.click(screen.getByRole('button', { name: /Servicio · /i }));
    const servicioRadio = document.querySelector('input[type="radio"][value="Masaje"]')!;
    fireEvent.click(servicioRadio);
    expect(screen.getByRole('button', { name: 'Servicio · Masaje' })).toBeInTheDocument();

    // Switch to Barcelona (id 2).
    fireEvent.click(screen.getByRole('button', { name: /Centro · /i }));
    const barcelonaRadio = document.querySelector('input[type="radio"][value="2"]')!;
    fireEvent.click(barcelonaRadio);

    // Fetch hooks now run against the new centre …
    expect(lastCentroId()).toBe(2);
    // … and the servicio filter is back to "Todos".
    expect(screen.getByRole('button', { name: 'Servicio · Todos' })).toBeInTheDocument();
  });
});

// ── Bug fix regression — activeDate preserved across view-mode switches ────────

describe('AdminAgendaView — date preservation across view switches (bug fix)', () => {
  it('switching Day → Week → Month → List never rewrites activeDate (no Monday-snap)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    const initial = lastActiveDate();
    expect(initial).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    expect(lastActiveDate()).toBe(initial);

    fireEvent.click(screen.getByRole('button', { name: 'Mes' }));
    expect(lastActiveDate()).toBe(initial);

    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    expect(lastActiveDate()).toBe(initial);

    fireEvent.click(screen.getByRole('button', { name: 'Día' }));
    expect(lastActiveDate()).toBe(initial);
  });

  it('clicking "Hoy" while in week mode does not snap activeDate to a different value than while in day mode', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    const beforeToday = lastActiveDate();
    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));
    // handleTodayClick always sets the SAME `now` value regardless of dateMode —
    // no week-mode branch calling getWeekStart(now).
    expect(lastActiveDate()).toBe(beforeToday);
  });
});

// ── List mode is week-scoped (triggers the week query, not day-only) ───────────

describe('AdminAgendaView — list mode triggers the week query', () => {
  it('day mode (default) does NOT enable the week query', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    const lastCall = mockUseAdminWeekDataFn.mock.calls.at(-1)!;
    expect(lastCall[2]).toBe(false);
  });

  it('switching to Lista enables the week query (3rd arg = true)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    const lastCall = mockUseAdminWeekDataFn.mock.calls.at(-1)!;
    expect(lastCall[2]).toBe(true);
  });

  it('List view renders unassigned citas (therapistId=null) sourced from the week data', () => {
    mockWeekDaysReturn = [
      makeWeekDay({
        dateStr: '2026-05-18',
        label: 'LUN',
        dateNumber: 18,
        citaCount: 1,
        appointments: [
          makeAppt({ id: 900, therapistId: null, clientName: null, sala: null, salaId: null }),
        ],
      }),
    ];
    render(<AdminAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    // clientName null → "—" placeholder; the row still renders fully.
    expect(
      screen.getByRole('button', { name: '— · 10:00–11:00 · Masaje · Confirmada' }),
    ).toBeInTheDocument();
  });
});

// ── Cross-view day navigation ────────────────────────────────────────────────

describe('AdminAgendaView — cross-view day navigation', () => {
  it('clicking a Week day header switches to Day view for that date', () => {
    mockWeekDaysReturn = SEVEN_WEEK_DAYS;
    render(<AdminAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));

    fireEvent.click(screen.getByRole('button', { name: 'Ver el día VIE 22' }));

    // Switched back to the Day grid…
    expect(screen.getByLabelText('Calendario de agenda')).toBeInTheDocument();
    // …at the clicked date.
    expect(lastActiveDate()).toBe('2026-05-22');
  });

  it('clicking a Month cell switches to Day view for that date', () => {
    mockCellsReturn = [
      makeMonthCell({ dateStr: '2026-05-07', dateNumber: 7 }),
      makeMonthCell({ dateStr: '2026-05-14', dateNumber: 14 }),
    ];
    render(<AdminAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Mes' }));

    fireEvent.click(screen.getByLabelText('14 · 0 citas'));

    expect(screen.getByLabelText('Calendario de agenda')).toBeInTheDocument();
    expect(lastActiveDate()).toBe('2026-05-14');
  });
});
