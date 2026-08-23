/**
 * AgendaWeekGrid.test.tsx
 *
 * Component tests for AgendaWeekGrid.
 * Mock strategy:
 *   - Purely prop-driven component — no hooks to mock.
 *   - i18n: requires agenda namespace (uses useTranslation('agenda')).
 *   - Date is NOT mocked globally; NowLine rendering is exercised through
 *     the isToday flag on weekDay fixtures combined with actual time range.
 *
 * IMPORTANT — day headers are now interactive (`role="button"`, day-navigation
 * feature): every bare `getAllByRole('button')` / `queryByRole('button')` query
 * that used to assume "every button is an appointment/cluster block" now ALSO
 * matches the 7 day-header buttons. Appointment/cluster/folder buttons are the
 * only ones carrying `aria-haspopup="dialog"` — day headers do not — so that
 * attribute is the disambiguator used below via `getOccupiedButtons()`.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { AgendaWeekGrid } from '@infra/pages/AgendaPage/components/admin/AgendaWeekGrid';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type {
  IAgendaWeekDay,
  IAgendaTherapist,
  IAgendaAppointment,
  TTherapistColorMap,
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
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 60,
  ...overrides,
});

const APPT_60MIN = makeAppt({ id: 1, durationMin: 60 });
// durationToHeight(24, 60) = 48px — exactly at the boundary → should show service
const APPT_24MIN = makeAppt({ id: 2, durationMin: 24, startTime: '11:00', endTime: '11:24' });
// durationToHeight(23, 60) = 46px — below 48px threshold → should NOT show service
const APPT_23MIN = makeAppt({
  id: 3,
  durationMin: 23,
  startTime: '11:00',
  endTime: '11:23',
  serviceName: 'Servicio Corto',
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

const THERAPIST_1: IAgendaTherapist = {
  id: 10,
  nombre: 'Naree',
  apellidos: 'Test',
  initials: 'NT',
  sala: 'Sala 1',
  appointmentCount: 1,
  isActive: true,
  isAvailableOnDate: true,
};

const THERAPIST_2: IAgendaTherapist = {
  id: 11,
  nombre: 'Som',
  apellidos: 'Test',
  initials: 'ST',
  sala: 'Sala 2',
  appointmentCount: 0,
  isActive: true,
  isAvailableOnDate: true,
};

const COLOR_MAP: TTherapistColorMap = { 10: 'a', 11: 'b' };

/**
 * Default no-op props for the interactive handlers — keeps test renders minimal.
 *
 * `rescheduleBusy` + `onRescheduleDrop` are the two props added by the Surface A
 * drag & drop feature. `onCreateAtSlot` (double-click empty cell) and
 * `onDayHeaderClick` (day-navigation) are two more required props added since.
 * The grid now REQUIRES all of these, so they must be present here for the file
 * to typecheck (and for the existing cases to keep compiling).
 */
const DEFAULT_INTERACTIVE_PROPS = {
  selectedId: null,
  openClusterKey: null,
  optimisticId: null,
  canManage: true,
  actionPending: false,
  rescheduleBusy: false,
  centroName: 'Centro Test',
  onActivate: vi.fn(),
  onDetailOpenChange: vi.fn(),
  onClusterOpenChange: vi.fn(),
  onConfirm: vi.fn(),
  onChangeEstado: vi.fn(),
  onEdit: vi.fn(),
  onCancel: vi.fn(),
  onRescheduleDrop: vi.fn(),
  onCreateAtSlot: vi.fn(),
  onDayHeaderClick: vi.fn(),
} as const;

/**
 * Appointment/cluster ("folder") buttons are the only role=button elements that
 * carry `aria-haspopup="dialog"` — day-header buttons do not. Use this instead
 * of a bare `getAllByRole('button')` whenever a test cares about the COUNT of
 * occupied-slot blocks, so the 7 day-header buttons never inflate the count.
 */
function getOccupiedButtons(): HTMLElement[] {
  return screen
    .getAllByRole('button')
    .filter((btn) => btn.getAttribute('aria-haspopup') === 'dialog');
}
function queryOccupiedButtons(): HTMLElement[] {
  return screen
    .queryAllByRole('button')
    .filter((btn) => btn.getAttribute('aria-haspopup') === 'dialog');
}

const WEEK_DAYS: readonly IAgendaWeekDay[] = [
  makeWeekDay({
    dateStr: '2026-05-18',
    label: 'LUN',
    dateNumber: 18,
    appointments: [APPT_60MIN],
    citaCount: 1,
  }),
  makeWeekDay({ dateStr: '2026-05-19', label: 'MAR', dateNumber: 19 }),
  makeWeekDay({ dateStr: '2026-05-20', label: 'MIÉ', dateNumber: 20, isToday: true }),
  makeWeekDay({ dateStr: '2026-05-21', label: 'JUE', dateNumber: 21 }),
  makeWeekDay({ dateStr: '2026-05-22', label: 'VIE', dateNumber: 22 }),
  makeWeekDay({ dateStr: '2026-05-23', label: 'SÁB', dateNumber: 23 }),
  makeWeekDay({ dateStr: '2026-05-24', label: 'DOM', dateNumber: 24 }),
];

// ── Day header rendering ──────────────────────────────────────────────────────

describe('AgendaWeekGrid — day headers', () => {
  it('renders day labels for each weekDay', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('LUN')).toBeInTheDocument();
    expect(screen.getByText('MAR')).toBeInTheDocument();
    expect(screen.getByText('DOM')).toBeInTheDocument();
  });

  it('renders dateNumber for each weekDay', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('shows cita count text when citaCount > 0', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('1 cita')).toBeInTheDocument();
  });

  it('does not show cita count number for days with 0 citas', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // Days with citaCount=0 render a space character — no "0 citas" text
    expect(screen.queryByText('0 citas')).not.toBeInTheDocument();
  });
});

// ── Hour labels ───────────────────────────────────────────────────────────────

describe('AgendaWeekGrid — hour labels column', () => {
  it('hour labels column has aria-hidden="true"', () => {
    const { container } = render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    const hiddenCol = container.querySelector('[aria-hidden="true"]');
    expect(hiddenCol).toBeInTheDocument();
  });
});

// ── Appointment blocks ────────────────────────────────────────────────────────

describe('AgendaWeekGrid — appointment blocks', () => {
  it('renders appointment as role="button" with correct aria-label', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByRole('button', { name: 'Test Client · 10:00–11:00 · Masaje Test' }),
    ).toBeInTheDocument();
  });

  it('shows service text when height >= 48px (60 min appointment)', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Masaje Test')).toBeInTheDocument();
  });

  it('shows service text when durationMin gives height exactly 48 (24 min)', () => {
    const day = makeWeekDay({ appointments: [APPT_24MIN], citaCount: 1 });
    render(
      <AgendaWeekGrid
        weekDays={[day]}
        colorMap={{}}
        therapists={[]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Masaje Test')).toBeInTheDocument();
  });

  it('hides service text when height < 48px (23 min appointment)', () => {
    const day = makeWeekDay({ appointments: [APPT_23MIN], citaCount: 1 });
    render(
      <AgendaWeekGrid
        weekDays={[day]}
        colorMap={{}}
        therapists={[]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByText('Servicio Corto')).not.toBeInTheDocument();
  });

  it('renders no appointment buttons when weekDays have no appointments', () => {
    const emptyDays = WEEK_DAYS.map((d) => ({ ...d, appointments: [] }));
    render(
      <AgendaWeekGrid
        weekDays={emptyDays}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // The 7 day-header buttons DO render (they are not appointment blocks) —
    // scope to aria-haspopup="dialog" so only appointment/cluster blocks count.
    expect(queryOccupiedButtons()).toHaveLength(0);
  });
});

// ── NowLine ───────────────────────────────────────────────────────────────────

describe('AgendaWeekGrid — NowLine', () => {
  it('NowLine element is aria-hidden when present (isToday track)', () => {
    // isToday=true on MIÉ track — NowLine rendered if nowInRange
    // We just verify the component renders without error for isToday=true days
    const { container } = render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // aria-hidden elements exist (hour col at minimum)
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenEls.length).toBeGreaterThan(0);
  });
});

// ── Therapist legend ──────────────────────────────────────────────────────────

describe('AgendaWeekGrid — legend', () => {
  it('renders legend when therapists.length > 0', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1, THERAPIST_2]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByLabelText('Leyenda de terapeutas')).toBeInTheDocument();
  });

  it('shows therapist names in legend', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1, THERAPIST_2]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Naree Test')).toBeInTheDocument();
    expect(screen.getByText('Som Test')).toBeInTheDocument();
  });

  it('does not render legend when therapists array is empty', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={{}}
        therapists={[]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      {
        wrapper: Wrapper,
      },
    );
    expect(screen.queryByLabelText('Leyenda de terapeutas')).not.toBeInTheDocument();
  });
});

// ── Container aria-label ──────────────────────────────────────────────────────

describe('AgendaWeekGrid — container aria-label', () => {
  it('container aria-label contains week title translation with start/end dateStr', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // t('week.title', { start: '2026-05-18', end: '2026-05-24' })
    expect(screen.getByLabelText('Semana del 2026-05-18 al 2026-05-24')).toBeInTheDocument();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('AgendaWeekGrid — edge cases', () => {
  it('renders without error when weekDays is empty', () => {
    const { container } = render(
      <AgendaWeekGrid weekDays={[]} colorMap={{}} therapists={[]} {...DEFAULT_INTERACTIVE_PROPS} />,
      {
        wrapper: Wrapper,
      },
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ── Cluster ("folder") fixtures ────────────────────────────────────────────────
// Two overlapping citas in one column (same therapist → homogeneous folder).
// dayStart=10 → 10:00 = startMin 0 → cluster key "2026-05-18#0".
const CLUSTER_A = makeAppt({
  id: 101,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Ana',
});
const CLUSTER_B = makeAppt({
  id: 102,
  therapistId: 10,
  startTime: '10:30',
  endTime: '11:30',
  durationMin: 60,
  clientName: 'Beto',
});
// A third, mixed-therapist member → forces the heterogeneous variant.
const CLUSTER_C_OTHER_THERAPIST = makeAppt({
  id: 103,
  therapistId: 11,
  startTime: '10:15',
  endTime: '11:15',
  durationMin: 60,
  clientName: 'Caro',
});

const CLUSTER_KEY = '2026-05-18#0';
const TRIGGER_NAME = 'Grupo de 2 citas, 10:00–11:30';

const makeClusterDay = (
  appointments: readonly IAgendaAppointment[],
  overrides: Partial<IAgendaWeekDay> = {},
): IAgendaWeekDay =>
  makeWeekDay({
    dateStr: '2026-05-18',
    label: 'LUN',
    dateNumber: 18,
    appointments,
    citaCount: appointments.length,
    ...overrides,
  });

// ── Cluster rendering ──────────────────────────────────────────────────────────

describe('AgendaWeekGrid — cluster (folder) rendering', () => {
  it('E11: a day with two overlapping citas renders ONE folder (single tab stop), not two blocks', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // Exactly one OCCUPIED-slot button (the folder) — NOT two singleton event
    // blocks. The single day column's own header button is excluded via the
    // aria-haspopup="dialog" filter (day headers don't advertise a popup).
    expect(getOccupiedButtons()).toHaveLength(1);
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toBeInTheDocument();
  });

  it('folder accessible name announces the count + union time range', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toBeInTheDocument();
  });

  it('folder shows the visible member count (and it agrees with the name)', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    const folder = screen.getByRole('button', { name: TRIGGER_NAME });
    // Visible count "2" lives inside the folder; name says "Grupo de 2 citas…".
    expect(within(folder).getByText('2')).toBeInTheDocument();
  });

  it('folder advertises aria-haspopup="dialog" and aria-expanded=false when closed', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    const folder = screen.getByRole('button', { name: TRIGGER_NAME });
    expect(folder).toHaveAttribute('aria-haspopup', 'dialog');
    expect(folder).toHaveAttribute('aria-expanded', 'false');
  });

  it('folder is a single tab stop (tabIndex=0)', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveAttribute('tabindex', '0');
  });

  it('count grows with cluster size (3 overlapping → folder shows 3)', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B, CLUSTER_C_OTHER_THERAPIST])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1, THERAPIST_2]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    const folder = screen.getByRole('button', { name: 'Grupo de 3 citas, 10:00–11:30' });
    expect(within(folder).getByText('3')).toBeInTheDocument();
  });

  // Bug 1 regression: the back-card stack-edge rims must render as TRACK-level
  // SIBLINGS of the folder card, NOT as its children. As children of the
  // absolutely-positioned card they inherited the card's offset as their
  // positioning origin and spilled outside the grid bounds. The cluster day is
  // NOT today (default isToday:false) so the now-line never renders — the only
  // aria-hidden divs that are direct siblings of the folder are the two rims.
  it('Bug 1: the stack-edge rims are siblings of the folder card, not its descendants', () => {
    const { container } = render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );

    // The folder is still ONE focusable button with the unchanged accessible name.
    const folder = screen.getByRole('button', { name: TRIGGER_NAME });
    const track = folder.parentElement;
    expect(track).not.toBeNull();

    // The rims are decorative (aria-hidden) divs rendered as DIRECT siblings of
    // the folder inside the track-inner. Scope the query to the track and to
    // direct children so the (also aria-hidden) hour-labels column elsewhere in
    // the grid is not counted.
    const rims = Array.from(
      container.querySelectorAll<HTMLElement>('div[aria-hidden="true"]'),
    ).filter((el) => el.parentElement === track);
    expect(rims).toHaveLength(2);

    // Each rim must be OUTSIDE the folder button (a sibling, not a child) — this
    // is the core of the bug: previously they were rendered INSIDE the card.
    for (const rim of rims) {
      expect(folder.contains(rim)).toBe(false);
    }
  });
});

// ── Singletons still render unchanged alongside clusters ───────────────────────

describe('AgendaWeekGrid — singletons unchanged beside clusters', () => {
  it('a non-overlapping cita in the same column still renders as a StyledWeekEvt block', () => {
    const lone = makeAppt({
      id: 200,
      therapistId: 10,
      startTime: '15:00',
      endTime: '16:00',
      durationMin: 60,
      clientName: 'Solo',
      serviceName: 'Masaje Solo',
    });
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B, lone])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // The folder for the overlapping pair…
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toBeInTheDocument();
    // …and the singleton block with its unchanged event aria-label.
    expect(
      screen.getByRole('button', { name: 'Solo · 15:00–16:00 · Masaje Solo' }),
    ).toBeInTheDocument();
  });

  it('clicking a singleton block still calls onActivate (detail path unchanged)', () => {
    const onActivate = vi.fn();
    const lone = makeAppt({
      id: 200,
      startTime: '15:00',
      endTime: '16:00',
      durationMin: 60,
      clientName: 'Solo',
      serviceName: 'Masaje Solo',
    });
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B, lone])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onActivate={onActivate}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Solo · 15:00–16:00 · Masaje Solo' }));
    expect(onActivate).toHaveBeenCalledWith(200);
  });
});

// ── Folder activation (click / keyboard / toggle) ──────────────────────────────

describe('AgendaWeekGrid — folder activation', () => {
  it('clicking a closed folder calls onClusterOpenChange with its key', () => {
    const onClusterOpenChange = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onClusterOpenChange={onClusterOpenChange}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
    expect(onClusterOpenChange).toHaveBeenCalledWith(CLUSTER_KEY);
  });

  it('D10/E8: re-activating the OPEN folder toggles it closed (calls with null)', () => {
    const onClusterOpenChange = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey={CLUSTER_KEY}
        onClusterOpenChange={onClusterOpenChange}
      />,
      { wrapper: Wrapper },
    );
    // The open folder is wrapped in the popover; the trigger keeps its name.
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
    expect(onClusterOpenChange).toHaveBeenCalledWith(null);
  });

  it('Enter activates the folder', () => {
    const onClusterOpenChange = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onClusterOpenChange={onClusterOpenChange}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button', { name: TRIGGER_NAME }), { key: 'Enter' });
    expect(onClusterOpenChange).toHaveBeenCalledWith(CLUSTER_KEY);
  });

  it('Space activates the folder', () => {
    const onClusterOpenChange = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onClusterOpenChange={onClusterOpenChange}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button', { name: TRIGGER_NAME }), { key: ' ' });
    expect(onClusterOpenChange).toHaveBeenCalledWith(CLUSTER_KEY);
  });
});

// ── Open cluster mounts the popover ────────────────────────────────────────────

describe('AgendaWeekGrid — open cluster mounts the list popup', () => {
  it('when openClusterKey matches, the cluster list popup is rendered', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey={CLUSTER_KEY}
      />,
      { wrapper: Wrapper },
    );
    // The popup list is labelled with the same count+range string as the trigger.
    expect(screen.getByRole('list', { name: TRIGGER_NAME })).toBeInTheDocument();
    // Both members appear as edit rows.
    expect(screen.getByRole('button', { name: /^Ana,/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Beto,/ })).toBeInTheDocument();
    // aria-expanded flips true on the open folder.
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('the OPEN folder still advertises aria-haspopup="dialog" (Popover must not clobber it to "true")', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey={CLUSTER_KEY}
      />,
      { wrapper: Wrapper },
    );
    // Regression guard for the WCAG 4.1.2 fix: when the folder is wrapped by the
    // (now open) Popover, cloneElement used to overwrite aria-haspopup with "true".
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  it('the opened cluster surface is announced as a role="dialog" (not a tooltip)', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey={CLUSTER_KEY}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does NOT mount the popup when openClusterKey is a different key', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey="2026-05-18#999"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByRole('list', { name: TRIGGER_NAME })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('a row click in the open popup calls onEdit with the cita id', () => {
    const onEdit = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey={CLUSTER_KEY}
        onEdit={onEdit}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: /^Beto,/ }));
    expect(onEdit).toHaveBeenCalledWith(102);
  });
});

// ── Optimistic dimming on the folder (E6) ──────────────────────────────────────

describe('AgendaWeekGrid — folder optimistic dimming (E6)', () => {
  it('dims the folder when a member id === optimisticId', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        optimisticId={102}
      />,
      { wrapper: Wrapper },
    );
    // $optimistic → opacity 0.6 (reused StyledWeekEvt dimming).
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveStyle({ opacity: '0.6' });
  });

  it('leaves the folder at full opacity when no member is optimistic', () => {
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        optimisticId={999}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveStyle({ opacity: '1' });
  });
});

// ── Homogeneous vs heterogeneous variant (structural, NOT a color assertion) ───

describe('AgendaWeekGrid — folder variant selection', () => {
  it('a single-therapist cluster renders a homogeneous folder (no extra glyph emphasis structure)', () => {
    // Both members share therapistId 10 → homogeneous. We assert via the rendered
    // count/name (structural), not via CSS color (banned).
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    const folder = screen.getByRole('button', { name: TRIGGER_NAME });
    expect(within(folder).getByText('2')).toBeInTheDocument();
  });

  it('a mixed-therapist cluster renders a heterogeneous folder; the open popup shows per-therapist rows', () => {
    // therapistId 10 + 11 → heterogeneous. Open it and assert every member is
    // reachable as its own row (the a11y contract: clustering hides blocks, the
    // popup is the only path to the citas).
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_C_OTHER_THERAPIST])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1, THERAPIST_2]}
        {...DEFAULT_INTERACTIVE_PROPS}
        openClusterKey={CLUSTER_KEY}
      />,
      { wrapper: Wrapper },
    );
    // Folder count is 2 (Ana + Caro), and both rows are present in the popup.
    expect(screen.getByRole('button', { name: /^Ana,/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Caro,/ })).toBeInTheDocument();
  });
});

// ── Drag & drop eligibility (Surface A) ────────────────────────────────────────
// Drag is move-only and gated: only non-terminal citas, only when canManage, and
// only standalone singletons (clusters are NOT draggable). The grid exposes the
// eligibility through (a) the lock glyph + a11y label suffix on terminal blocks,
// and (b) the read affordance (click → onActivate) staying intact regardless.
// Pointer-drag behaviour itself is covered in useWeekCitaDnD.test.tsx.

const makeSingletonDay = (appt: IAgendaAppointment): IAgendaWeekDay =>
  makeWeekDay({
    dateStr: '2026-05-18',
    label: 'LUN',
    dateNumber: 18,
    appointments: [appt],
    citaCount: 1,
  });

describe('AgendaWeekGrid — terminal block is not draggable (lock cue)', () => {
  it('a completada block appends the "(no editable)" hint to its accessible name', () => {
    const terminal = makeAppt({
      id: 50,
      estado: 'completada',
      startTime: '10:00',
      endTime: '11:00',
      clientName: 'Done',
      serviceName: 'Masaje',
    });
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(terminal)]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByRole('button', { name: 'Done · 10:00–11:00 · Masaje (no editable)' }),
    ).toBeInTheDocument();
  });

  it('renders the lock glyph (decorative) inside a terminal block', () => {
    const terminal = makeAppt({ id: 51, estado: 'cancelada', clientName: 'Cxl' });
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(terminal)]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    // Non-color cue: the lock emoji marks the block as locked (aria-hidden).
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('no_presentado is also treated as terminal (locked label)', () => {
    const terminal = makeAppt({
      id: 52,
      estado: 'no_presentado',
      startTime: '12:00',
      endTime: '13:00',
      clientName: 'NoShow',
      serviceName: 'Reflexología',
    });
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(terminal)]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByRole('button', { name: 'NoShow · 12:00–13:00 · Reflexología (no editable)' }),
    ).toBeInTheDocument();
  });

  it('a terminal block still opens its detail on click (read affordance preserved)', () => {
    const onActivate = vi.fn();
    const terminal = makeAppt({ id: 53, estado: 'completada', clientName: 'Done' });
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(terminal)]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onActivate={onActivate}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: /^Done/ }));
    expect(onActivate).toHaveBeenCalledWith(53);
  });
});

describe('AgendaWeekGrid — non-terminal singleton is draggable only when permitted', () => {
  it('a non-terminal block has NO "(no editable)" suffix and no lock glyph', () => {
    const live = makeAppt({
      id: 60,
      estado: 'confirmada',
      startTime: '10:00',
      endTime: '11:00',
      clientName: 'Live',
      serviceName: 'Masaje',
    });
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(live)]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        canManage
      />,
      { wrapper: Wrapper },
    );
    // Exact accessible name with NO suffix (draggable for an authorised user).
    expect(screen.getByRole('button', { name: 'Live · 10:00–11:00 · Masaje' })).toBeInTheDocument();
    expect(screen.queryByText('🔒')).not.toBeInTheDocument();
  });

  it('a read-only role (canManage=false) keeps the read affordance: click opens detail', () => {
    // masajista is read-only on the admin week view → no drag, but the block still
    // renders and click still activates the detail (no lock glyph for a whole
    // read-only view — that would be noise, per the Designer spec §4.1).
    const onActivate = vi.fn();
    const live = makeAppt({
      id: 61,
      estado: 'pendiente',
      startTime: '10:00',
      endTime: '11:00',
      clientName: 'ReadOnly',
      serviceName: 'Masaje',
    });
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(live)]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        canManage={false}
        onActivate={onActivate}
      />,
      { wrapper: Wrapper },
    );
    const block = screen.getByRole('button', { name: 'ReadOnly · 10:00–11:00 · Masaje' });
    expect(block).toBeInTheDocument();
    // No lock glyph for a non-terminal block even when the view is read-only.
    expect(screen.queryByText('🔒')).not.toBeInTheDocument();
    fireEvent.click(block);
    expect(onActivate).toHaveBeenCalledWith(61);
  });
});

describe('AgendaWeekGrid — clusters are not draggable (still open the popover)', () => {
  it('clicking a folder opens the cluster popup (no reschedule drop path)', () => {
    const onClusterOpenChange = vi.fn();
    const onRescheduleDrop = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onClusterOpenChange={onClusterOpenChange}
        onRescheduleDrop={onRescheduleDrop}
      />,
      { wrapper: Wrapper },
    );
    // A plain click on the folder toggles the cluster popup (its existing role)…
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
    expect(onClusterOpenChange).toHaveBeenCalledWith(CLUSTER_KEY);
    // …and never routes through the reschedule drop handler.
    expect(onRescheduleDrop).not.toHaveBeenCalled();
  });
});

// ── Day-header navigation (click a day header → switch to Day view) ───────────

describe('AgendaWeekGrid — day-header navigation', () => {
  it("clicking a day header calls onDayHeaderClick with that day's dateStr", () => {
    const onDayHeaderClick = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onDayHeaderClick={onDayHeaderClick}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver el día MAR 19' }));
    expect(onDayHeaderClick).toHaveBeenCalledWith('2026-05-19');
    expect(onDayHeaderClick).toHaveBeenCalledTimes(1);
  });

  it('clicking a DIFFERENT day header fires with its own dateStr', () => {
    const onDayHeaderClick = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onDayHeaderClick={onDayHeaderClick}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver el día DOM 24' }));
    expect(onDayHeaderClick).toHaveBeenCalledWith('2026-05-24');
  });

  it('Enter on a day header fires onDayHeaderClick', () => {
    const onDayHeaderClick = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onDayHeaderClick={onDayHeaderClick}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver el día LUN 18' }), { key: 'Enter' });
    expect(onDayHeaderClick).toHaveBeenCalledWith('2026-05-18');
  });

  it('Space on a day header fires onDayHeaderClick', () => {
    const onDayHeaderClick = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onDayHeaderClick={onDayHeaderClick}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver el día LUN 18' }), { key: ' ' });
    expect(onDayHeaderClick).toHaveBeenCalledWith('2026-05-18');
  });

  it('an unrelated key does not fire onDayHeaderClick', () => {
    const onDayHeaderClick = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onDayHeaderClick={onDayHeaderClick}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver el día LUN 18' }), { key: 'a' });
    expect(onDayHeaderClick).not.toHaveBeenCalled();
  });

  it('day headers are keyboard-focusable (tabIndex 0)', () => {
    render(
      <AgendaWeekGrid
        weekDays={WEEK_DAYS}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'Ver el día LUN 18' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});

// ── Double-click empty cell → create modal ─────────────────────────────────────
// The track fires onDoubleClick only when canManage; jsdom's default
// getBoundingClientRect returns an all-zero rect (top=0), so a doubleClick's
// clientY IS the offset fed into topOffsetToTime(offset, dayStart=10,
// slotHeight=60, snap=30, dayEnd=21, duration=0). clientY=120 → 60 min from
// 10:00 → snapped "11:00" — a deterministic, mock-free geometry.

describe('AgendaWeekGrid — double-click empty cell creates a cita', () => {
  it("double-clicking an empty area of a day track fires onCreateAtSlot with that day's dateStr + snapped time", () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(makeAppt({ id: 1, startTime: '10:00', endTime: '11:00' }))]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onCreateAtSlot={onCreateAtSlot}
      />,
      { wrapper: Wrapper },
    );
    // The existing appointment's parent IS the track-inner surface; double-click
    // it at an offset AWAY from that appointment (11:00, the slot after the 10:00 block).
    const trackInner = screen.getByRole('button', { name: /^Test Client/ }).parentElement;
    expect(trackInner).not.toBeNull();
    fireEvent.doubleClick(trackInner!, { clientY: 120 });
    expect(onCreateAtSlot).toHaveBeenCalledWith({ dateStr: '2026-05-18', horaInicio: '11:00' });
  });

  it('double-clicking DIRECTLY on an existing singleton block does NOT fire onCreateAtSlot (occupied guard)', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(makeAppt({ id: 1 }))]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onCreateAtSlot={onCreateAtSlot}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.doubleClick(screen.getByRole('button', { name: /^Test Client/ }));
    expect(onCreateAtSlot).not.toHaveBeenCalled();
  });

  it('double-clicking on a cluster folder does NOT fire onCreateAtSlot (occupied guard)', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeClusterDay([CLUSTER_A, CLUSTER_B])]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onCreateAtSlot={onCreateAtSlot}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.doubleClick(screen.getByRole('button', { name: TRIGGER_NAME }));
    expect(onCreateAtSlot).not.toHaveBeenCalled();
  });

  it('canManage=false → double-click does nothing (no handler attached)', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaWeekGrid
        weekDays={[makeSingletonDay(makeAppt({ id: 1 }))]}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        canManage={false}
        onCreateAtSlot={onCreateAtSlot}
      />,
      { wrapper: Wrapper },
    );
    const trackInner = screen.getByRole('button', { name: /^Test Client/ }).parentElement;
    fireEvent.doubleClick(trackInner!, { clientY: 120 });
    expect(onCreateAtSlot).not.toHaveBeenCalled();
  });

  it('the dateStr in the callback matches the clicked day column, not another day', () => {
    const onCreateAtSlot = vi.fn();
    const days = [
      makeSingletonDay(makeAppt({ id: 1, clientName: 'MonAppt' })),
      { ...makeWeekDay({ dateStr: '2026-05-19', label: 'MAR', dateNumber: 19 }) },
    ];
    render(
      <AgendaWeekGrid
        weekDays={days}
        colorMap={COLOR_MAP}
        therapists={[THERAPIST_1]}
        {...DEFAULT_INTERACTIVE_PROPS}
        onCreateAtSlot={onCreateAtSlot}
      />,
      { wrapper: Wrapper },
    );
    const trackInner = screen.getByRole('button', { name: /^MonAppt/ }).parentElement;
    fireEvent.doubleClick(trackInner!, { clientY: 120 });
    expect(onCreateAtSlot).toHaveBeenCalledWith({ dateStr: '2026-05-18', horaInicio: '11:00' });
  });
});
