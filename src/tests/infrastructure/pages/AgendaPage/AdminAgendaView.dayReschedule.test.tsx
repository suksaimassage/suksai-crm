/**
 * AdminAgendaView.dayReschedule.test.tsx
 *
 * View-level integration for the DAY-grid drag & drop reschedule wiring (Surface A)
 * that ONLY exists at the parent (`AdminAgendaView`): turning a day-grid drop into
 * the confirm Dialog, then persisting via `useRescheduleCita` with a correctly-built
 * LOCAL Date payload — AND, uniquely to the day view, threading `usuarioId` into the
 * mutation `changes` ONLY when the drag crossed therapist columns (a reassignment).
 * A pure time move keeps the current assignee (no `usuarioId`). On a domain failure
 * the Dialog stays open; on cancel nothing is written.
 *
 * Sibling of AdminAgendaView.reschedule.test.tsx (the WEEK path). The day grid is
 * the DEFAULT mode (`dateMode: 'day'`), so the view mounts AgendaCalendarGrid with
 * no mode switch. Mock strategy mirrors the week test:
 *   - every data + mutation hook mocked to stable values; useUserStore /
 *     useDashboardCentroId drive roles + centroId; router hooks stubbed.
 *   - `useRescheduleCita` mocked with a CONTROLLABLE mutate so each test drives
 *     onSuccess / onError and inspects the exact payload.
 *   - `AgendaCalendarGrid` is replaced by a STUB exposing TWO "drop" buttons that
 *     call the real `onRescheduleDrop` with a fixed REASSIGN snapshot (therapist
 *     changed) and a TIME-ONLY snapshot (same therapist). This isolates the parent's
 *     handler logic from the pointer-gesture hook (covered in useDayCitaDnD.test.tsx).
 *
 * The dragged cita (id 101, non-terminal) lives in `useAdminAgendaData().appointments`
 * so the parent's E-A8 "close-on-vanish" guard (which checks the day `appointments`
 * dataset) keeps the pending reschedule alive while the Dialog is open.
 *
 * Interactions use `fireEvent` (no user-event in this repo). TZ is pinned to
 * Europe/Madrid by the vitest config, so the LOCAL Date assertions are deterministic.
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
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { IDayRescheduleDrop } from '@infra/pages/AgendaPage/components/admin/useDayCitaDnD';

// ── Driving state ──────────────────────────────────────────────────────────────
let mockRoles: TNombreRol[] = ['superadmin'];
let mockCentroId: number | null = 1;

// Controllable reschedule mutation: each `mutate` call records its options so a
// test can drive onSuccess/onError, and records the payload for assertions. The
// `changes` shape is loose because the day path adds an OPTIONAL `usuarioId`.
interface IRescheduleVars {
  citaId: number;
  changes: { fechaHoraInicio: Date; fechaHoraFin: Date; usuarioId?: number };
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

// The day `appointments` dataset MUST contain the dragged cita (id 101, non-terminal)
// so the parent's E-A8 close-on-vanish guard keeps the pending reschedule alive — the
// guard discards `pendingReschedule` if the cita is absent from the live day
// `appointments` (and the week `weekDays`) or has gone terminal. The grid itself is
// stubbed, so this fixture only feeds the guard + the (empty) filter predicate.
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
const adminWithCita = {
  therapists: [],
  appointments: [PENDING_CITA],
  unassignedAppointments: [],
  kpis: [],
  alerts: [],
  legendItems: [],
  adminCount: 1,
  isLoading: false,
  isError: false,
};
vi.mock('@infra/hooks/useAdminAgendaData', () => ({
  useAdminAgendaData: (): typeof adminWithCita => adminWithCita,
}));
vi.mock('@infra/hooks/useAdminWeekData', () => ({
  useAdminWeekData: (): unknown => ({
    weekDays: [],
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

// ── Drop snapshots the stubbed grid feeds into the real onRescheduleDrop ──────────
// Both fix the date (= the day view never changes the day) at 2026-06-09.
// REASSIGN: origin therapist 10 → proposed therapist 11, 10:00 → 11:00 (60-min).
const REASSIGN_DROP: IDayRescheduleDrop = {
  citaId: 101,
  clientName: 'Lucía',
  serviceName: 'Aromaterapia',
  durationMin: 60,
  dateStr: '2026-06-09',
  origin: { therapistId: 10, therapistName: 'Naree Siri', startTime: '10:00', endTime: '11:00' },
  proposed: { therapistId: 11, therapistName: 'Som Chai', startTime: '11:00', endTime: '12:00' },
};
// TIME-ONLY: same therapist 10 on both ends, 10:00 → 11:00 (no reassignment).
const TIME_ONLY_DROP: IDayRescheduleDrop = {
  citaId: 101,
  clientName: 'Lucía',
  serviceName: 'Aromaterapia',
  durationMin: 60,
  dateStr: '2026-06-09',
  origin: { therapistId: 10, therapistName: 'Naree Siri', startTime: '10:00', endTime: '11:00' },
  proposed: { therapistId: 10, therapistName: 'Naree Siri', startTime: '11:00', endTime: '12:00' },
};

// Stub AgendaCalendarGrid: render two buttons that invoke the real onRescheduleDrop,
// and echo the `rescheduleBusy` prop so the "no second drag" wiring is observable.
vi.mock('@infra/pages/AgendaPage/components/admin/AgendaCalendarGrid', () => ({
  AgendaCalendarGrid: ({
    onRescheduleDrop,
    rescheduleBusy,
  }: {
    onRescheduleDrop: (d: IDayRescheduleDrop) => void;
    rescheduleBusy: boolean;
  }) => (
    <div data-testid="day-grid" data-reschedule-busy={String(rescheduleBusy)}>
      <button
        type="button"
        data-testid="emit-reassign-drop"
        onClick={() => {
          onRescheduleDrop(REASSIGN_DROP);
        }}
      >
        emit reassign drop
      </button>
      <button
        type="button"
        data-testid="emit-time-only-drop"
        onClick={() => {
          onRescheduleDrop(TIME_ONLY_DROP);
        }}
      >
        emit time-only drop
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

// Day is the DEFAULT mode → the grid mounts immediately, no mode switch needed.
const emitReassignDrop = (): void => {
  fireEvent.click(screen.getByTestId('emit-reassign-drop'));
};
const emitTimeOnlyDrop = (): void => {
  fireEvent.click(screen.getByTestId('emit-time-only-drop'));
};

beforeEach(() => {
  mockRoles = ['superadmin'];
  mockCentroId = 1;
  rescheduleIsPending = false;
  rescheduleMutate.mockReset();
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// Drop → confirm Dialog opens (with the reassignment summary)
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView (day) — drop opens the reschedule Dialog', () => {
  it('a reassign drop opens the confirm Dialog with the summary + reassignment row', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    // No Dialog before the drop.
    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();

    emitReassignDrop();

    // Dialog open with the title + the self-contained summary.
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();
    expect(screen.getByText('Lucía · Aromaterapia')).toBeInTheDocument();
    // The reassignment row is rendered because the drag crossed therapist columns.
    expect(screen.getByText('Naree Siri → Som Chai')).toBeInTheDocument();
    expect(screen.getByText('Reasignación')).toBeInTheDocument();
  });

  it('a time-only drop opens the Dialog WITHOUT the reassignment row', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitTimeOnlyDrop();
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();
    // Same therapist on both ends → no reassignment fact.
    expect(screen.queryByText('Reasignación')).not.toBeInTheDocument();
  });

  it('opening the Dialog does NOT call the mutation (confirmation is required first)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();
    expect(rescheduleMutate).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Confirm (reassignment) → mutate INCLUDES usuarioId + LOCAL Date payload
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView (day) — confirm a reassignment persists usuarioId', () => {
  it('Confirm calls mutate with citaId + {fechaHoraInicio, fechaHoraFin, usuarioId}', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(rescheduleMutate).toHaveBeenCalledTimes(1);
    const [vars] = rescheduleMutate.mock.calls[0];
    expect(vars.citaId).toBe(101);
    expect(vars.changes.fechaHoraInicio).toBeInstanceOf(Date);
    expect(vars.changes.fechaHoraFin).toBeInstanceOf(Date);
    // The destination therapist id is threaded through because the drag reassigned.
    expect(vars.changes.usuarioId).toBe(11);
  });

  it('builds fechaHoraInicio from LOCAL parts of the proposed slot (fixed day)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    const { fechaHoraInicio } = rescheduleMutate.mock.calls[0][0].changes;
    // proposed = 2026-06-09 11:00 (TZ pinned Europe/Madrid).
    expect(fechaHoraInicio.getFullYear()).toBe(2026);
    expect(fechaHoraInicio.getMonth()).toBe(5); // June (0-indexed)
    expect(fechaHoraInicio.getDate()).toBe(9);
    expect(fechaHoraInicio.getHours()).toBe(11);
    expect(fechaHoraInicio.getMinutes()).toBe(0);
  });

  it('derives fechaHoraFin as start + durationMin (12:00 for a 60-min service)', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    const { fechaHoraInicio, fechaHoraFin } = rescheduleMutate.mock.calls[0][0].changes;
    expect(fechaHoraFin.getHours()).toBe(12);
    expect(fechaHoraFin.getMinutes()).toBe(0);
    expect(fechaHoraFin.getTime() - fechaHoraInicio.getTime()).toBe(60 * 60 * 1000);
  });

  it('closes the Dialog on a successful reschedule', () => {
    rescheduleMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Confirm (time-only) → mutate OMITS usuarioId (current assignee kept)
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView (day) — confirm a time-only move omits usuarioId', () => {
  it('Confirm calls mutate WITHOUT a usuarioId key when the therapist did not change', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitTimeOnlyDrop();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(rescheduleMutate).toHaveBeenCalledTimes(1);
    const [vars] = rescheduleMutate.mock.calls[0];
    expect(vars.citaId).toBe(101);
    // No reassignment → the key is OMITTED entirely (not merely undefined-valued).
    expect('usuarioId' in vars.changes).toBe(false);
  });

  it('still moves the time: fechaHoraInicio is the proposed 11:00 slot', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitTimeOnlyDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    const { fechaHoraInicio } = rescheduleMutate.mock.calls[0][0].changes;
    expect(fechaHoraInicio.getHours()).toBe(11);
    expect(fechaHoraInicio.getDate()).toBe(9);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Domain failure → Dialog stays open with the message
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView (day) — domain failure keeps the Dialog open', () => {
  it('a BusinessRuleViolation message is shown in role="alert" and the Dialog stays open', () => {
    rescheduleMutate.mockImplementation((_vars, opts) => {
      opts?.onError?.(new Error('El terapeuta ya tiene una cita en ese horario.'));
    });
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

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
    emitReassignDrop();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo reagendar la cita. Inténtalo de nuevo.',
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Cancel → no DB write
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView (day) — cancel writes nothing', () => {
  it('Cancelar closes the Dialog without calling the mutation', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    emitReassignDrop();
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();
    expect(rescheduleMutate).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Busy gating (E-A7) — rescheduleBusy is propagated to the grid while pending
// ════════════════════════════════════════════════════════════════════════════

describe('AdminAgendaView (day) — rescheduleBusy gating', () => {
  it('the day grid is told reschedule is busy while a pending confirmation is open', () => {
    render(<AdminAgendaView />, { wrapper: Wrapper });
    // Before any drop → not busy.
    expect(screen.getByTestId('day-grid')).toHaveAttribute('data-reschedule-busy', 'false');

    emitReassignDrop();

    // pendingReschedule !== null → rescheduleBusy true (no new drag may begin).
    expect(screen.getByTestId('day-grid')).toHaveAttribute('data-reschedule-busy', 'true');
  });
});
