/**
 * AgendaCalendarOverlay.edge.test.tsx
 *
 * Edge-case / functional lens coverage for the Calendar overlay that the main
 * suite left as gaps: day-data error + retry (invalidates ['agenda']), week
 * navigation (prev / next / today re-scopes the week + kanban), hot loss of the
 * manage permission (unmounts the dialog), EN i18n parity at render time, and the
 * day-off "—" placeholder in the week strip.
 *
 * Mirrors the mock harness of AgendaCalendarOverlay.test.tsx. Added by the Tester
 * (functional/edge lens) — production code untouched.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import enAgenda from '@infra/i18n/locales/en/agenda.json';
import { getTodayKey, getWeekStart } from '@infra/utils/agenda.utils';
import type {
  IAgendaAppointment,
  IAgendaTherapist,
  IAgendaWeekDay,
} from '@domain/models/agenda.models';

// ── Mocks (same shape as the main overlay suite) ──────────────────────────────

const emptyDay = {
  therapists: [] as IAgendaTherapist[],
  appointments: [] as IAgendaAppointment[],
  unassignedAppointments: [] as IAgendaAppointment[],
  kpis: [],
  alerts: [],
  legendItems: [],
  adminCount: 0,
  isLoading: false,
  isError: false,
};
let dayDataReturn: typeof emptyDay = emptyDay;
const dayDataFn = vi.fn((..._args: unknown[]) => dayDataReturn);
vi.mock('@infra/hooks/useAdminAgendaData', () => ({
  useAdminAgendaData: (...a: unknown[]): typeof emptyDay => dayDataFn(...a),
}));

const emptyWeek = {
  weekDays: [] as IAgendaWeekDay[],
  therapists: [] as IAgendaTherapist[],
  colorMap: {} as Record<number, 'a' | 'b' | 'c' | 'd' | 'e' | 'f'>,
  isLoading: false,
  isError: false,
};
let weekDataReturn: typeof emptyWeek = emptyWeek;
const weekDataFn = vi.fn((..._args: unknown[]) => weekDataReturn);
vi.mock('@infra/hooks/useAdminWeekData', () => ({
  useAdminWeekData: (...a: unknown[]): typeof emptyWeek => weekDataFn(...a),
}));

let citaByIdReturn: { cita: { fechaHoraInicio: Date } | null; isLoading: boolean } = {
  cita: null,
  isLoading: false,
};
vi.mock('@infra/hooks/useCitaById', () => ({
  useCitaById: (): typeof citaByIdReturn => citaByIdReturn,
}));

vi.mock('@infra/components/ui/domain/modals', () => ({
  CitaModal: (props: {
    mode: string;
    citaId?: number;
    prefill?: { fecha?: string };
  }): ReactNode => (
    <div
      data-testid="cita-form"
      data-mode={props.mode}
      data-citaid={props.citaId ?? ''}
      data-fecha={props.prefill?.fecha ?? ''}
    />
  ),
}));

import { AgendaCalendarOverlay } from '@infra/pages/AgendaPage/components/admin/AgendaCalendarOverlay';
import type { IAgendaCalendarOverlayProps } from '@infra/pages/AgendaPage/components/admin/AgendaCalendarOverlay';

// ── i18n (both languages available; default es) ────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda }, en: { agenda: enAgenda } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <I18nextProvider i18n={testI18n}>
      <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

// ── Fixtures ───────────────────────────────────────────────────────────────────

const makeWeekDay = (overrides: Partial<IAgendaWeekDay> = {}): IAgendaWeekDay => ({
  dateStr: '2026-05-20',
  label: 'MIÉ',
  dateNumber: 20,
  appointments: [],
  isDayOff: false,
  citaCount: 0,
  isToday: false,
  ...overrides,
});

const SEVEN_WEEK_DAYS: IAgendaWeekDay[] = [
  makeWeekDay({ dateStr: '2026-05-18', label: 'LUN', dateNumber: 18, citaCount: 2 }),
  makeWeekDay({ dateStr: '2026-05-19', label: 'MAR', dateNumber: 19, citaCount: 0 }),
  makeWeekDay({ dateStr: '2026-05-20', label: 'MIÉ', dateNumber: 20, citaCount: 3 }),
  makeWeekDay({ dateStr: '2026-05-21', label: 'JUE', dateNumber: 21, citaCount: 0, isToday: true }),
  makeWeekDay({ dateStr: '2026-05-22', label: 'VIE', dateNumber: 22, citaCount: 1 }),
  makeWeekDay({
    dateStr: '2026-05-23',
    label: 'SÁB',
    dateNumber: 23,
    citaCount: 0,
    isDayOff: true,
  }),
  makeWeekDay({
    dateStr: '2026-05-24',
    label: 'DOM',
    dateNumber: 24,
    citaCount: 0,
    isDayOff: true,
  }),
];

const baseProps: IAgendaCalendarOverlayProps = {
  open: true,
  mode: 'create',
  centroId: 1,
  centroName: 'Centro Madrid',
  initialDate: '2026-05-20',
  canManage: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

function renderOverlay(overrides: Partial<IAgendaCalendarOverlayProps> = {}) {
  const props = { ...baseProps, onClose: vi.fn(), onSuccess: vi.fn(), ...overrides };
  return render(<AgendaCalendarOverlay {...props} />, { wrapper: Wrapper });
}

/** Reads the `date` (2nd arg) of the most recent useAdminAgendaData call. */
function lastDayDate(): string | undefined {
  return dayDataFn.mock.calls.at(-1)?.[1] as string | undefined;
}
/** Reads the `weekStart` (2nd arg) of the most recent useAdminWeekData call. */
function lastWeekStart(): string | undefined {
  return weekDataFn.mock.calls.at(-1)?.[1] as string | undefined;
}

beforeEach(async () => {
  dayDataReturn = emptyDay;
  weekDataReturn = { ...emptyWeek, weekDays: SEVEN_WEEK_DAYS, colorMap: {} };
  citaByIdReturn = { cita: null, isLoading: false };
  vi.clearAllMocks();
  await testI18n.changeLanguage('es');
});

// ── TC-N2: day-data error + retry ──────────────────────────────────────────────

describe('AgendaCalendarOverlay — day error state (TC-N2)', () => {
  it('renders a localised error alert with a retry that invalidates ["agenda"]', () => {
    dayDataReturn = { ...emptyDay, isError: true };
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    renderOverlay();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No se pudieron cargar las citas');

    const retry = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retry);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agenda'] });

    invalidateSpy.mockRestore();
  });
});

// ── TC-B5: week navigation (prev / next / today) ────────────────────────────────

describe('AgendaCalendarOverlay — week navigation (TC-B5)', () => {
  it('prev week steps the day and re-requests the previous week', () => {
    renderOverlay();
    expect(lastDayDate()).toBe('2026-05-20');
    expect(lastWeekStart()).toBe('2026-05-18'); // Monday of the opening week

    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));

    expect(lastDayDate()).toBe('2026-05-13'); // -7 days
    expect(lastWeekStart()).toBe(getWeekStart('2026-05-13')); // 2026-05-11
  });

  it('next week steps forward one week', () => {
    renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    expect(lastDayDate()).toBe('2026-05-27'); // +7 days
    expect(lastWeekStart()).toBe(getWeekStart('2026-05-27'));
  });

  it('Hoy jumps the active day back to today', () => {
    renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    expect(lastDayDate()).toBe('2026-05-27');

    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(lastDayDate()).toBe(getTodayKey());
  });

  it('edit mode: navigating the week never rewrites the cita date in the form', () => {
    citaByIdReturn = {
      cita: { fechaHoraInicio: new Date('2026-05-22T10:00:00') },
      isLoading: false,
    };
    renderOverlay({ mode: 'edit', citaId: 99 });
    // repositioned to the cita's day
    expect(lastDayDate()).toBe('2026-05-22');

    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
    // kanban re-scopes...
    expect(lastDayDate()).toBe('2026-05-15');
    // ...but the form stays in edit for the same cita (date owned by CitaModal)
    const form = screen.getByTestId('cita-form');
    expect(form).toHaveAttribute('data-mode', 'edit');
    expect(form).toHaveAttribute('data-citaid', '99');
  });
});

// ── TC-N3: hot loss of the manage permission ────────────────────────────────────

describe('AgendaCalendarOverlay — permission lost while open (TC-N3)', () => {
  it('unmounts the dialog when canManage flips to false with the overlay open', () => {
    const { rerender } = renderOverlay({ canManage: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<AgendaCalendarOverlay {...baseProps} canManage={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('notifies the parent (onClose) when the permission is lost — defense in depth', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <AgendaCalendarOverlay {...baseProps} canManage onClose={onClose} />,
      { wrapper: Wrapper },
    );
    expect(onClose).not.toHaveBeenCalled();

    // hiding the surface (return null) is not enough: the parent still holds the
    // modal open in its state, so the overlay must actively call onClose.
    rerender(<AgendaCalendarOverlay {...baseProps} canManage={false} onClose={onClose} />);
    expect(onClose).toHaveBeenCalled();
  });
});

// ── Local overlayDate is discarded on close (reopen is a fresh copy) ────────────

describe('AgendaCalendarOverlay — overlayDate discarded on close (TC-B6)', () => {
  it('does not persist the picked day across an unmount; reopen honours the new initialDate', () => {
    const Harness = ({ open, initialDate }: { open: boolean; initialDate: string }) =>
      open ? (
        <AgendaCalendarOverlay
          {...baseProps}
          open
          initialDate={initialDate}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      ) : null;

    const { rerender } = render(<Harness open initialDate="2026-05-20" />, { wrapper: Wrapper });
    // user re-scopes to Friday, then the overlay closes (unmount)
    fireEvent.click(screen.getByRole('button', { name: 'VIE 22, 1 cita' }));
    expect(lastDayDate()).toBe('2026-05-22');
    rerender(<Harness open={false} initialDate="2026-05-20" />);

    // reopened on a different background day → the stale local selection is gone
    rerender(<Harness open initialDate="2026-06-10" />);
    expect(lastDayDate()).toBe('2026-06-10');
  });
});

// ── TC-B2: day-off "—" placeholder in the week strip ────────────────────────────

describe('AgendaCalendarOverlay — day-off week cell (TC-B2)', () => {
  it('shows "—" for an empty day-off cell but keeps the count in its accessible name', () => {
    renderOverlay();
    // SÁB 23 is isDayOff + citaCount 0 → visual "—" but a11y still reads "Sin citas"
    const sat = screen.getByRole('button', { name: 'SÁB 23, Sin citas' });
    expect(sat).toHaveTextContent('—');
    // A non-day-off empty day keeps the numeric count cell visible (no dash)
    const tue = screen.getByRole('button', { name: 'MAR 19, Sin citas' });
    expect(tue).not.toHaveTextContent('—');
  });
});

// ── TC-AC9-en: EN parity at render ─────────────────────────────────────────────

describe('AgendaCalendarOverlay — English render parity (TC-AC9-en)', () => {
  it('renders overlay chrome in English when lng=en', async () => {
    await testI18n.changeLanguage('en');
    dayDataReturn = { ...emptyDay, appointments: [] };

    renderOverlay();

    expect(screen.getByRole('heading', { name: 'New appointment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Week view' })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Appointments for the selected day' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Unassigned' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Assigned' })).toBeInTheDocument();
    // pluralised count in EN
    expect(screen.getByRole('button', { name: 'MIÉ 20, 3 appointments' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VIE 22, 1 appointment' })).toBeInTheDocument();
  });
});
