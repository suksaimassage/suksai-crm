/**
 * TherapistWeekRail.test.tsx
 *
 * Component tests for TherapistWeekRail.
 * Mock strategy:
 *   - Purely prop-driven; no external hooks.
 *   - i18n: agenda namespace required (therapist.week.rail* keys).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { TherapistWeekRail } from '@infra/pages/AgendaPage/components/therapist/TherapistWeekRail';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type {
  IAgendaTherapistWeekDay,
  IAgendaWeekBalance,
  IAgendaAppointment,
} from '@domain/models/agenda.models';

// ── i18n setup ────────────────────────────────────────────────────────────────

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
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Test Client',
  visitInfo: null,
  serviceName: 'Masaje Test',
  sala: 'Sala 1',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'pending',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 60,
  ...overrides,
});

const makeDay = (overrides: Partial<IAgendaTherapistWeekDay> = {}): IAgendaTherapistWeekDay => ({
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
});

const BASE_BALANCE: IAgendaWeekBalance = {
  citasTotal: 5,
  citasCompletadas: 3,
  horasEnSala: 4.5,
  propinas: 0,
  valoracionMedia: 4.7,
  weekLabel: '18 may – 24 may',
};

// Days for upcoming tests
const PAST_DAY = makeDay({
  dateStr: '2026-05-18',
  label: 'LUN',
  dateNumber: 18,
  isPast: true,
  appointments: [makeAppt({ id: 1, timelineState: 'done' })],
});
const TODAY_DAY = makeDay({
  dateStr: '2026-05-20',
  label: 'MIÉ',
  dateNumber: 20,
  isToday: true,
  isPast: false,
  appointments: [makeAppt({ id: 2, timelineState: 'now', serviceName: 'Thai Now' })],
  citaCount: 1,
});
const FUTURE_DAY = makeDay({
  dateStr: '2026-05-21',
  label: 'JUE',
  dateNumber: 21,
  isPast: false,
  appointments: [makeAppt({ id: 3, timelineState: 'pending', serviceName: 'Thai Pending' })],
  citaCount: 1,
});
const EMPTY_DAY = makeDay({ dateStr: '2026-05-22', label: 'VIE', dateNumber: 22, isPast: false });

// ── Card titles ───────────────────────────────────────────────────────────────

describe('TherapistWeekRail — card titles', () => {
  it('renders "Tu balance" card title', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Tu balance')).toBeInTheDocument();
  });

  it('renders "Por venir" card title', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Por venir')).toBeInTheDocument();
  });

  it('renders "Esta semana" card title', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Esta semana')).toBeInTheDocument();
  });
});

// ── Balance card ──────────────────────────────────────────────────────────────

describe('TherapistWeekRail — balance card', () => {
  it('shows citasTotal from balance', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows citasCompletadas from balance', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows formatted horasEnSala', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('4h 30m')).toBeInTheDocument();
  });

  it('shows valoracionMedia.toFixed(1) when > 0', () => {
    render(<TherapistWeekRail weekDays={[]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('4.7')).toBeInTheDocument();
  });

  it('does not show valoracion stat when valoracionMedia === 0', () => {
    const noVal: IAgendaWeekBalance = { ...BASE_BALANCE, valoracionMedia: 0 };
    render(<TherapistWeekRail weekDays={[]} balance={noVal} />, { wrapper: Wrapper });
    expect(screen.queryByText('Valoración')).not.toBeInTheDocument();
  });
});

// ── Upcoming card ─────────────────────────────────────────────────────────────

describe('TherapistWeekRail — upcoming card', () => {
  it('shows "Sin citas" when no upcoming appointments', () => {
    render(<TherapistWeekRail weekDays={[PAST_DAY]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Sin citas')).toBeInTheDocument();
  });

  it('shows upcoming appointments from today and future days (timelineState pending/now)', () => {
    render(
      <TherapistWeekRail weekDays={[PAST_DAY, TODAY_DAY, FUTURE_DAY]} balance={BASE_BALANCE} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Thai Now')).toBeInTheDocument();
    expect(screen.getByText('Thai Pending')).toBeInTheDocument();
  });

  it('does not show past appointments (isPast=true) in upcoming list', () => {
    render(<TherapistWeekRail weekDays={[PAST_DAY, FUTURE_DAY]} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    // past day's appointment has timelineState='done' and isPast=true — excluded
    // Future day's appointment has timelineState='pending' and isPast=false — shown
    expect(screen.getByText('Thai Pending')).toBeInTheDocument();
    expect(screen.queryByText('Test Client')).not.toBeInTheDocument();
  });

  it('shows max 5 items when there are more than 5 pending appointments', () => {
    // Create 7 future days each with 1 pending appointment
    const manyDays = Array.from({ length: 7 }, (_, i) =>
      makeDay({
        dateStr: `2026-05-2${i}`,
        label: 'LUN',
        dateNumber: 20 + i,
        isPast: false,
        appointments: [
          makeAppt({ id: 100 + i, timelineState: 'pending', serviceName: `Masaje ${i}` }),
        ],
        citaCount: 1,
      }),
    );
    render(<TherapistWeekRail weekDays={manyDays} balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    // Only 5 services shown in upcoming section
    const shownItems = screen.getAllByText(/Masaje \d/);
    expect(shownItems).toHaveLength(5);
  });
});

// ── This-week card ────────────────────────────────────────────────────────────

describe('TherapistWeekRail — this-week summary card', () => {
  it('shows per-day labels in this-week card', () => {
    render(
      <TherapistWeekRail weekDays={[PAST_DAY, FUTURE_DAY, EMPTY_DAY]} balance={BASE_BALANCE} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('LUN 18')).toBeInTheDocument();
    expect(screen.getByText('JUE 21')).toBeInTheDocument();
    expect(screen.getByText('VIE 22')).toBeInTheDocument();
  });
});
