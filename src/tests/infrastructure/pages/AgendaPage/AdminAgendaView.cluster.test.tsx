/**
 * AdminAgendaView.cluster.test.tsx
 *
 * View-level integration for the week-view "folder" wiring in AdminAgendaView.
 * Covers the contracts that ONLY exist at the parent (the grid + popover have
 * their own leaf tests):
 *
 *   - OQ-1 filter-BEFORE-cluster: the active filter chips reduce the week's citas
 *     before grouping, so a filter can drop a 2-member group to a singleton
 *     (E7-via-filter) and the per-day header count reflects the filtered set;
 *   - D12 close-on-vanish: if a filter drops the OPEN group below 2, the popup
 *     closes;
 *   - D7 mutual exclusivity: opening a cluster clears the singleton selection (and
 *     the row→edit handler nulls both);
 *   - row click → CitaModal opens in edit mode.
 *
 * Mock strategy mirrors AdminAgendaView.test.tsx EXACTLY (the Developer's
 * established pattern): every data + mutation hook is mocked to stable values;
 * useUserStore / useDashboardCentroId drive roles + centroId; CitaModal is
 * stubbed. The ONE addition is a mutable `mockWeekDays` so each test feeds its
 * own overlapping fixtures into useAdminWeekData.
 *
 * Interactions use `fireEvent` — `@testing-library/user-event` is NOT a project
 * dependency and the Tester brief forbids adding deps (see the report's Missing
 * Risks). The whole existing agenda suite uses fireEvent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import esCommon from '@infra/i18n/locales/es/common.json';
import type { TNombreRol, TEstadoCita } from '@domain/types';
import type {
  IAgendaWeekDay,
  IAgendaAppointment,
  TTherapistColorMap,
} from '@domain/models/agenda.models';

// ── Driving state ──────────────────────────────────────────────────────────────
let mockRoles: TNombreRol[] = ['superadmin'];
let mockCentroId: number | null = 1;
let mockWeekDays: readonly IAgendaWeekDay[] = [];
const mockColorMap: TTherapistColorMap = { 10: 'a', 11: 'b' };

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
vi.mock('@infra/hooks/useUsuarioCentros', () => ({
  useUsuarioCentros: (): {
    centros: { id: number; nombre: string; esPrincipal: boolean }[];
  } => ({ centros: [{ id: 1, nombre: 'Centro Madrid', esPrincipal: true }] }),
}));
// AdminAgendaView reads the `clienteId` search param + navigates (deep-link to
// open the create modal). Outside a RouterProvider those hooks throw, so stub the
// two it uses. (The existing AdminAgendaView.test.tsx lacks this and is currently
// red in the baseline — see the report's Missing Risks.)
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
vi.mock('@infra/hooks/useAdminAgendaData', () => ({
  useAdminAgendaData: (): typeof emptyAdmin => emptyAdmin,
}));
vi.mock('@infra/hooks/useAdminWeekData', () => ({
  useAdminWeekData: (): unknown => ({
    weekDays: mockWeekDays,
    therapists: [],
    colorMap: mockColorMap,
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@infra/hooks/useAdminMonthData', () => ({
  useAdminMonthData: (): unknown => ({
    cells: [],
    footerKpis: { totalCitas: 0, monthLabel: '', ocupacionPct: null, peakDays: [] },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@infra/hooks/useCentrosActivos', () => ({
  useCentrosActivos: (): unknown => ({ data: [{ id: 1, nombre: 'Centro Madrid' }] }),
}));
vi.mock('@infra/hooks/useServiciosActivosCentro', () => ({
  useServiciosActivosCentro: (): unknown => ({ servicios: [], isLoading: false, isError: false }),
}));
// The detail popover (singleton selection, D7 test) loads the cita via this hook.
// A stable not-found state keeps it deterministic — the popover still renders its
// header ("Detalle de la cita"), which is all the D7 test needs to observe.
vi.mock('@infra/hooks/useCitaById', () => ({
  useCitaById: (): { cita: null; isLoading: boolean; isError: boolean } => ({
    cita: null,
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
// CitaModal stub that surfaces its mode so we can assert "edit" was requested.
vi.mock('@infra/components/ui/domain/modals', () => ({
  CitaModal: ({ mode, citaId }: { mode: string; citaId?: number }) => (
    <div data-testid="cita-modal" data-mode={mode} data-cita-id={citaId ?? ''} />
  ),
}));

import { AdminAgendaView } from '@infra/pages/AgendaPage/views/AdminAgendaView';

// ── i18n ────────────────────────────────────────────────────────────────────────
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda', 'common'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda, common: esCommon } },
  interpolation: { escapeValue: false },
});

// AgendaCitaDetailPopover (mounted when a singleton is selected, D7 test) loads
// the cita via useCitaById → useQuery, so a QueryClient must be present. retry off
// + no refetch keeps it deterministic.
const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={testQueryClient}>
    <I18nextProvider i18n={testI18n}>
      <StyledThemeProvider theme={lightTheme}>
        <ToastProvider>{children}</ToastProvider>
      </StyledThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Ana',
  visitInfo: null,
  serviceName: 'Aromaterapia',
  sala: 'Suite',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 6000,
  ...overrides,
});

// Two overlapping citas, distinct estados so an estado filter can split them.
// dayStart=8 → 10:00 = startMin 120 → cluster key "2026-06-08#120".
const CONFIRMED = makeAppt({
  id: 101,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  estado: 'confirmada',
  clientName: 'Ana',
});
const PENDING = makeAppt({
  id: 102,
  startTime: '10:30',
  endTime: '11:30',
  durationMin: 60,
  estado: 'pendiente',
  clientName: 'Beto',
});

const CLUSTER_DAY = '2026-06-08';
const TRIGGER_NAME = 'Grupo de 2 citas, 10:00–11:30';

const makeWeekDay = (
  appointments: readonly IAgendaAppointment[],
  overrides: Partial<IAgendaWeekDay> = {},
): IAgendaWeekDay => ({
  dateStr: CLUSTER_DAY,
  label: 'LUN',
  dateNumber: 8,
  appointments,
  isDayOff: false,
  citaCount: appointments.length,
  isToday: false,
  ...overrides,
});

/** Switch the view into week mode by pressing the "Semana" segment button. */
const enterWeekMode = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
};

/**
 * Open the Estado filter chip and select an estado by its value (e.g. 'confirmada').
 *
 * The filter menu's Radio renders its visible label as a sibling (not inside the
 * radio's own <label>), so clicking the label text does NOT toggle the input.
 * The deterministic lever is the radio input itself (it carries value={estado});
 * firing a click on it invokes its onChange → the chip's onChange → the filter.
 */
const selectEstadoFilter = (estadoValue: TEstadoCita): void => {
  // Open the Estado chip (its accessible name is "Estado · Todos" when unset).
  fireEvent.click(screen.getByRole('button', { name: /^Estado · / }));
  // The options list is a role="group" labelled "Filtrar por estado".
  const menu = screen.getByRole('group', { name: 'Filtrar por estado' });
  const radios = within(menu).getAllByRole('radio');
  const target = radios.find((r) => r.getAttribute('value') === estadoValue);
  if (target === undefined) {
    throw new Error(`No estado radio for value "${estadoValue}"`);
  }
  fireEvent.click(target);
};

beforeEach(() => {
  mockRoles = ['superadmin'];
  mockCentroId = 1;
  mockWeekDays = [makeWeekDay([CONFIRMED, PENDING])];
  vi.clearAllMocks();
});

// ── Week mode renders the folder ───────────────────────────────────────────────

describe('AdminAgendaView — week mode renders the folder', () => {
  it('switching to week mode shows a folder for the overlapping pair', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toBeInTheDocument();
  });

  it('the day header count reflects the unfiltered set (2 citas)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    expect(screen.getByText('2 citas')).toBeInTheDocument();
  });
});

// ── OQ-1 filter-before-cluster + E7-via-filter ─────────────────────────────────

describe('AdminAgendaView — filter before cluster (OQ-1 / E7-via-filter)', () => {
  it('an estado filter drops the 2-member group to a singleton (folder gone)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    // Folder present before filtering…
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toBeInTheDocument();

    // Filter to estado=Confirmada → only CONFIRMED (101) survives → no cluster.
    selectEstadoFilter('confirmada');

    expect(screen.queryByRole('button', { name: TRIGGER_NAME })).not.toBeInTheDocument();
    // The surviving cita renders as a normal singleton block (its event aria-label).
    expect(
      screen.getByRole('button', { name: 'Ana · 10:00–11:00 · Aromaterapia' }),
    ).toBeInTheDocument();
  });

  it('the per-day header count recomputes from the filtered list (2 → 1)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    expect(screen.getByText('2 citas')).toBeInTheDocument();

    selectEstadoFilter('confirmada');

    // citaCount recomputed from the filtered list.
    expect(screen.getByText('1 cita')).toBeInTheDocument();
    expect(screen.queryByText('2 citas')).not.toBeInTheDocument();
  });
});

// ── D12 close-on-vanish (open group dropped below 2 by a filter) ───────────────

describe('AdminAgendaView — D12 close-on-vanish', () => {
  it('closes the open cluster popup when a filter drops its group below 2', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();

    // Open the folder → the list popup mounts (labelled with the trigger string).
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
    expect(screen.getByRole('list', { name: TRIGGER_NAME })).toBeInTheDocument();

    // Apply a filter that collapses the group → the D12 effect closes the popup.
    selectEstadoFilter('confirmada');

    expect(screen.queryByRole('list', { name: TRIGGER_NAME })).not.toBeInTheDocument();
  });
});

// ── D7 mutual exclusivity + row → edit modal ───────────────────────────────────

describe('AdminAgendaView — cluster open clears singleton selection (D7)', () => {
  it('opening a cluster while a singleton is selected closes the detail popover', () => {
    // A column with ONE singleton (id 200) plus the overlapping pair.
    const lone = makeAppt({
      id: 200,
      startTime: '15:00',
      endTime: '16:00',
      durationMin: 60,
      clientName: 'Solo',
      serviceName: 'Masaje Solo',
    });
    mockWeekDays = [makeWeekDay([CONFIRMED, PENDING, lone])];
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();

    // Select the singleton → its detail popover opens (title "Detalle de la cita").
    fireEvent.click(screen.getByRole('button', { name: 'Solo · 15:00–16:00 · Masaje Solo' }));
    expect(screen.getByText('Detalle de la cita')).toBeInTheDocument();

    // Now open the cluster → D7 nulls selectedCitaId → the detail popover unmounts,
    // the cluster list popup is shown instead.
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
    expect(screen.getByRole('list', { name: TRIGGER_NAME })).toBeInTheDocument();
    expect(screen.queryByText('Detalle de la cita')).not.toBeInTheDocument();
  });
});

describe('AdminAgendaView — cluster row opens the edit modal', () => {
  it('clicking a row opens CitaModal in edit mode for that cita', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();

    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
    // Click the "Beto" row (id 102).
    fireEvent.click(screen.getByRole('button', { name: /^Beto,/ }));

    const modal = screen.getByTestId('cita-modal');
    expect(modal).toHaveAttribute('data-mode', 'edit');
    expect(modal).toHaveAttribute('data-cita-id', '102');
    // The popup closed on edit (handleEdit nulls openClusterKey).
    expect(screen.queryByRole('list', { name: TRIGGER_NAME })).not.toBeInTheDocument();
  });
});
