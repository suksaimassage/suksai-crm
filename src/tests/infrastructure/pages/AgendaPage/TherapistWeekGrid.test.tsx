/**
 * TherapistWeekGrid.test.tsx
 *
 * Component tests for TherapistWeekGrid.
 * Mock strategy:
 *   - Purely prop-driven; no external hooks.
 *   - i18n: agenda namespace required (therapist.week.libranza key).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { TherapistWeekGrid } from '@infra/pages/AgendaPage/components/therapist/TherapistWeekGrid';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaTherapistWeekDay, IAgendaAppointment } from '@domain/models/agenda.models';

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
  timelineState: 'done',
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

const NORMAL_DAY = makeDay({
  dateStr: '2026-05-18',
  label: 'LUN',
  dateNumber: 18,
  appointments: [
    makeAppt({ id: 1, clientName: 'Cliente LUN', startTime: '10:00', endTime: '11:00' }),
  ],
  citaCount: 1,
});

const LIBRANZA_DAY = makeDay({
  dateStr: '2026-05-19',
  label: 'MAR',
  dateNumber: 19,
  isLibranza: true,
  appointments: [],
  citaCount: 0,
});

const TODAY_DAY = makeDay({
  dateStr: '2026-05-20',
  label: 'MIÉ',
  dateNumber: 20,
  isToday: true,
  appointments: [
    makeAppt({ id: 2, clientName: 'Cliente HOY', startTime: '11:00', endTime: '12:00' }),
  ],
  citaCount: 1,
});

const NO_CITAS_DAY = makeDay({
  dateStr: '2026-05-21',
  label: 'JUE',
  dateNumber: 21,
  citaCount: 0,
});

// ── Container ─────────────────────────────────────────────────────────────────

describe('TherapistWeekGrid — container', () => {
  it('has aria-label="Mi semana"', () => {
    render(<TherapistWeekGrid weekDays={[NORMAL_DAY]} />, { wrapper: Wrapper });
    // Container aria-label = t('therapist.myWeek') = "Mi semana"
    expect(screen.getByLabelText('Mi semana')).toBeInTheDocument();
  });
});

// ── Time header ───────────────────────────────────────────────────────────────

describe('TherapistWeekGrid — time header', () => {
  it('time row is aria-hidden="true"', () => {
    const { container } = render(<TherapistWeekGrid weekDays={[NORMAL_DAY]} />, {
      wrapper: Wrapper,
    });
    const hiddenEl = container.querySelector('[aria-hidden="true"]');
    expect(hiddenEl).toBeInTheDocument();
  });
});

// ── Swimlane rows ─────────────────────────────────────────────────────────────

describe('TherapistWeekGrid — swimlane rows', () => {
  it('renders row label with day.label', () => {
    render(<TherapistWeekGrid weekDays={[NORMAL_DAY]} />, { wrapper: Wrapper });
    expect(screen.getByText('LUN')).toBeInTheDocument();
  });

  it('renders row label with day.dateNumber', () => {
    render(<TherapistWeekGrid weekDays={[NORMAL_DAY]} />, { wrapper: Wrapper });
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders cita count in the meta row when citaCount > 0', () => {
    render(<TherapistWeekGrid weekDays={[NORMAL_DAY]} />, { wrapper: Wrapper });
    // Meta row = t('therapist.week.rowCitas', { count }) = "{{count}} citas"
    expect(screen.getByText('1 citas')).toBeInTheDocument();
  });

  it('does not render cita count badge when citaCount === 0', () => {
    render(<TherapistWeekGrid weekDays={[NO_CITAS_DAY]} />, { wrapper: Wrapper });
    // No standalone count badge — meta reads "0 citas", so a bare "0" is absent
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders one row per weekDay', () => {
    const days = [NORMAL_DAY, LIBRANZA_DAY, NO_CITAS_DAY];
    render(<TherapistWeekGrid weekDays={days} />, { wrapper: Wrapper });
    expect(screen.getByText('LUN')).toBeInTheDocument();
    expect(screen.getByText('MAR')).toBeInTheDocument();
    expect(screen.getByText('JUE')).toBeInTheDocument();
  });
});

// ── Appointment mini events ───────────────────────────────────────────────────

describe('TherapistWeekGrid — appointment mini events', () => {
  it('appointment has role="button" with correct aria-label', () => {
    render(<TherapistWeekGrid weekDays={[NORMAL_DAY]} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Cliente LUN · 10:00–11:00' })).toBeInTheDocument();
  });

  it('renders multiple appointments across multiple days', () => {
    render(<TherapistWeekGrid weekDays={[NORMAL_DAY, TODAY_DAY]} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Cliente LUN · 10:00–11:00' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cliente HOY · 11:00–12:00' })).toBeInTheDocument();
  });
});

// ── Libranza row ──────────────────────────────────────────────────────────────

describe('TherapistWeekGrid — libranza row', () => {
  it('shows "Libranza - estudio cerrado" text for isLibranza days', () => {
    render(<TherapistWeekGrid weekDays={[LIBRANZA_DAY]} />, { wrapper: Wrapper });
    // Day-off label over the hatch = t('therapist.week.sundayLabel')
    expect(screen.getByText('Libranza - estudio cerrado')).toBeInTheDocument();
  });

  it('does not render appointment events on libranza day', () => {
    render(<TherapistWeekGrid weekDays={[LIBRANZA_DAY]} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ── Today row ─────────────────────────────────────────────────────────────────

describe('TherapistWeekGrid — today row', () => {
  it('renders today row without error', () => {
    const { container } = render(<TherapistWeekGrid weekDays={[TODAY_DAY]} />, {
      wrapper: Wrapper,
    });
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('TherapistWeekGrid — edge cases', () => {
  it('renders without error when weekDays is empty', () => {
    const { container } = render(<TherapistWeekGrid weekDays={[]} />, { wrapper: Wrapper });
    expect(container.firstChild).toBeInTheDocument();
  });
});
