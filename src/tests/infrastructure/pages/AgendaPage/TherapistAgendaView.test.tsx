/**
 * TherapistAgendaView.test.tsx
 *
 * Integration-light test of the therapist agenda view's quick-edit OPEN flow —
 * the wiring the leaf tests can't cover:
 *   - clicking a Mi Día timeline card opens the CitaQuickEditModal for that cita;
 *   - switching to "Mi semana" and activating a mini-event opens it too;
 *   - a `break` mini-event does NOT open the modal (guarded in handleWeekApptClick).
 *
 * Mock strategy (mirrors AdminAgendaView.test.tsx): the data hooks + user store
 * are mocked to stable values so the view renders deterministically. The heavy
 * presentational siblings (hero/week banners, rails, therapist selector) are
 * stubbed — they are irrelevant to the open flow and pull in their own data
 * shapes. The REAL TherapistTimeline + TherapistWeekGrid stay (they are the
 * click sources) and the REAL CitaQuickEditModal renders (its own mutation hooks
 * + toast are mocked so it never touches the composition root). This asserts the
 * genuine end-to-end open path, not a stub.
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
import type { IAgendaAppointment, IAgendaTherapistWeekDay } from '@domain/models/agenda.models';

// ── Fixtures the mocked hooks return ────────────────────────────────────────────

function makeAppt(overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment {
  return {
    id: 501,
    therapistId: 9,
    startTime: '10:00',
    endTime: '11:00',
    durationMin: 60,
    clientName: 'Cliente Día',
    visitInfo: null,
    serviceName: 'Masaje Tradicional',
    sala: 'Sala Loto',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'confirmada',
    timelineState: 'now',
    evtVariant: 'jungle',
    notes: null,
    tags: [],
    precioFinal: 5000,
    ...overrides,
  };
}

function makeWeekDay(overrides: Partial<IAgendaTherapistWeekDay> = {}): IAgendaTherapistWeekDay {
  return {
    dateStr: '2026-05-18',
    label: 'LUN',
    dateNumber: 18,
    dayOfWeek: 1,
    isToday: false,
    isPast: false,
    isLibranza: false,
    appointments: [],
    citaCount: 0,
    hoursWorked: 0,
    revenueForDay: 0,
    ...overrides,
  };
}

const EMPTY_STATS = {
  citasTotal: 0,
  citasCompletadas: 0,
  horasEnSala: 0,
  ocupacionPct: 0,
};
const EMPTY_BALANCE = {
  citasTotal: 0,
  citasCompletadas: 0,
  horasEnSala: 0,
  propinas: 0,
  valoracionMedia: 0,
  weekLabel: '',
};

// Mutable per-test state for the two data hooks.
let dayAppointments: IAgendaAppointment[] = [makeAppt()];
let weekDays: IAgendaTherapistWeekDay[] = [];

// Spies wrapping the two date-driven hooks so the "date preserved across the
// Día↔Semana toggle" regression test can inspect the exact args passed on each
// render (there is no Prev/Next/Today control in this view — `activeDate` is a
// plain `const activeDate = getTodayKey()`, not state, since the Developer's
// useState→const change removed the only place that ever called setActiveDate).
const mockUseTherapistAgendaDataFn = vi.fn((..._args: unknown[]) => ({
  appointments: dayAppointments,
  stats: EMPTY_STATS,
  notes: null,
  reviews: [],
  sala: 'Sala Loto',
  therapistCount: dayAppointments.length,
  isLoading: false,
  isError: false,
}));
const mockUseTherapistWeekDataFn = vi.fn((..._args: unknown[]) => ({
  weekDays,
  balance: EMPTY_BALANCE,
  isLoading: false,
  isError: false,
}));

// ── Mocks ────────────────────────────────────────────────────────────────────────

vi.mock('@app/stores/useUserStore', () => ({
  // A masajista → isAdmin=false → own agenda, no therapist selector branch.
  useUserStore: (selector: (s: unknown) => unknown): unknown =>
    selector({
      user: {
        id: 9,
        nombre: 'Naree',
        apellidos: '',
        email: 'n@b.c',
        roles: ['masajista'],
        isActive: true,
      },
    }),
}));
vi.mock('@infra/hooks/useDashboardCentroId', () => ({
  useDashboardCentroId: (): { centroId: number | null } => ({ centroId: 1 }),
}));
vi.mock('@infra/hooks/useCentroMasajistas', () => ({
  useCentroMasajistas: (): unknown => ({ masajistas: [], isLoading: false, isError: false }),
}));
vi.mock('@infra/hooks/useTherapistAgendaData', () => ({
  useTherapistAgendaData: (...a: unknown[]): unknown => mockUseTherapistAgendaDataFn(...a),
}));
vi.mock('@infra/hooks/useTherapistWeekData', () => ({
  useTherapistWeekData: (...a: unknown[]): unknown => mockUseTherapistWeekDataFn(...a),
}));

// Stub the heavy presentational siblings — not part of the open flow.
vi.mock('@infra/pages/AgendaPage/components/therapist/TherapistHeroBanner', () => ({
  TherapistHeroBanner: () => <div data-testid="hero-banner" />,
}));
vi.mock('@infra/pages/AgendaPage/components/therapist/TherapistRail', () => ({
  TherapistRail: () => <div data-testid="ther-rail" />,
}));
vi.mock('@infra/pages/AgendaPage/components/therapist/TherapistWeekBanner', () => ({
  TherapistWeekBanner: () => <div data-testid="week-banner" />,
}));
vi.mock('@infra/pages/AgendaPage/components/therapist/TherapistWeekRail', () => ({
  TherapistWeekRail: () => <div data-testid="week-rail" />,
}));
vi.mock('@infra/pages/AgendaPage/components/shared/AgendaTherapistSelector', () => ({
  AgendaTherapistSelector: () => <div data-testid="ther-selector" />,
}));

// The quick-edit modal's mutation hooks + toast are stubbed so the REAL modal
// renders without reaching the composition root.
vi.mock('@infra/hooks/useUpdateCitaNotas', () => ({
  useUpdateCitaNotas: (): unknown => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@infra/hooks/useChangeCitaEstado', () => ({
  useChangeCitaEstado: (): unknown => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { TherapistAgendaView } from '@infra/pages/AgendaPage/views/TherapistAgendaView';

// ── i18n + wrapper ──────────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda', 'common'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda, common: {} } },
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
  vi.clearAllMocks();
  dayAppointments = [makeAppt()];
  weekDays = [];
});

// ── helpers ───────────────────────────────────────────────────────────────────

const queryDialog = () => screen.queryByRole('dialog');
const getDialog = () => screen.getByRole('dialog');

// ════════════════════════════════════════════════════════════════════════════
// Mi Día → open
// ════════════════════════════════════════════════════════════════════════════

describe('TherapistAgendaView — Mi Día quick-edit open', () => {
  it('does not render the quick-edit modal initially', () => {
    render(<TherapistAgendaView />, { wrapper: Wrapper });
    expect(queryDialog()).not.toBeInTheDocument();
  });

  it('clicking a timeline cita card opens the quick-edit modal for that cita', () => {
    render(<TherapistAgendaView />, { wrapper: Wrapper });

    // The timeline card is a button labelled with the edit aria-label
    // ("{client} {start}–{end} — editar").
    fireEvent.click(screen.getByRole('button', { name: /Cliente Día.*editar/ }));

    // The real CitaQuickEditModal is now mounted (dialog + its title).
    expect(getDialog()).toBeInTheDocument();
    expect(screen.getByText('Edición rápida')).toBeInTheDocument();
    // The subtitle is interpolated from the clicked appointment.
    expect(screen.getByText('Cliente Día · 10:00–11:00')).toBeInTheDocument();
  });

  it('the opened modal shows the enabled completion toggle for a confirmada cita', () => {
    render(<TherapistAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Cliente Día.*editar/ }));
    // confirmada → the armed toggle is present and enabled.
    expect(screen.getByRole('button', { name: 'Marcar como completada' })).toBeEnabled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Mi Semana → open (and break guard)
// ════════════════════════════════════════════════════════════════════════════

describe('TherapistAgendaView — Mi semana quick-edit open', () => {
  it('switching to Mi semana and activating a mini-event opens the modal', () => {
    weekDays = [
      makeWeekDay({
        appointments: [makeAppt({ id: 777, clientName: 'Cliente Semana' })],
        citaCount: 1,
      }),
    ];
    render(<TherapistAgendaView />, { wrapper: Wrapper });

    // Switch to the week view (segmented control button "Mi semana").
    fireEvent.click(screen.getByRole('button', { name: 'Mi semana' }));

    // The mini-event is a role=button labelled "{client} · {start}–{end}".
    fireEvent.click(screen.getByRole('button', { name: 'Cliente Semana · 10:00–11:00' }));

    expect(getDialog()).toBeInTheDocument();
    expect(screen.getByText('Cliente Semana · 10:00–11:00')).toBeInTheDocument();
  });

  it('activating a BREAK mini-event does NOT open the modal (guarded)', () => {
    // A break row IS rendered by the grid (it is not a day-off), but
    // handleWeekApptClick refuses to open the modal for evtVariant === 'break'.
    weekDays = [
      makeWeekDay({
        appointments: [
          makeAppt({
            id: 888,
            clientName: 'Pausa',
            evtVariant: 'break',
            estado: 'completada',
          }),
        ],
        citaCount: 0,
      }),
    ];
    render(<TherapistAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Mi semana' }));

    // The break mini-event is present and clickable…
    fireEvent.click(screen.getByRole('button', { name: 'Pausa · 10:00–11:00' }));

    // …but no modal opens.
    expect(queryDialog()).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Día ↔ Semana toggle preserves "today" (bug-fix regression)
// ════════════════════════════════════════════════════════════════════════════
// This view has no Prev/Next/Today control — `activeDate` is now a plain
// `const activeDate = getTodayKey()` (was `useState`, removed as an unused
// setter once `handleModeChange`'s week-mode snap branch was deleted). The
// regression to guard: the SAME date must reach both data hooks on every
// render, mode switch included — no leftover state to silently drift.

describe('TherapistAgendaView — Día ↔ Semana toggle preserves the date', () => {
  it('renders without crashing across a Día → Semana → Día round trip', () => {
    render(<TherapistAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Mi semana' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mi día' }));
    // Back on Mi Día — the timeline card is visible again (no crash, no blank view).
    expect(screen.getByRole('button', { name: /Cliente Día.*editar/ })).toBeInTheDocument();
  });

  it('useTherapistAgendaData receives the SAME activeDate before and after switching to Semana and back', () => {
    render(<TherapistAgendaView />, { wrapper: Wrapper });
    const initialDate = mockUseTherapistAgendaDataFn.mock.calls.at(-1)?.[1];
    expect(initialDate).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Mi semana' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mi día' }));

    expect(mockUseTherapistAgendaDataFn.mock.calls.at(-1)?.[1]).toBe(initialDate);
  });

  it("useTherapistWeekData's weekStart is derived from the SAME date on every render (no drift after toggling)", () => {
    render(<TherapistAgendaView />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Mi semana' }));
    const firstWeekStart = mockUseTherapistWeekDataFn.mock.calls.at(-1)?.[1];

    fireEvent.click(screen.getByRole('button', { name: 'Mi día' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mi semana' }));
    const secondWeekStart = mockUseTherapistWeekDataFn.mock.calls.at(-1)?.[1];

    expect(secondWeekStart).toBe(firstWeekStart);
  });
});
