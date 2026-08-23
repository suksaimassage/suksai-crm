/**
 * AgendaCalendarOverlay.test.tsx
 *
 * Behaviour of the Calendar overlay (create/edit surface): the 2×2 grid wiring,
 * the per-day counter sourced from `useAdminWeekData`, day selection re-scoping the
 * kanban (via a spy on `useAdminAgendaData`'s args), kanban card content +
 * state→column partition, the embedded inline form (create prefill + edit by
 * citaId + card-click → edit), close affordances and the dialog a11y contract.
 *
 * The data hooks and the embedded `CitaModal` are mocked — the overlay owns the
 * orchestration, not the pickers. `useQueryClient` is real (retry path), so the
 * tree is wrapped in a QueryClientProvider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type {
  IAgendaAppointment,
  IAgendaTherapist,
  IAgendaWeekDay,
} from '@domain/models/agenda.models';

// ── Mocks ────────────────────────────────────────────────────────────────────────

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

// Records the identity of every `prefill` object the overlay hands to CitaModal,
// so a test can prove it stays referentially stable across unrelated re-renders
// (a fresh literal would re-fire CitaModal's prefill effect, deps [open, mode,
// prefill], overwriting the user's mid-form entries).
const prefillRecorder = vi.hoisted(() => ({ refs: [] as unknown[] }));

// Inline CitaModal stub — surfaces mode / citaId / prefill.fecha so the form
// wiring can be inspected without pulling the real pickers. It also exposes two
// buttons that fire the forwarded `onSuccess` / `onClose` callbacks so the
// overlay↔form wiring (success closes, close closes) is assertable.
vi.mock('@infra/components/ui/domain/modals', () => ({
  CitaModal: (props: {
    mode: string;
    citaId?: number;
    prefill?: { fecha?: string };
    onSuccess?: (action: 'created' | 'updated', clienteName: string) => void;
    onClose?: () => void;
    onDirty?: () => void;
  }): ReactNode => {
    prefillRecorder.refs.push(props.prefill);
    return (
      <div
        data-testid="cita-form"
        data-mode={props.mode}
        data-citaid={props.citaId ?? ''}
        data-fecha={props.prefill?.fecha ?? ''}
      >
        <button
          type="button"
          data-testid="stub-form-success"
          onClick={() => props.onSuccess?.('created', 'Cliente Uno')}
        >
          stub-success
        </button>
        <button type="button" data-testid="stub-form-close" onClick={() => props.onClose?.()}>
          stub-close
        </button>
        {/* Simulates the user typing into any field — the real CitaModal fires
            this from its field onChange handlers, never from prefill sync. */}
        <button type="button" data-testid="stub-form-dirty" onClick={() => props.onDirty?.()}>
          stub-dirty
        </button>
      </div>
    );
  },
}));

import { AgendaCalendarOverlay } from '@infra/pages/AgendaPage/components/admin/AgendaCalendarOverlay';
import type { IAgendaCalendarOverlayProps } from '@infra/pages/AgendaPage/components/admin/AgendaCalendarOverlay';

// ── i18n ─────────────────────────────────────────────────────────────────────────

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
  <QueryClientProvider client={new QueryClient()}>
    <I18nextProvider i18n={testI18n}>
      <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

// ── Fixtures ───────────────────────────────────────────────────────────────────

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Cliente',
  visitInfo: null,
  serviceName: 'Masaje Thai',
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
  makeWeekDay({ dateStr: '2026-05-23', label: 'SÁB', dateNumber: 23, citaCount: 0 }),
  makeWeekDay({ dateStr: '2026-05-24', label: 'DOM', dateNumber: 24, citaCount: 0 }),
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
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const props = { ...baseProps, onClose, onSuccess, ...overrides };
  render(<AgendaCalendarOverlay {...props} />, { wrapper: Wrapper });
  return { onClose, onSuccess };
}

/** Reads the `date` (2nd arg) of the most recent useAdminAgendaData call. */
function lastDayDate(): string | undefined {
  return dayDataFn.mock.calls.at(-1)?.[1] as string | undefined;
}

beforeEach(() => {
  dayDataReturn = emptyDay;
  weekDataReturn = { ...emptyWeek, weekDays: SEVEN_WEEK_DAYS, colorMap: { 10: 'a' } };
  citaByIdReturn = { cita: null, isLoading: false };
  vi.clearAllMocks();
});

// ── Structure ──────────────────────────────────────────────────────────────────

describe('AgendaCalendarOverlay — grid + surface', () => {
  it('renders the dialog with the three grid areas (week / kanban / form)', () => {
    renderOverlay();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // week
    expect(screen.getByRole('group', { name: 'Vista de semana' })).toBeInTheDocument();
    // kanban
    expect(screen.getByRole('region', { name: 'Citas del día seleccionado' })).toBeInTheDocument();
    // form (inline CitaModal)
    expect(screen.getByLabelText('Formulario de cita')).toBeInTheDocument();
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-mode', 'create');
  });

  it('does not render when open=false or when the user cannot manage citas', () => {
    const { rerender } = render(<AgendaCalendarOverlay {...baseProps} open={false} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<AgendaCalendarOverlay {...baseProps} canManage={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ── Week counter ─────────────────────────────────────────────────────────────

describe('AgendaCalendarOverlay — week counter', () => {
  it('shows the real per-day appointment count from useAdminWeekData', () => {
    renderOverlay();
    expect(screen.getByRole('button', { name: 'MIÉ 20, 3 citas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LUN 18, 2 citas' })).toBeInTheDocument();
    // empty day reads the localised zero microcopy (redundant with the tint channel)
    expect(screen.getByRole('button', { name: 'MAR 19, Sin citas' })).toBeInTheDocument();
  });

  it('marks the selected day pressed and today with aria-current=date', () => {
    renderOverlay();
    expect(screen.getByRole('button', { name: 'MIÉ 20, 3 citas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /JUE 21/ })).toHaveAttribute('aria-current', 'date');
  });
});

// ── Day selection re-scopes the kanban ──────────────────────────────────────────

describe('AgendaCalendarOverlay — day selection', () => {
  it('clicking a day marks it pressed and re-requests the day data for that date', () => {
    renderOverlay();
    expect(lastDayDate()).toBe('2026-05-20');

    fireEvent.click(screen.getByRole('button', { name: 'VIE 22, 1 cita' }));

    expect(screen.getByRole('button', { name: 'VIE 22, 1 cita' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(lastDayDate()).toBe('2026-05-22');
  });

  it('roving tabindex: only the selected day is a tab stop; Home/End move focus', () => {
    renderOverlay();
    const selected = screen.getByRole('button', { name: 'MIÉ 20, 3 citas' });
    expect(selected).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: /LUN 18/ })).toHaveAttribute('tabindex', '-1');

    selected.focus();
    fireEvent.keyDown(selected, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /DOM 24/ }));

    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /LUN 18/ }));
  });
});

// ── Kanban cards ─────────────────────────────────────────────────────────────

describe('AgendaCalendarOverlay — kanban cards', () => {
  it('renders card content (hour / service / therapist / room / centre) resolving the therapist', () => {
    dayDataReturn = {
      ...emptyDay,
      therapists: [{ id: 10, nombre: 'Ana', apellidos: 'García' } as IAgendaTherapist],
      appointments: [
        makeAppt({
          id: 1,
          therapistId: 10,
          startTime: '10:00',
          serviceName: 'Masaje Thai',
          sala: 'Sala 1',
        }),
      ],
    };
    renderOverlay();
    expect(
      screen.getByRole('button', {
        name: '10:00, Masaje Thai, sala Sala 1, con Ana García, en Centro Madrid',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Masaje Thai')).toBeInTheDocument();
  });

  it('unassigned cita uses localised placeholders (never "null")', () => {
    dayDataReturn = {
      ...emptyDay,
      unassignedAppointments: [
        makeAppt({
          id: 2,
          therapistId: null,
          clientName: null,
          sala: null,
          serviceName: 'Masaje Relax',
          estado: 'sin_asignar',
        }),
      ],
    };
    renderOverlay();
    const card = screen.getByRole('button', {
      name: '10:00, Masaje Relax, sala Sala por definir, con Sin asignar, en Centro Madrid',
    });
    expect(card).toBeInTheDocument();
    // scope to the card — "Sin asignar" is also the column header title
    expect(within(card).getByText('Sin asignar')).toBeInTheDocument();
    expect(within(card).getByText('Sala por definir')).toBeInTheDocument();
  });
});

// ── State → column partition ────────────────────────────────────────────────

describe('AgendaCalendarOverlay — kanban partition', () => {
  it('distributes the citas into the 2 columns by assignment (therapistId === null → Sin asignar)', () => {
    dayDataReturn = {
      ...emptyDay,
      appointments: [
        makeAppt({ id: 1, estado: 'pendiente', therapistId: 10 }),
        makeAppt({ id: 2, estado: 'confirmada', therapistId: 10 }),
        makeAppt({ id: 3, estado: 'en_curso', therapistId: 10 }),
      ],
      unassignedAppointments: [
        makeAppt({ id: 4, therapistId: null, estado: 'sin_asignar' }),
        makeAppt({ id: 5, therapistId: null, estado: 'sin_asignar' }),
      ],
    };
    renderOverlay();

    const sinAsignar = screen.getByRole('group', { name: 'Sin asignar' });
    const asignadas = screen.getByRole('group', { name: 'Asignadas' });

    // therapistId null × 2
    expect(within(sinAsignar).getByText('2')).toBeInTheDocument();
    expect(within(sinAsignar).getAllByRole('button')).toHaveLength(2);
    // therapistId 10 × 3
    expect(within(asignadas).getByText('3')).toBeInTheDocument();
    expect(within(asignadas).getAllByRole('button')).toHaveLength(3);
  });

  it('shows the localised empty state for columns with no citas', () => {
    dayDataReturn = {
      ...emptyDay,
      appointments: [makeAppt({ id: 1, estado: 'confirmada', therapistId: 10 })],
    };
    renderOverlay();
    expect(screen.getByText('No hay citas sin asignar')).toBeInTheDocument();
    expect(screen.queryByText('No hay citas asignadas')).not.toBeInTheDocument();
  });
});

// ── Embedded form ─────────────────────────────────────────────────────────────

describe('AgendaCalendarOverlay — embedded form', () => {
  it('create: pre-fills the form date with the overlay day', () => {
    renderOverlay();
    const form = screen.getByTestId('cita-form');
    expect(form).toHaveAttribute('data-mode', 'create');
    expect(form).toHaveAttribute('data-fecha', '2026-05-20');
  });

  it('edit: opens the form by citaId and repositions week + kanban to the cita day', () => {
    citaByIdReturn = {
      cita: { fechaHoraInicio: new Date('2026-05-22T10:00:00') },
      isLoading: false,
    };
    renderOverlay({ mode: 'edit', citaId: 99 });
    const form = screen.getByTestId('cita-form');
    expect(form).toHaveAttribute('data-mode', 'edit');
    expect(form).toHaveAttribute('data-citaid', '99');
    // repositioned to the cita's day
    expect(lastDayDate()).toBe('2026-05-22');
  });

  it('clicking a kanban card switches the form to edit for that cita', () => {
    dayDataReturn = {
      ...emptyDay,
      appointments: [makeAppt({ id: 42, estado: 'confirmada' })],
    };
    renderOverlay();
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-mode', 'create');

    fireEvent.click(screen.getByRole('button', { name: /10:00, Masaje Thai/ }));

    const form = screen.getByTestId('cita-form');
    expect(form).toHaveAttribute('data-mode', 'edit');
    expect(form).toHaveAttribute('data-citaid', '42');
  });
});

// ── Close affordances ─────────────────────────────────────────────────────────

describe('AgendaCalendarOverlay — close affordances', () => {
  it('calls onClose from the ✕ button', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', () => {
    const { onClose } = renderOverlay();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on a backdrop (scrim) click', () => {
    const { onClose } = renderOverlay();
    const scrim = screen.getByRole('dialog').parentElement!;
    fireEvent.click(scrim);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Unsaved-changes guard ────────────────────────────────────────────────────
// Filling in the create form then clicking a different kanban card used to
// silently discard it (the CitaModal remounts under a new `key`). Same risk
// closing via ✕/Escape/backdrop while dirty.

describe('AgendaCalendarOverlay — unsaved-changes guard', () => {
  function withOneCard() {
    dayDataReturn = {
      ...emptyDay,
      appointments: [makeAppt({ id: 42, estado: 'confirmada' })],
    };
  }

  it('NOT dirty: clicking a kanban card still switches immediately (no dialog)', () => {
    withOneCard();
    renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: /10:00, Masaje Thai/ }));
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-mode', 'edit');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
  });

  it('dirty: clicking a different kanban card shows a discard-confirmation dialog instead of switching', () => {
    withOneCard();
    renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));

    fireEvent.click(screen.getByRole('button', { name: /10:00, Masaje Thai/ }));

    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
    // still on the original (create) form — nothing switched yet
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-mode', 'create');
  });

  it('dirty + confirm discard: switches to the picked cita', () => {
    withOneCard();
    renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));
    fireEvent.click(screen.getByRole('button', { name: /10:00, Masaje Thai/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }));

    const form = screen.getByTestId('cita-form');
    expect(form).toHaveAttribute('data-mode', 'edit');
    expect(form).toHaveAttribute('data-citaid', '42');
    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
  });

  it('dirty + cancel discard: stays on the original form, dialog closes', () => {
    withOneCard();
    renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));
    fireEvent.click(screen.getByRole('button', { name: /10:00, Masaje Thai/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));

    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-mode', 'create');
  });

  it('dirty: the ✕ button asks for confirmation instead of closing immediately', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dirty: Escape asks for confirmation instead of closing immediately', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
  });

  it('dirty: a backdrop click asks for confirmation instead of closing immediately', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));

    const scrim = screen.getByRole('dialog').parentElement!;
    fireEvent.click(scrim);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
  });

  it('a successful save resets the guard: closing right after via stub-form-close needs no confirmation', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByTestId('stub-form-dirty'));
    fireEvent.click(screen.getByTestId('stub-form-success'));

    fireEvent.click(screen.getByTestId('stub-form-close'));

    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Decoupling: overlayDate is local, never mutates the background agenda ──────

describe('AgendaCalendarOverlay — overlayDate decoupling', () => {
  it('day selection and week navigation never invoke the parent callbacks', () => {
    // The overlay owns `overlayDate` locally; the only channels back to the
    // parent are onClose/onSuccess. Navigating/selecting must touch neither —
    // proving the background agenda's activeDate is never mutated.
    const { onClose, onSuccess } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: 'VIE 22, 1 cita' }));
    fireEvent.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('treats initialDate as a one-time copy: a later change does not reset the day', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { rerender } = render(
      <AgendaCalendarOverlay {...baseProps} onClose={onClose} onSuccess={onSuccess} />,
      { wrapper: Wrapper },
    );

    // user re-scopes the overlay to Friday
    fireEvent.click(screen.getByRole('button', { name: 'VIE 22, 1 cita' }));
    expect(lastDayDate()).toBe('2026-05-22');

    // the background agenda moves its own activeDate → initialDate prop changes
    rerender(
      <AgendaCalendarOverlay
        {...baseProps}
        initialDate="2026-06-15"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    // the overlay keeps the user's local selection (copy, not a live binding)
    expect(lastDayDate()).toBe('2026-05-22');
    expect(screen.getByRole('button', { name: 'VIE 22, 1 cita' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

// ── Embedded form ↔ overlay wiring ─────────────────────────────────────────────

describe('AgendaCalendarOverlay — form wiring', () => {
  it('create: re-prefills the form date when the selected day changes', () => {
    renderOverlay();
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-fecha', '2026-05-20');

    fireEvent.click(screen.getByRole('button', { name: 'VIE 22, 1 cita' }));

    // same form instance (create-new key), prefill.fecha re-drives to the new day
    expect(screen.getByTestId('cita-form')).toHaveAttribute('data-fecha', '2026-05-22');
  });

  it('keeps the create prefill identity stable across an unrelated re-render, only changing on day change', () => {
    // Root-cause guard: a background refetch settle (refetchOnWindowFocus) re-renders
    // the overlay without changing the selected day. The prefill handed to CitaModal
    // must keep the SAME object identity so CitaModal's prefill effect (deps
    // [open, mode, prefill]) does not re-fire and overwrite mid-form entries. A new
    // identity is expected ONLY when the day actually changes (re-drives fecha).
    prefillRecorder.refs.length = 0;
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { rerender } = render(
      <AgendaCalendarOverlay {...baseProps} onClose={onClose} onSuccess={onSuccess} />,
      { wrapper: Wrapper },
    );
    const firstRef = prefillRecorder.refs.at(-1);
    expect(firstRef).toBeDefined();

    // unrelated re-render (proxy for a background refetch settle): day unchanged
    rerender(
      <AgendaCalendarOverlay
        {...baseProps}
        centroName="Centro Madrid (renamed)"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );
    expect(prefillRecorder.refs.at(-1)).toBe(firstRef);

    // day change → new prefill identity (fecha re-drives to the new day)
    fireEvent.click(screen.getByRole('button', { name: 'VIE 22, 1 cita' }));
    const afterDayChange = prefillRecorder.refs.at(-1);
    expect(afterDayChange).not.toBe(firstRef);
    expect((afterDayChange as { fecha?: string }).fecha).toBe('2026-05-22');
  });

  it('forwards the embedded form onSuccess and onClose to the parent', () => {
    const { onClose, onSuccess } = renderOverlay();

    fireEvent.click(screen.getByTestId('stub-form-success'));
    expect(onSuccess).toHaveBeenCalledWith('created', 'Cliente Uno');

    fireEvent.click(screen.getByTestId('stub-form-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── a11y ─────────────────────────────────────────────────────────────────────

describe('AgendaCalendarOverlay — dialog a11y', () => {
  it('labels the dialog by its title heading', () => {
    renderOverlay();
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const title = document.getElementById(labelledBy!);
    expect(title).toHaveTextContent('Nueva cita');
  });

  it('does not close when the click lands inside the dialog (only the scrim closes)', () => {
    const { onClose } = renderOverlay();
    // backdrop close is gated on target === currentTarget; an inner click bubbles
    // to the scrim but target is the card, so it must NOT close.
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus on open and returns it to the trigger on close', () => {
    const Harness = ({ open }: { open: boolean }) => (
      <>
        <button type="button" data-testid="trigger">
          abrir
        </button>
        {open ? (
          <AgendaCalendarOverlay {...baseProps} open onClose={vi.fn()} onSuccess={vi.fn()} />
        ) : null}
      </>
    );

    const { rerender } = render(<Harness open={false} />, { wrapper: Wrapper });
    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(<Harness open />);
    // focus was pulled off the trigger and into the dialog surface
    const dialog = screen.getByRole('dialog');
    expect(document.activeElement).not.toBe(trigger);
    expect(dialog.contains(document.activeElement)).toBe(true);

    rerender(<Harness open={false} />);
    // …and returned to the opener when the overlay unmounts
    expect(document.activeElement).toBe(trigger);
  });
});
