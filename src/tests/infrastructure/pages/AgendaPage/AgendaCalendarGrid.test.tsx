/**
 * AgendaCalendarGrid.test.tsx
 *
 * Component tests for AgendaCalendarGrid after the Pass-2 CRUD prop contract.
 *
 * Mock strategy:
 *   - AgendaCitaDetailPopover is stubbed (the grid's job is selection wiring +
 *     event activation + the non-bookable block distinction; the popover has its
 *     own test).
 *   - i18n: real agenda namespace (a11y.eventLabel / a11y.blockLabel / estado.*).
 *   - fireEvent for interactions — @testing-library/user-event is not a
 *     dependency of this project; key events use {key} so Enter/Space handlers
 *     run faithfully.
 *   - Date is not mocked globally; the now-line depends on activeDate === today,
 *     which is supplied via props.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaTherapist, IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';

// ── Stub the detail popover ────────────────────────────────────────────────────
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

import { AgendaCalendarGrid } from '@infra/pages/AgendaPage/components/admin/AgendaCalendarGrid';

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

const TWO_THERAPISTS: IAgendaTherapist[] = [
  {
    id: 10,
    nombre: 'Naree',
    apellidos: 'Test',
    initials: 'NT',
    sala: 'Sala Test A',
    appointmentCount: 1,
    isActive: true,
    isAvailableOnDate: true,
  },
  {
    id: 11,
    nombre: 'Som',
    apellidos: 'Test',
    initials: 'ST',
    sala: 'Sala Test B',
    appointmentCount: 1,
    isActive: false,
    isAvailableOnDate: true,
  },
];

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1001,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Cliente Alpha',
  visitInfo: null,
  serviceName: 'Masaje Test',
  sala: 'Sala Test A',
  salaId: 10,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 50,
  ...overrides,
});

const TWO_APPOINTMENTS: IAgendaAppointment[] = [
  makeAppt({ id: 1001, therapistId: 10, clientName: 'Cliente Alpha' }),
  makeAppt({
    id: 1002,
    therapistId: 11,
    startTime: '11:30',
    endTime: '12:30',
    clientName: 'Cliente Beta',
    serviceName: 'Reflexología Test',
    sala: 'Sala Test B',
    salaId: 11,
    evtVariant: 'jungle',
  }),
];

const NON_TODAY = '2020-01-01';

function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaCalendarGrid>> = {}) {
  return {
    therapists: TWO_THERAPISTS,
    appointments: [] as readonly IAgendaAppointment[],
    activeDate: NON_TODAY,
    selectedId: null as TCitaId | null,
    optimisticId: null as TCitaId | null,
    canManage: true,
    actionPending: false,
    // `rescheduleBusy` + `onRescheduleDrop` are the two props the day-grid drag &
    // drop feature (Surface A) added; `onCreateAtSlot` (double-click empty cell)
    // is a third. The grid now REQUIRES all three, so they must be present here
    // for the file to typecheck and for every existing case to keep compiling.
    // Pointer-drag behaviour itself lives in useDayCitaDnD.test.tsx.
    rescheduleBusy: false,
    centroName: 'Centro Madrid',
    onActivate: vi.fn(),
    onDetailOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    onChangeEstado: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onRescheduleDrop: vi.fn(),
    onCreateAtSlot: vi.fn(),
    ...overrides,
  };
}

// ── Therapist column headers ────────────────────────────────────────────────────

describe('AgendaCalendarGrid — therapist column headers', () => {
  it('renders one header per therapist with name, initials and sala', () => {
    render(<AgendaCalendarGrid {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Naree Test')).toBeInTheDocument();
    expect(screen.getByText('Som Test')).toBeInTheDocument();
    expect(screen.getByText('NT')).toBeInTheDocument();
    expect(screen.getByText('ST')).toBeInTheDocument();
    expect(screen.getByText('Sala Test A')).toBeInTheDocument();
    expect(screen.getByText('Sala Test B')).toBeInTheDocument();
  });

  it('an inactive therapist avatar is aria-hidden (decorative)', () => {
    const { container } = render(
      <AgendaCalendarGrid {...baseProps({ therapists: [TWO_THERAPISTS[1]] })} />,
      { wrapper: Wrapper },
    );
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    const avatar = Array.from(hidden).find((el) => el.textContent === 'ST');
    expect(avatar).toBeInTheDocument();
  });
});

// ── Appointment events ──────────────────────────────────────────────────────────

describe('AgendaCalendarGrid — appointment events', () => {
  it('renders one role="button" event per appointment with a descriptive aria-label', () => {
    render(<AgendaCalendarGrid {...baseProps({ appointments: TWO_APPOINTMENTS })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Cliente Alpha')).toBeInTheDocument();
    expect(screen.getByText('Cliente Beta')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Cliente Alpha · 10:00–11:00 · Masaje Test · Confirmada/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders no event buttons when appointments is empty', () => {
    render(<AgendaCalendarGrid {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('each event is keyboard-focusable (tabIndex 0)', () => {
    render(<AgendaCalendarGrid {...baseProps({ appointments: TWO_APPOINTMENTS })} />, {
      wrapper: Wrapper,
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('tabindex', '0');
    });
  });

  it('event exposes aria-haspopup="dialog" and aria-expanded reflecting selection', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ appointments: [makeAppt({ id: 1001 })], selectedId: null })}
      />,
      { wrapper: Wrapper },
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters appointments into the matching therapist track (orphan therapistId is dropped)', () => {
    const orphan = makeAppt({ id: 5000, therapistId: 999, clientName: 'Cliente Orphan' });
    render(<AgendaCalendarGrid {...baseProps({ appointments: [orphan] })} />, { wrapper: Wrapper });
    expect(screen.queryByText('Cliente Orphan')).not.toBeInTheDocument();
  });

  it('shows service text only when the event is tall enough (≥60px)', () => {
    const short = makeAppt({ id: 1, durationMin: 15, startTime: '09:00', endTime: '09:15' });
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [short] })}
      />,
      {
        wrapper: Wrapper,
      },
    );
    // 15 min → 30px height < 60 → service text not rendered
    expect(screen.queryByText('Masaje Test')).not.toBeInTheDocument();
  });

  it('shows the cita centro name on a tall enough card (≥100px)', () => {
    // 60 min → 120px height ≥ 100 → the centro line renders from appt.centroName.
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [makeAppt({ id: 1, centroName: 'Centro Madrid' })],
        })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Centro Madrid')).toBeInTheDocument();
  });

  it('hides the centro line on a short card (<100px)', () => {
    const short = makeAppt({
      id: 1,
      durationMin: 30,
      startTime: '09:00',
      endTime: '09:30',
      centroName: 'Centro Madrid',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [short] })}
      />,
      { wrapper: Wrapper },
    );
    // 30 min → 60px height < 100 → centro text not rendered
    expect(screen.queryByText('Centro Madrid')).not.toBeInTheDocument();
  });
});

// ── Event activation (click + keyboard) ─────────────────────────────────────────

describe('AgendaCalendarGrid — event activation', () => {
  it('clicking an event calls onActivate with its cita id', () => {
    const onActivate = vi.fn();
    render(
      <AgendaCalendarGrid {...baseProps({ appointments: [makeAppt({ id: 1001 })], onActivate })} />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalledWith(1001);
  });

  it('Enter activates the event', () => {
    const onActivate = vi.fn();
    render(
      <AgendaCalendarGrid {...baseProps({ appointments: [makeAppt({ id: 1001 })], onActivate })} />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledWith(1001);
  });

  it('Space activates the event', () => {
    const onActivate = vi.fn();
    render(
      <AgendaCalendarGrid {...baseProps({ appointments: [makeAppt({ id: 1001 })], onActivate })} />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onActivate).toHaveBeenCalledWith(1001);
  });

  it('an unrelated key does not activate the event', () => {
    const onActivate = vi.fn();
    render(
      <AgendaCalendarGrid {...baseProps({ appointments: [makeAppt({ id: 1001 })], onActivate })} />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(screen.getByRole('button'), { key: 'a' });
    expect(onActivate).not.toHaveBeenCalled();
  });
});

// ── Non-bookable block (evtVariant 'break') — NOT a button, NOT focusable ───────

describe('AgendaCalendarGrid — non-bookable block', () => {
  const block = makeAppt({
    id: 2001,
    therapistId: 10,
    serviceName: 'Pausa · Té',
    evtVariant: 'break',
  });

  it('renders a block as role="note" with a "Bloqueo:" aria-label, not a button', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block] })}
      />,
      {
        wrapper: Wrapper,
      },
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('note', { name: /Bloqueo: Pausa · Té/i })).toBeInTheDocument();
  });

  it('the block is NOT keyboard-focusable (no tabindex)', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block] })}
      />,
      {
        wrapper: Wrapper,
      },
    );
    expect(screen.getByRole('note')).not.toHaveAttribute('tabindex');
  });

  it('clicking the block does NOT call onActivate (decorative, not interactive)', () => {
    const onActivate = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block], onActivate })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('note'));
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('does not render the block label as an event service when it is a block', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block] })}
      />,
      {
        wrapper: Wrapper,
      },
    );
    // The block label is present, but there is no event button for it
    expect(screen.getByText('Pausa · Té')).toBeInTheDocument();
  });
});

// ── Estado glyph (status not color-only) ────────────────────────────────────────

describe('AgendaCalendarGrid — estado glyph on events', () => {
  it.each([
    ['pendiente', '⏳'],
    ['confirmada', '✓'],
    ['completada', '✓✓'],
    ['cancelada', '✕'],
  ] as const)('estado=%s renders glyph "%s" (aria-hidden) inside the event', (estado, glyph) => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [makeAppt({ estado })] })}
      />,
      { wrapper: Wrapper },
    );
    const glyphEl = screen.getByText(glyph);
    expect(glyphEl).toBeInTheDocument();
    expect(glyphEl).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── Selection → detail popover wiring ──────────────────────────────────────────

describe('AgendaCalendarGrid — selection', () => {
  it('wraps the selected event in the detail popover and sets aria-expanded=true', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ appointments: [makeAppt({ id: 1001 })], selectedId: 1001 })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('detail-popover')).toHaveAttribute('data-cita', '1001');
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not render the detail popover when nothing is selected', () => {
    render(<AgendaCalendarGrid {...baseProps({ appointments: [makeAppt({ id: 1001 })] })} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByTestId('detail-popover')).not.toBeInTheDocument();
  });
});

// ── Accessibility / structure ───────────────────────────────────────────────────

describe('AgendaCalendarGrid — accessibility & structure', () => {
  it('grid container has aria-label "Calendario de agenda"', () => {
    render(<AgendaCalendarGrid {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Calendario de agenda')).toBeInTheDocument();
  });

  it('renders without error when therapists is empty', () => {
    const { container } = render(<AgendaCalendarGrid {...baseProps({ therapists: [] })} />, {
      wrapper: Wrapper,
    });
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a now-line (aria-hidden) when activeDate is today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const { container } = render(<AgendaCalendarGrid {...baseProps({ activeDate: today })} />, {
      wrapper: Wrapper,
    });
    // The now-line is the only aria-hidden element with no text content inside a track.
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
  });
});

// ── Drag & drop eligibility (Surface A) ────────────────────────────────────────
// The DAY grid is the mirror of the week grid: vertical = hour, horizontal =
// therapist column. Drag is move-only and gated: only NON-terminal citas are
// draggable, and only when `canManage`. The grid exposes the "can't move" state
// through (a) the lock glyph 🔒 + the "(no editable)" a11y suffix on terminal
// citas and on non-bookable 'break' blocks, and (b) the read affordance (click →
// onActivate) staying intact regardless. The pointer gesture itself is covered in
// useDayCitaDnD.test.tsx; here we only assert the rendered eligibility cues.

describe('AgendaCalendarGrid — terminal cita is not draggable (lock cue)', () => {
  it.each([['completada'], ['cancelada'], ['no_presentado']] as const)(
    'a %s cita appends the "(no editable)" hint to its accessible name',
    (estado) => {
      const terminal = makeAppt({
        id: 7001,
        therapistId: 10,
        estado,
        clientName: 'Histórico',
        serviceName: 'Masaje Test',
      });
      render(
        <AgendaCalendarGrid
          {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [terminal] })}
        />,
        { wrapper: Wrapper },
      );
      // a11y.eventLabel = "{client} · {start}–{end} · {service} · {estado}"; terminal
      // citas append the lockedHint "(no editable)".
      expect(
        screen.getByRole('button', {
          name: /Histórico · 10:00–11:00 · Masaje Test · .+ \(no editable\)$/,
        }),
      ).toBeInTheDocument();
    },
  );

  it('renders the lock glyph 🔒 (decorative, aria-hidden) inside a terminal cita', () => {
    const terminal = makeAppt({
      id: 7002,
      therapistId: 10,
      estado: 'cancelada',
      clientName: 'Cxl',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [terminal] })}
      />,
      { wrapper: Wrapper },
    );
    const lock = screen.getByText('🔒');
    expect(lock).toBeInTheDocument();
    expect(lock).toHaveAttribute('aria-hidden', 'true');
  });

  it('a terminal cita still opens its detail on click (read affordance preserved)', () => {
    const onActivate = vi.fn();
    const terminal = makeAppt({
      id: 7003,
      therapistId: 10,
      estado: 'completada',
      clientName: 'Done',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [terminal], onActivate })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: /^Done/ }));
    expect(onActivate).toHaveBeenCalledWith(7003);
  });
});

describe('AgendaCalendarGrid — break block is not draggable (lock cue)', () => {
  const block = makeAppt({
    id: 7100,
    therapistId: 10,
    serviceName: 'Pausa · Té',
    evtVariant: 'break',
  });

  it('a break block carries the "(no editable)" suffix on its role="note" label', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block] })}
      />,
      { wrapper: Wrapper },
    );
    // a11y.blockLabel = "Bloqueo: {label}" + a11y.lockedHint "(no editable)".
    expect(
      screen.getByRole('note', { name: 'Bloqueo: Pausa · Té (no editable)' }),
    ).toBeInTheDocument();
  });

  it('renders the lock glyph 🔒 (decorative) inside a break block', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block] })}
      />,
      { wrapper: Wrapper },
    );
    const lock = screen.getByText('🔒');
    expect(lock).toBeInTheDocument();
    expect(lock).toHaveAttribute('aria-hidden', 'true');
  });

  it('a break block is never a button and never draggable (no pointerdown wiring)', () => {
    const onRescheduleDrop = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [block],
          onRescheduleDrop,
        })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // A pointer gesture on the decorative block must not start a reschedule.
    fireEvent.pointerDown(screen.getByRole('note'), { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(document, { clientX: 10, clientY: 200 });
    expect(onRescheduleDrop).not.toHaveBeenCalled();
  });
});

describe('AgendaCalendarGrid — non-terminal cita is draggable only when permitted', () => {
  it('a non-terminal cita has NO "(no editable)" suffix and no lock glyph (draggable for canManage)', () => {
    const live = makeAppt({
      id: 7200,
      therapistId: 10,
      estado: 'confirmada',
      clientName: 'Live',
      serviceName: 'Masaje Test',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [live], canManage: true })}
      />,
      { wrapper: Wrapper },
    );
    // Exact accessible name with the estado segment but NO locked suffix.
    expect(
      screen.getByRole('button', { name: 'Live · 10:00–11:00 · Masaje Test · Confirmada' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('🔒')).not.toBeInTheDocument();
  });

  it('a read-only view (canManage=false) keeps the read affordance: click still activates', () => {
    // A non-terminal cita under a read-only role is NOT draggable, but it still
    // renders and click still opens the detail — and gets NO lock glyph (a whole
    // read-only view would be noise, per the Designer spec).
    const onActivate = vi.fn();
    const live = makeAppt({
      id: 7201,
      therapistId: 10,
      estado: 'pendiente',
      clientName: 'ReadOnly',
      serviceName: 'Masaje Test',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [live],
          canManage: false,
          onActivate,
        })}
      />,
      { wrapper: Wrapper },
    );
    const block = screen.getByRole('button', {
      name: 'ReadOnly · 10:00–11:00 · Masaje Test · Por confirmar',
    });
    expect(screen.queryByText('🔒')).not.toBeInTheDocument();
    fireEvent.click(block);
    expect(onActivate).toHaveBeenCalledWith(7201);
  });

  it('does not start a reschedule when canManage=false even on a pointer gesture', () => {
    // With canManage=false the block has no onPointerDown handler, so a drag never
    // arms and onRescheduleDrop can never fire.
    const onRescheduleDrop = vi.fn();
    const live = makeAppt({
      id: 7202,
      therapistId: 10,
      estado: 'confirmada',
      clientName: 'NoDrag',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [live],
          canManage: false,
          onRescheduleDrop,
        })}
      />,
      { wrapper: Wrapper },
    );
    const block = screen.getByRole('button', { name: /^NoDrag/ });
    fireEvent.pointerDown(block, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(document, { clientX: 10, clientY: 200 });
    fireEvent.pointerUp(document, { clientX: 10, clientY: 200 });
    expect(onRescheduleDrop).not.toHaveBeenCalled();
  });
});

// ── Double-click empty cell → create modal ─────────────────────────────────────
// jsdom's default getBoundingClientRect returns an all-zero rect (top=0), so a
// doubleClick's clientY IS the offset fed into topOffsetToTime(offset,
// dayStart=10, slotHeight=60, snap=30, dayEnd=21, duration=0). clientY=120 → 60
// min from 10:00 → snapped "11:00" — deterministic, no rect mocking needed.

describe('AgendaCalendarGrid — double-click empty cell creates a cita', () => {
  it("double-clicking an empty area of a therapist track fires onCreateAtSlot with that therapist's id + snapped time", () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [makeAppt({ id: 1001, therapistId: 10 })],
          onCreateAtSlot,
        })}
      />,
      { wrapper: Wrapper },
    );
    // The existing appointment's parent IS the track-inner surface; double-click
    // it at an offset AWAY from that appointment (11:00, the slot after the 10:00 block).
    const trackInner = screen.getByRole('button', { name: /^Cliente Alpha/ }).parentElement;
    expect(trackInner).not.toBeNull();
    fireEvent.doubleClick(trackInner!, { clientY: 120 });
    expect(onCreateAtSlot).toHaveBeenCalledWith({ therapistId: 10, horaInicio: '11:00' });
  });

  it('double-clicking DIRECTLY on an existing event block does NOT fire onCreateAtSlot (occupied guard)', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [makeAppt({ id: 1001, therapistId: 10 })],
          onCreateAtSlot,
        })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.doubleClick(screen.getByRole('button', { name: /^Cliente Alpha/ }));
    expect(onCreateAtSlot).not.toHaveBeenCalled();
  });

  it('double-clicking a non-bookable block does NOT fire onCreateAtSlot (occupied guard)', () => {
    const onCreateAtSlot = vi.fn();
    const block = makeAppt({
      id: 2001,
      therapistId: 10,
      serviceName: 'Pausa · Té',
      evtVariant: 'break',
    });
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [TWO_THERAPISTS[0]], appointments: [block], onCreateAtSlot })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.doubleClick(screen.getByRole('note'));
    expect(onCreateAtSlot).not.toHaveBeenCalled();
  });

  it('canManage=false → double-click does nothing (no handler attached)', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: [TWO_THERAPISTS[0]],
          appointments: [makeAppt({ id: 1001, therapistId: 10 })],
          canManage: false,
          onCreateAtSlot,
        })}
      />,
      { wrapper: Wrapper },
    );
    const trackInner = screen.getByRole('button', { name: /^Cliente Alpha/ }).parentElement;
    fireEvent.doubleClick(trackInner!, { clientY: 120 });
    expect(onCreateAtSlot).not.toHaveBeenCalled();
  });

  it('the therapistId in the callback matches the clicked column, not another therapist', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({
          therapists: TWO_THERAPISTS,
          appointments: [
            makeAppt({ id: 1001, therapistId: 10, clientName: 'ColA' }),
            makeAppt({
              id: 1002,
              therapistId: 11,
              clientName: 'ColB',
              startTime: '15:00',
              endTime: '16:00',
            }),
          ],
          onCreateAtSlot,
        })}
      />,
      { wrapper: Wrapper },
    );
    // Double-click inside therapist 11's column (via ColB's track-inner parent).
    const trackInnerB = screen.getByRole('button', { name: /^ColB/ }).parentElement;
    fireEvent.doubleClick(trackInnerB!, { clientY: 120 });
    expect(onCreateAtSlot).toHaveBeenCalledWith({ therapistId: 11, horaInicio: '11:00' });
  });

  it('double-clicking an empty area of the "Sin asignación" column fires onCreateAtSlot with therapistId null', () => {
    const onCreateAtSlot = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({
          unassignedAppointments: [
            makeAppt({
              id: 2001,
              therapistId: null,
              clientName: null,
              estado: 'sin_asignar',
              evtVariant: 'unassigned',
              serviceName: 'Sin asignar',
            }),
          ],
          onCreateAtSlot,
        })}
      />,
      { wrapper: Wrapper },
    );
    // The unassigned block's parent IS the unassigned track-inner surface.
    const trackInner = screen.getByRole('button', { name: /^—/ }).parentElement;
    fireEvent.doubleClick(trackInner!, { clientY: 120 });
    expect(onCreateAtSlot).toHaveBeenCalledWith({ therapistId: null, horaInicio: '11:00' });
  });
});

// ── "Sin asignación" primary column ──────────────────────────────────────────
// Citas with no therapist (estado 'sin_asignar') render in a leading column so
// they are never invisible for the day. Its blocks are clickable (→ detail) and a
// drag SOURCE (assign by dropping onto a therapist column; drag mechanics live in
// useDayCitaDnD.test.tsx).

const makeUnassigned = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment =>
  makeAppt({
    id: 2001,
    therapistId: null,
    clientName: null,
    sala: null,
    salaId: null,
    estado: 'sin_asignar',
    evtVariant: 'unassigned',
    serviceName: 'Masaje sin asignar',
    ...overrides,
  });

describe('AgendaCalendarGrid — Sin asignación column', () => {
  it('renders the "Sin asignación" header + count when there are unassigned citas', () => {
    render(<AgendaCalendarGrid {...baseProps({ unassignedAppointments: [makeUnassigned()] })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Sin asignación')).toBeInTheDocument();
    expect(screen.getByText('1 sin asignar')).toBeInTheDocument();
  });

  it('does NOT render the column when there are no unassigned citas', () => {
    render(<AgendaCalendarGrid {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.queryByText('Sin asignación')).not.toBeInTheDocument();
  });

  it('renders the column even when there are zero therapists (no empty state)', () => {
    render(
      <AgendaCalendarGrid
        {...baseProps({ therapists: [], unassignedAppointments: [makeUnassigned()] })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Sin asignación')).toBeInTheDocument();
    // The generic "no therapists" empty state must NOT show — there IS data.
    expect(screen.queryByText('Sin masajistas disponibles')).not.toBeInTheDocument();
  });

  it('clicking an unassigned block activates it (opens the detail popover)', () => {
    const onActivate = vi.fn();
    render(
      <AgendaCalendarGrid
        {...baseProps({ unassignedAppointments: [makeUnassigned({ id: 2001 })], onActivate })}
      />,
      { wrapper: Wrapper },
    );
    // clientName null → "—"; the block still renders and is clickable.
    fireEvent.click(screen.getByRole('button', { name: /Masaje sin asignar/ }));
    expect(onActivate).toHaveBeenCalledWith(2001);
  });
});
