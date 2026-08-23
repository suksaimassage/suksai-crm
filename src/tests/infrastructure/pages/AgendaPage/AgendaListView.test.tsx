/**
 * AgendaListView.test.tsx
 *
 * Component tests for AgendaListView after the week-scoped rework (list mode is
 * no longer day-scoped — it renders one group PER NON-EMPTY DAY of the active
 * week, sourced from the same `filteredWeekDays` the Week grid consumes).
 *
 * Prop-shape change: `appointments: readonly IAgendaAppointment[]` +
 * `activeDate: string` → `weekDays: readonly IAgendaWeekDay[]`. The component no
 * longer derives its own day label/number (no more hand-rolled DOW_SHORT dict) —
 * each day's `label`/`dateNumber`/`isToday` come straight from the fixture.
 *
 * Mock strategy:
 *   - AgendaCitaDetailPopover is stubbed to a lightweight marker so these tests
 *     stay focused on the LIST's behaviour (rendering, sort, activation, a11y,
 *     selection wiring). The real popover has its own dedicated test and pulls
 *     in Popover + useCitaById, which are irrelevant to list semantics.
 *   - i18n: real agenda namespace (estado.*, list.empty, a11y.eventLabel keys).
 *   - fireEvent for interactions: this repo does not depend on
 *     @testing-library/user-event (not installed); fireEvent is the established
 *     convention across the existing suite. Key events use {key} so the
 *     component's Enter/Space handlers are exercised faithfully.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaAppointment, IAgendaWeekDay } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';

// ── Stub the detail popover (focus tests on the list, not the popover) ─────────
vi.mock('@infra/pages/AgendaPage/components/admin/AgendaCitaDetailPopover', () => ({
  AgendaCitaDetailPopover: ({
    children,
    appointment,
  }: {
    children: ReactNode;
    appointment: IAgendaAppointment;
  }) => (
    <div data-testid="detail-popover" data-cita={appointment.id}>
      {children}
    </div>
  ),
}));

import { AgendaListView } from '@infra/pages/AgendaPage/components/admin/AgendaListView';

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
  clientName: 'Cliente Test',
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

/** A full Mon–Sun week, all empty by default — override per test. */
function fullWeek(overrides: Partial<Record<string, Partial<IAgendaWeekDay>>> = {}) {
  const base: readonly [string, string, number][] = [
    ['2026-05-18', 'LUN', 18],
    ['2026-05-19', 'MAR', 19],
    ['2026-05-20', 'MIÉ', 20],
    ['2026-05-21', 'JUE', 21],
    ['2026-05-22', 'VIE', 22],
    ['2026-05-23', 'SÁB', 23],
    ['2026-05-24', 'DOM', 24],
  ];
  return base.map(([dateStr, label, dateNumber]) =>
    makeWeekDay({ dateStr, label, dateNumber, ...overrides[dateStr] }),
  );
}

/** Default props for the new weekDays contract; override per test. */
function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaListView>> = {}) {
  return {
    weekDays: fullWeek() as readonly IAgendaWeekDay[],
    selectedId: null as TCitaId | null,
    optimisticId: null as TCitaId | null,
    canManage: true,
    actionPending: false,
    centroName: 'Centro Madrid',
    onActivate: vi.fn(),
    onDetailOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    onChangeEstado: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

// ── Empty state ───────────────────────────────────────────────────────────────

describe('AgendaListView — empty state', () => {
  it('shows "Sin citas esta semana" when every day of the week is empty', () => {
    render(<AgendaListView {...baseProps({ weekDays: fullWeek() })} />, { wrapper: Wrapper });
    expect(screen.getByText('Sin citas esta semana')).toBeInTheDocument();
  });

  it('renders no role=button rows when the whole week is empty', () => {
    render(<AgendaListView {...baseProps({ weekDays: fullWeek() })} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does NOT show the empty state when at least one day has appointments', () => {
    const weekDays = fullWeek({
      '2026-05-19': { appointments: [makeAppt()], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.queryByText('Sin citas esta semana')).not.toBeInTheDocument();
  });
});

// ── Container accessibility ─────────────────────────────────────────────────────

describe('AgendaListView — container accessibility', () => {
  it('container has aria-label="Lista de citas"', () => {
    render(<AgendaListView {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Lista de citas')).toBeInTheDocument();
  });
});

// ── Week-scoped day grouping ────────────────────────────────────────────────────

describe('AgendaListView — week-scoped day grouping', () => {
  it("renders one day-group PER NON-EMPTY day, using that day's own label/dateNumber", () => {
    const weekDays = fullWeek({
      '2026-05-19': { appointments: [makeAppt({ id: 1 })], citaCount: 1 },
      '2026-05-22': { appointments: [makeAppt({ id: 2 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getByText('MAR')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('VIE')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('a day with 0 appointments is skipped entirely (no day-group rendered for it)', () => {
    const weekDays = fullWeek({
      '2026-05-19': { appointments: [makeAppt({ id: 1 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    // MAR (the only non-empty day) is present…
    expect(screen.getByText('MAR')).toBeInTheDocument();
    // …but LUN (day 18, empty) is not rendered as a group label.
    expect(screen.queryByText('LUN')).not.toBeInTheDocument();
    expect(screen.queryByText('18')).not.toBeInTheDocument();
  });

  it('renders day-groups for EVERY non-empty day when multiple days have citas', () => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 1 })], citaCount: 1 },
      '2026-05-19': { appointments: [makeAppt({ id: 2 })], citaCount: 1 },
      '2026-05-24': { appointments: [makeAppt({ id: 3 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('marks the today day-group number via $isToday from the fixture (not derived internally)', () => {
    const weekDays = fullWeek({
      '2026-05-20': { appointments: [makeAppt({ id: 1 })], citaCount: 1, isToday: true },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('an appointment with therapistId=null (unassigned) still renders in the list', () => {
    const unassigned = makeAppt({
      id: 42,
      therapistId: null,
      clientName: null,
      sala: null,
      salaId: null,
    });
    const weekDays = fullWeek({
      '2026-05-21': { appointments: [unassigned], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    // clientName null → placeholder "—"; the row is still a fully-formed button.
    expect(
      screen.getByRole('button', { name: '— · 10:00–11:00 · Masaje Test · Confirmada' }),
    ).toBeInTheDocument();
  });
});

// ── Appointment rendering ──────────────────────────────────────────────────────

describe('AgendaListView — appointment rendering', () => {
  it('renders each row as role="button" with the full a11y label (client · time · service · estado)', () => {
    const appt = makeAppt({
      id: 1,
      clientName: 'Juan Pérez',
      startTime: '10:00',
      endTime: '11:00',
      serviceName: 'Masaje',
      estado: 'confirmada',
    });
    const weekDays = fullWeek({ '2026-05-18': { appointments: [appt], citaCount: 1 } });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(
      screen.getByRole('button', { name: 'Juan Pérez · 10:00–11:00 · Masaje · Confirmada' }),
    ).toBeInTheDocument();
  });

  it('shows the clientName and serviceName for each appointment', () => {
    const appts = [
      makeAppt({ id: 1, clientName: 'Cliente A', serviceName: 'Masaje Thai' }),
      makeAppt({ id: 2, clientName: 'Cliente B', serviceName: 'Reflexología' }),
    ];
    const weekDays = fullWeek({ '2026-05-18': { appointments: appts, citaCount: 2 } });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
    expect(screen.getByText('Reflexología')).toBeInTheDocument();
  });

  it('shows the sala name for each appointment', () => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ sala: 'Sala Loto' })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getByText('Sala Loto')).toBeInTheDocument();
  });

  it('each row exposes aria-haspopup="dialog" and aria-expanded=false when not selected', () => {
    const weekDays = fullWeek({ '2026-05-18': { appointments: [makeAppt()], citaCount: 1 } });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    const row = screen.getByRole('button');
    expect(row).toHaveAttribute('aria-haspopup', 'dialog');
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });
});

// ── Estado badge: label + non-color glyph (WCAG 1.4.1) ─────────────────────────

describe('AgendaListView — estado label + glyph (status not color-only)', () => {
  it.each([
    ['confirmada', 'Confirmada', '✓'],
    ['pendiente', 'Por confirmar', '⏳'],
    ['en_curso', 'En curso', '▶'],
    ['completada', 'Completada', '✓✓'],
    ['cancelada', 'Cancelada', '✕'],
    ['no_presentado', 'No presentado', '⊘'],
  ] as const)('estado=%s renders text "%s" and glyph "%s"', (estado, label, glyph) => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ estado })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(glyph)).toBeInTheDocument();
  });

  it('the estado glyph is aria-hidden (meaning lives in the text + aria-label)', () => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ estado: 'cancelada' })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.getByText('✕')).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── Sort order ─────────────────────────────────────────────────────────────────

describe('AgendaListView — sort order', () => {
  it('sorts rows WITHIN a day by startTime ascending regardless of input order', () => {
    const appts = [
      makeAppt({ id: 1, startTime: '14:00', endTime: '15:00', clientName: 'Last' }),
      makeAppt({ id: 2, startTime: '09:00', endTime: '10:00', clientName: 'First' }),
      makeAppt({ id: 3, startTime: '11:00', endTime: '12:00', clientName: 'Middle' }),
    ];
    const weekDays = fullWeek({ '2026-05-18': { appointments: appts, citaCount: 3 } });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('First'));
    expect(buttons[1]).toHaveAttribute('aria-label', expect.stringContaining('Middle'));
    expect(buttons[2]).toHaveAttribute('aria-label', expect.stringContaining('Last'));
  });

  it('sorts EACH day independently — a later day is not merged/reordered with an earlier one', () => {
    const weekDays = fullWeek({
      '2026-05-18': {
        appointments: [
          makeAppt({ id: 1, startTime: '16:00', endTime: '17:00', clientName: 'Mon' }),
        ],
        citaCount: 1,
      },
      '2026-05-19': {
        appointments: [
          makeAppt({ id: 2, startTime: '08:00', endTime: '09:00', clientName: 'Tue' }),
        ],
        citaCount: 1,
      },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    // Days render in weekDays array order (Mon before Tue), NOT by startTime
    // across the whole week — the Monday 16:00 row still precedes Tuesday 08:00.
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('Mon'));
    expect(buttons[1]).toHaveAttribute('aria-label', expect.stringContaining('Tue'));
  });
});

// ── Activation (click + keyboard) ──────────────────────────────────────────────

describe('AgendaListView — activation', () => {
  it('clicking a row calls onActivate with the cita id', () => {
    const onActivate = vi.fn();
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 77 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays, onActivate })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalledWith(77);
  });

  it('pressing Enter on a row calls onActivate', () => {
    const onActivate = vi.fn();
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 77 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays, onActivate })} />, { wrapper: Wrapper });
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledWith(77);
  });

  it('pressing Space on a row calls onActivate', () => {
    const onActivate = vi.fn();
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 88 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays, onActivate })} />, { wrapper: Wrapper });
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onActivate).toHaveBeenCalledWith(88);
  });

  it('other keys (e.g. Tab) do NOT trigger activation', () => {
    const onActivate = vi.fn();
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 99 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays, onActivate })} />, { wrapper: Wrapper });
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    expect(onActivate).not.toHaveBeenCalled();
  });
});

// ── Selection → detail popover wiring ──────────────────────────────────────────

describe('AgendaListView — selection', () => {
  it('wraps the selected row in the detail popover and marks aria-expanded=true', () => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 5 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays, selectedId: 5 })} />, { wrapper: Wrapper });
    const popover = screen.getByTestId('detail-popover');
    expect(popover).toHaveAttribute('data-cita', '5');
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('does NOT render the detail popover when nothing is selected', () => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 5 })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays })} />, { wrapper: Wrapper });
    expect(screen.queryByTestId('detail-popover')).not.toBeInTheDocument();
  });

  it('only the matching row is wrapped when one of several is selected', () => {
    const appts = [makeAppt({ id: 1 }), makeAppt({ id: 2 }), makeAppt({ id: 3 })];
    const weekDays = fullWeek({ '2026-05-18': { appointments: appts, citaCount: 3 } });
    render(<AgendaListView {...baseProps({ weekDays, selectedId: 2 })} />, { wrapper: Wrapper });
    const popovers = screen.getAllByTestId('detail-popover');
    expect(popovers).toHaveLength(1);
    expect(popovers[0]).toHaveAttribute('data-cita', '2');
  });

  it('a selection on one day does not wrap a same-id-less row on another day', () => {
    const weekDays = fullWeek({
      '2026-05-18': { appointments: [makeAppt({ id: 1, clientName: 'Mon' })], citaCount: 1 },
      '2026-05-19': { appointments: [makeAppt({ id: 2, clientName: 'Tue' })], citaCount: 1 },
    });
    render(<AgendaListView {...baseProps({ weekDays, selectedId: 2 })} />, { wrapper: Wrapper });
    const popover = screen.getByTestId('detail-popover');
    expect(within(popover).getByText('Tue')).toBeInTheDocument();
  });
});
