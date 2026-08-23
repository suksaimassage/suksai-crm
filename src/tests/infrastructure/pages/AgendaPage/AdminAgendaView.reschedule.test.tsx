/**
 * AdminAgendaView.reschedule.test.tsx
 *
 * View-level integration for the drag & drop reschedule wiring (Surface A) that
 * ONLY exists at the parent (`AdminAgendaView`): turning a grid drop into the
 * confirm Dialog, then persisting via `useRescheduleCita` with a correctly-built
 * LOCAL Date payload, keeping the Dialog open on a domain failure, and writing
 * nothing on cancel.
 *
 * Mock strategy mirrors AdminAgendaView.cluster.test.tsx (the Developer's
 * established pattern): every data + mutation hook is mocked to stable values;
 * useUserStore / useDashboardCentroId drive roles + centroId; the router hooks are
 * stubbed (useSearch throws outside a RouterProvider). Two additions:
 *
 *   1. `useRescheduleCita` is mocked with a CONTROLLABLE mutate so each test can
 *      drive onSuccess / onError and inspect the exact payload.
 *   2. `AgendaWeekGrid` is replaced by a STUB that surfaces a "drop" button which
 *      calls the real `onRescheduleDrop` with a fixed snapshot. This deliberately
 *      isolates the parent's handler logic from the pointer-gesture hook (which has
 *      its own tests in useWeekCitaDnD.test.tsx) — the integration under test is
 *      "drop snapshot → Dialog → confirm → mutate", not the DOM gesture.
 *
 * Interactions use `fireEvent` (no user-event in this repo).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import esCommon from '@infra/i18n/locales/es/common.json';
import type { TNombreRol } from '@domain/types';
import type { IAgendaAppointment, IAgendaWeekDay } from '@domain/models/agenda.models';
import type { IWeekRescheduleDrop } from '@infra/pages/AgendaPage/components/admin/useWeekCitaDnD';

// ── Driving state ──────────────────────────────────────────────────────────────
let mockRoles: TNombreRol[] = ['superadmin'];
let mockCentroId: number | null = 1;

// Controllable reschedule mutation: each `mutate` call records its options so a
// test can drive onSuccess/onError, and records the payload for assertions.
interface IRescheduleVars {
  citaId: number;
  changes: { fechaHoraInicio: Date; fechaHoraFin: Date };
}
interface IMutateOpts {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}
const rescheduleMutate = vi.fn<(vars: IRescheduleVars, opts?: IMutateOpts) => void>();
let rescheduleIsPending = false;

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
// The week data must CONTAIN the dragged cita (id 101, non-terminal) so the
// parent's E-A8 "close-on-vanish" guard keeps the pending reschedule alive — that
// guard discards `pendingReschedule` if the cita is absent from the live weekDays
// or has gone terminal. The grid itself is stubbed, so these fixtures only feed
// the guard, not the rendering.
const PENDING_CITA: IAgendaAppointment = {
  id: 101,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Lucía',
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
};
const WEEK_DAY_WITH_CITA: IAgendaWeekDay = {
  dateStr: '2026-06-08',
  label: 'LUN',
  dateNumber: 8,
  appointments: [PENDING_CITA],
  isDayOff: false,
  citaCount: 1,
  isToday: false,
};
vi.mock('@infra/hooks/useAdminWeekData', () => ({
  useAdminWeekData: (): unknown => ({
    weekDays: [WEEK_DAY_WITH_CITA],
    therapists: [],
    colorMap: {},
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
vi.mock('@infra/hooks/useRescheduleCita', () => ({
  useRescheduleCita: (): unknown => ({ mutate: rescheduleMutate, isPending: rescheduleIsPending }),
}));
vi.mock('@infra/components/ui/domain/modals', () => ({
  CitaModal: () => <div data-testid="cita-modal" />,
}));

// The drop snapshot the stubbed grid feeds into the real onRescheduleDrop. A net
// change: origin 2026-06-08 10:00 → proposed 2026-06-09 11:00 (60-min service).
const FIXED_DROP: IWeekRescheduleDrop = {
  citaId: 101,
  clientName: 'Lucía',
  serviceName: 'Aromaterapia',
  durationMin: 60,
  origin: { dateStr: '2026-06-08', startTime: '10:00', endTime: '11:00' },
  proposed: { dateStr: '2026-06-09', startTime: '11:00', endTime: '12:00' },
};

// Stub AgendaWeekGrid: render a button that invokes the real onRescheduleDrop, and
// echo the `rescheduleBusy` prop so the "no second drag" wiring is observable.
vi.mock('@infra/pages/AgendaPage/components/admin/AgendaWeekGrid', () => ({
  AgendaWeekGrid: ({
    onRescheduleDrop,
    rescheduleBusy,
  }: {
    onRescheduleDrop: (d: IWeekRescheduleDrop) => void;
    rescheduleBusy: boolean;
  }) => (
    <div data-testid="week-grid" data-reschedule-busy={String(rescheduleBusy)}>
      <button
        type="button"
        data-testid="emit-drop"
        onClick={() => {
          onRescheduleDrop(FIXED_DROP);
        }}
      >
        emit drop
      </button>
    </div>
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

/** Switch the view into week mode (the only mode that mounts AgendaWeekGrid). */
const enterWeekMode = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
};
/** Trigger the grid's net-change drop → opens the confirm Dialog. */
const emitDrop = (): void => {
  fireEvent.click(screen.getByTestId('emit-drop'));
};

beforeEach(() => {
  mockRoles = ['superadmin'];
  mockCentroId = 1;
  rescheduleIsPending = false;
  rescheduleMutate.mockReset();
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// Drop → confirm Dialog opens
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView — drop opens the reschedule Dialog', () => {
  it('a net-change drop opens the confirm Dialog with the FROM → TO summary', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    // No Dialog before the drop.
    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();

    emitDrop();

    // Dialog open with the title + the self-contained summary.
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();
    expect(screen.getByText('Lucía · Aromaterapia')).toBeInTheDocument();
    // Destination day label is derived from the week-day data (falls back to the
    // dateStr when the day isn't in the (empty) mocked week) + the snapped time.
    expect(screen.getByText('2026-06-09 · 11:00')).toBeInTheDocument();
  });

  it('opening the Dialog does NOT call the mutation (confirmation is required first)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();
    expect(rescheduleMutate).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Confirm → mutate with a correct LOCAL Date payload
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView — confirm persists via useRescheduleCita', () => {
  it('Confirm calls mutate with citaId + a {fechaHoraInicio, fechaHoraFin} change set', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(rescheduleMutate).toHaveBeenCalledTimes(1);
    const [vars] = rescheduleMutate.mock.calls[0];
    expect(vars.citaId).toBe(101);
    expect(vars.changes.fechaHoraInicio).toBeInstanceOf(Date);
    expect(vars.changes.fechaHoraFin).toBeInstanceOf(Date);
  });

  it('builds fechaHoraInicio from LOCAL parts of the proposed slot', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    const { fechaHoraInicio } = rescheduleMutate.mock.calls[0][0].changes;
    // proposed = 2026-06-09 11:00 → local calendar parts (TZ pinned Europe/Madrid).
    expect(fechaHoraInicio.getFullYear()).toBe(2026);
    expect(fechaHoraInicio.getMonth()).toBe(5); // June (0-indexed)
    expect(fechaHoraInicio.getDate()).toBe(9);
    expect(fechaHoraInicio.getHours()).toBe(11);
    expect(fechaHoraInicio.getMinutes()).toBe(0);
  });

  it('derives fechaHoraFin as start + durationMin (12:00 for a 60-min service)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    const { fechaHoraInicio, fechaHoraFin } = rescheduleMutate.mock.calls[0][0].changes;
    expect(fechaHoraFin.getHours()).toBe(12);
    expect(fechaHoraFin.getMinutes()).toBe(0);
    // End is exactly 60 minutes after start.
    expect(fechaHoraFin.getTime() - fechaHoraInicio.getTime()).toBe(60 * 60 * 1000);
  });

  it('closes the Dialog on a successful reschedule', () => {
    rescheduleMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    // onSuccess clears pendingReschedule → the Dialog unmounts.
    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Domain failure → Dialog stays open with the message
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView — domain failure keeps the Dialog open', () => {
  it('a BusinessRuleViolation message is shown in the Dialog and the Dialog stays open', () => {
    rescheduleMutate.mockImplementation((_vars, opts) => {
      opts?.onError?.(new Error('El terapeuta ya tiene una cita en ese horario.'));
    });
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    // Dialog still open with the localized domain message in role="alert".
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El terapeuta ya tiene una cita en ese horario.',
    );
  });

  it('falls back to a generic message when the error is not an Error instance', () => {
    rescheduleMutate.mockImplementation((_vars, opts) => {
      opts?.onError?.('weird non-error rejection');
    });
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo reagendar la cita. Inténtalo de nuevo.',
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Cancel → no DB write
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView — cancel writes nothing', () => {
  it('Cancelar closes the Dialog without calling the mutation', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    emitDrop();
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();
    expect(rescheduleMutate).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Busy gating (E-A7) — rescheduleBusy is propagated to the grid while pending
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView — rescheduleBusy gating', () => {
  it('the grid is told reschedule is busy while a pending confirmation is open', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    enterWeekMode();
    // Before any drop → not busy.
    expect(screen.getByTestId('week-grid')).toHaveAttribute('data-reschedule-busy', 'false');

    emitDrop();

    // pendingReschedule !== null → rescheduleBusy true (no new drag may begin).
    expect(screen.getByTestId('week-grid')).toHaveAttribute('data-reschedule-busy', 'true');
  });
});
