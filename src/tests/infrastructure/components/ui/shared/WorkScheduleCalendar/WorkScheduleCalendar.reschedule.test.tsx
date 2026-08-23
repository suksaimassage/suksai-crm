/**
 * WorkScheduleCalendar.reschedule.test.tsx
 *
 * Surface B — the confirm-Dialog gate + read-only contract, end-to-end on the
 * REAL WorkScheduleCalendar (mounted with the real terapeutas i18n + theme, like
 * the dayA11y test). These assert the user-visible behaviour the Analyst/Designer
 * specs require:
 *
 *   READ-ONLY (Latent Defect #1):
 *     - a recurrente (rec:) shift is NOT draggable in Week AND Day views, shows a
 *       lock cue, and its accessible name carries the read-only hint; an
 *       especifico (esp:) shift stays draggable.
 *
 *   CONFIRM FLOW (Week-drag drives the time shape — fully drivable in jsdom):
 *     - a changed drop opens the common Dialog (does NOT persist on drop);
 *     - the card does NOT move until Confirm (pessimistic, OQ-B9);
 *     - Confirm calls onShiftReschedule(proposed) once and only THEN applies the
 *       local move;
 *     - when onShiftReschedule returns false (consumer rejected: overlap/invalid),
 *       the Dialog closes WITHOUT applying the move (no false success);
 *     - Cancel and Escape revert with no commit;
 *     - rescheduleSubmitting drives the Confirm button's loading/disabled state.
 *
 *   DIALOG SHAPES (Day cross-row drag drives employee/both):
 *     - reassignment (employee unchanged-time) → "¿Reasignar…" title + reassignment
 *       badge; reassignment WITH a time change → "¿Reasignar y mover…" title.
 *
 * Day-view drag is gesture-based and reads element rects for its coordinate math.
 * jsdom returns all-zero rects, so we stub getBoundingClientRect to zero and snap
 * the math to a single known constant (labelWidth for the 'xs' density = 160).
 * requestAnimationFrame is stubbed synchronous so the preview/commit are inline.
 * Interactions use fireEvent (no @testing-library/user-event dependency).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within, cleanup } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { theme } from '@infra/styles/themes/light.theme';
import esTerapeutas from '@infra/i18n/locales/es/terapeutas.json';
import esCommon from '@infra/i18n/locales/es/common.json';
import { WorkScheduleCalendar } from '@infra/components/ui/shared/WorkScheduleCalendar';
import type { Employee, Shift } from '@infra/components/ui/shared/WorkScheduleCalendar';

// ── i18n (real ES terapeutas + common namespaces) ──────────────────────────────
// `common` is loaded because the Dialog primitive resolves its loading label from
// `common:loading` ("Cargando…") — without it the confirm button would show the
// bare key while submitting.
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['terapeutas', 'common'],
  defaultNS: 'terapeutas',
  resources: { es: { terapeutas: esTerapeutas, common: esCommon } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ───────────────────────────────────────────────────────────────────
const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Ana', role: 'Masaje' },
  { id: '2', name: 'Bruno', role: 'Masaje' },
];

// 2026-05-18 is a Monday → week Sun 05-17 .. Sat 05-23.
const MONDAY = new Date(2026, 4, 18);
const MON_KEY = '2026-05-18';
const TUE_KEY = '2026-05-19';

/** An editable especifico shift for Ana on Monday. */
const ESP: Shift = {
  id: 'esp:42',
  employeeId: '1',
  date: MON_KEY,
  startTime: '10:00',
  endTime: '12:00',
  color: 'primary',
};

/** A read-only recurrente occurrence for Ana on Monday (carries a label cue). */
const REC: Shift = {
  id: 'rec:5:2026-05-18',
  employeeId: '1',
  date: MON_KEY,
  startTime: '09:00',
  endTime: '13:00',
  color: 'secondary',
  label: 'Recurrente',
};

const isRec = (s: Shift): boolean => s.id.startsWith('rec:');

/**
 * A typed onShiftReschedule mock. Typing the signature (rather than inferring from
 * `() => true`) keeps `mock.calls[0][0]` a `Shift` so the proposed-shift assertions
 * type-check without an `as` cast.
 */
const rescheduleFn = (ret: boolean) => vi.fn<(shift: Shift) => boolean | undefined>(() => ret);

// Real-ES strings the assertions key on (from terapeutas.json).
const TITLE_TIME = '¿Mover este turno?';
const TITLE_EMPLOYEE = '¿Reasignar este turno?';
const TITLE_BOTH = '¿Reasignar y mover este turno?';
const REASSIGN_BADGE = 'Reasignación';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// READ-ONLY gating (Latent Defect #1)
// ════════════════════════════════════════════════════════════════════════════

describe('WorkScheduleCalendar — recurrente shifts are read-only (not draggable)', () => {
  it('Week view: a recurrente card is non-draggable; an especifico card is draggable', () => {
    render(
      <WorkScheduleCalendar
        employees={EMPLOYEES}
        shifts={[ESP, REC]}
        initialDate={MONDAY}
        initialView="week"
        isShiftReadOnly={isRec}
        onShiftReschedule={() => true}
      />,
      { wrapper: Wrapper },
    );

    // esp: card → draggable; rec: card → not draggable. Both addressed by their
    // accessible name. formatTimeRange renders 12h "h:mm AM/PM – h:mm AM/PM"; the
    // read-only one carries the hint suffix.
    const espCard = screen.getByRole('button', { name: /Ana.*10:00 AM/ });
    expect(espCard).toHaveAttribute('draggable', 'true');

    const recCard = screen.getByRole('button', { name: /recurrente, no editable/ });
    expect(recCard).toHaveAttribute('draggable', 'false');
  });

  it('Week view: the recurrente accessible name includes the read-only hint', () => {
    render(
      <WorkScheduleCalendar
        employees={EMPLOYEES}
        shifts={[REC]}
        initialDate={MONDAY}
        initialView="week"
        isShiftReadOnly={isRec}
        onShiftReschedule={() => true}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: /recurrente, no editable/ })).toBeInTheDocument();
  });

  it('Day view: a recurrente block exposes no resize handle and is not pointer-draggable', () => {
    render(
      <WorkScheduleCalendar
        employees={[EMPLOYEES[0]]}
        shifts={[REC]}
        initialDate={MONDAY}
        initialView="day"
        density="xs"
        isShiftReadOnly={isRec}
        onShiftReschedule={() => true}
      />,
      { wrapper: Wrapper },
    );

    // The resize handle is a div labelled workSchedule.resizeShiftAriaLabel, only
    // rendered for editable shifts → absent for the read-only recurrente block.
    expect(
      screen.queryByLabelText(testI18n.t('workSchedule.resizeShiftAriaLabel')),
    ).not.toBeInTheDocument();
    // The block still exists and carries the read-only hint in its name.
    expect(screen.getByRole('button', { name: /recurrente, no editable/ })).toBeInTheDocument();
  });

  it('Day view: an especifico block DOES expose a resize handle (editable)', () => {
    render(
      <WorkScheduleCalendar
        employees={[EMPLOYEES[0]]}
        shifts={[ESP]}
        initialDate={MONDAY}
        initialView="day"
        density="xs"
        isShiftReadOnly={isRec}
        onShiftReschedule={() => true}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByLabelText(testI18n.t('workSchedule.resizeShiftAriaLabel')),
    ).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// CONFIRM FLOW — Week drag (time shape), fully drivable in jsdom
// ════════════════════════════════════════════════════════════════════════════

/** The 7 week columns in render order (Sun..Sat); index by weekday offset from Sunday. */
function weekColumns(): HTMLElement[] {
  return screen.getAllByRole('gridcell');
}
/** Monday is index 1 (Sun=0); Tuesday index 2. */
const colFor = (key: string): HTMLElement => {
  const offset: Record<string, number> = { [MON_KEY]: 1, [TUE_KEY]: 2 };
  return weekColumns()[offset[key]];
};

function renderWeek(props: Partial<React.ComponentProps<typeof WorkScheduleCalendar>> = {}) {
  return render(
    <WorkScheduleCalendar
      employees={EMPLOYEES}
      shifts={[ESP]}
      initialDate={MONDAY}
      initialView="week"
      isShiftReadOnly={isRec}
      onShiftReschedule={props.onShiftReschedule ?? (() => true)}
      {...props}
    />,
    { wrapper: Wrapper },
  );
}

/** Matches Ana's 10:00 shift card/block by accessible name (12h AM/PM format). */
const ANA_10AM = /Ana.*10:00 AM/;

/**
 * Drag the Ana/Monday esp card onto Tuesday's column. dragStart and drop are in
 * SEPARATE act() blocks: handleDragStart sets `draggingShift` via setState, and the
 * column's onDrop→handleDrop closure only sees that value after React commits the
 * re-render. One combined act() would leave handleDrop reading a stale (null) shift.
 */
function dragMondayToTuesday(): void {
  const card = within(colFor(MON_KEY)).getByRole('button', { name: ANA_10AM });
  act(() => {
    fireEvent.dragStart(card);
  });
  act(() => {
    fireEvent.drop(colFor(TUE_KEY));
  });
}

describe('WorkScheduleCalendar — Week drag opens the confirm Dialog (deferred persist)', () => {
  it('a changed drop opens the Dialog and does NOT call onShiftReschedule yet', () => {
    const onShiftReschedule = rescheduleFn(true);
    renderWeek({ onShiftReschedule });

    dragMondayToTuesday();

    // Dialog visible with the time-only title; the consumer commit has NOT fired
    // (persist is deferred to Confirm).
    expect(screen.getByText(TITLE_TIME)).toBeInTheDocument();
    expect(onShiftReschedule).not.toHaveBeenCalled();
    // Time-only shape carries NO reassignment badge.
    expect(screen.queryByText(REASSIGN_BADGE)).not.toBeInTheDocument();
  });

  it('the card does NOT move to the target day until Confirm (pessimistic)', () => {
    renderWeek();
    dragMondayToTuesday();

    // While the Dialog is open, Ana's card is still in Monday's column, not Tuesday.
    expect(within(colFor(MON_KEY)).getByRole('button', { name: ANA_10AM })).toBeInTheDocument();
    expect(
      within(colFor(TUE_KEY)).queryByRole('button', { name: ANA_10AM }),
    ).not.toBeInTheDocument();
  });

  it('Confirm calls onShiftReschedule(proposed) once, then applies the move', () => {
    const onShiftReschedule = rescheduleFn(true);
    renderWeek({ onShiftReschedule });
    dragMondayToTuesday();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    });

    expect(onShiftReschedule).toHaveBeenCalledTimes(1);
    const proposed = onShiftReschedule.mock.calls[0][0];
    expect(proposed.id).toBe('esp:42');
    expect(proposed.date).toBe(TUE_KEY); // moved to Tuesday
    expect(proposed.employeeId).toBe('1'); // same therapist (week move)
    // Dialog closed and the card now lives in Tuesday's column (local optimistic move).
    expect(screen.queryByText(TITLE_TIME)).not.toBeInTheDocument();
    expect(within(colFor(TUE_KEY)).getByRole('button', { name: ANA_10AM })).toBeInTheDocument();
  });

  it('when onShiftReschedule returns false the Dialog closes WITHOUT applying the move', () => {
    const onShiftReschedule = rescheduleFn(false); // consumer rejected (overlap/invalid)
    renderWeek({ onShiftReschedule });
    dragMondayToTuesday();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    });

    expect(onShiftReschedule).toHaveBeenCalledTimes(1);
    // Dialog closed; the card stayed on Monday (no false-success optimistic move).
    expect(screen.queryByText(TITLE_TIME)).not.toBeInTheDocument();
    expect(within(colFor(MON_KEY)).getByRole('button', { name: ANA_10AM })).toBeInTheDocument();
    expect(
      within(colFor(TUE_KEY)).queryByRole('button', { name: ANA_10AM }),
    ).not.toBeInTheDocument();
  });

  it('Cancel reverts: no commit, card stays put', () => {
    const onShiftReschedule = rescheduleFn(true);
    renderWeek({ onShiftReschedule });
    dragMondayToTuesday();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    });

    expect(onShiftReschedule).not.toHaveBeenCalled();
    expect(screen.queryByText(TITLE_TIME)).not.toBeInTheDocument();
    expect(within(colFor(MON_KEY)).getByRole('button', { name: ANA_10AM })).toBeInTheDocument();
  });

  it('Escape closes the Dialog with no commit (revert)', () => {
    const onShiftReschedule = rescheduleFn(true);
    renderWeek({ onShiftReschedule });
    dragMondayToTuesday();

    expect(screen.getByText(TITLE_TIME)).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });

    expect(onShiftReschedule).not.toHaveBeenCalled();
    expect(screen.queryByText(TITLE_TIME)).not.toBeInTheDocument();
  });

  it('rescheduleSubmitting disables the Confirm button (loading)', () => {
    renderWeek({ rescheduleSubmitting: true });
    dragMondayToTuesday();

    // Common Dialog renders the confirm button disabled + the localized
    // common:loading label ("Cargando…") while loading (decorative spinner is
    // aria-hidden, so that text is the whole accessible name).
    const confirm = screen.getByRole('button', { name: 'Cargando…' });
    expect(confirm).toBeDisabled();
  });

  it('a no-net-change drop (same column) does NOT open the Dialog', () => {
    const onShiftReschedule = rescheduleFn(true);
    renderWeek({ onShiftReschedule });

    const card = screen.getByRole('button', { name: ANA_10AM });
    act(() => {
      fireEvent.dragStart(card);
    });
    act(() => {
      fireEvent.drop(colFor(MON_KEY)); // dropped back on its own column
    });

    expect(screen.queryByText(TITLE_TIME)).not.toBeInTheDocument();
    expect(onShiftReschedule).not.toHaveBeenCalled();
  });

  it('does NOT open a Dialog when no onShiftReschedule channel is wired (legacy immediate apply)', () => {
    // Backwards-compat: with no reschedule prop, a Week move applies immediately
    // (no Dialog). onShiftUpdate is the legacy persist channel.
    const onShiftUpdate = vi.fn();
    render(
      <WorkScheduleCalendar
        employees={EMPLOYEES}
        shifts={[ESP]}
        initialDate={MONDAY}
        initialView="week"
        onShiftUpdate={onShiftUpdate}
      />,
      { wrapper: Wrapper },
    );
    const card = screen.getByRole('button', { name: ANA_10AM });
    act(() => {
      fireEvent.dragStart(card);
    });
    act(() => {
      fireEvent.drop(colFor(TUE_KEY));
    });

    expect(screen.queryByText(TITLE_TIME)).not.toBeInTheDocument();
    // Legacy path persisted immediately via onShiftUpdate with the new date.
    expect(onShiftUpdate).toHaveBeenCalledTimes(1);
    expect((onShiftUpdate.mock.calls[0][0] as Shift).date).toBe(TUE_KEY);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DIALOG SHAPES — Day cross-row drag (employee / both)
// ════════════════════════════════════════════════════════════════════════════
//
// Day-view DnD reads element rects. We zero every getBoundingClientRect so the
// container origin is (0,0); with density 'xs' the label gutter is 160px and the
// measured ruler height is 0 in jsdom, so:
//   relX = clientX - 160 ,  relY = clientY ,  rowHeight = 40
// We press the block at clientX = 0 (block rect left is 0 → pointerOffsetX = 0),
// then release at a clientX that snaps the start where we want, on the target row.
//   startMin = 540 + ((clientXUp - 160) / 96) * 60
//   employee row index = floor(clientYUp / 40)

const XS_LABEL_WIDTH = 160;
const XS_ROW_HEIGHT = 40;
const RANGE_START_MIN = 9 * 60;
const SLOT_WIDTH = 96;
/** clientXUp that lands the move's start at the given minutes-of-day. */
const upXForStart = (startMin: number): number =>
  ((startMin - RANGE_START_MIN) / 60) * SLOT_WIDTH + XS_LABEL_WIDTH;
/** clientYUp landing on a given employee row index. */
const upYForRow = (rowIdx: number): number => rowIdx * XS_ROW_HEIGHT + 5;

function renderDay(onShiftReschedule = rescheduleFn(true)) {
  render(
    <WorkScheduleCalendar
      employees={EMPLOYEES}
      shifts={[ESP]}
      initialDate={MONDAY}
      initialView="day"
      density="xs"
      isShiftReadOnly={isRec}
      onShiftReschedule={onShiftReschedule}
    />,
    { wrapper: Wrapper },
  );
  return onShiftReschedule;
}

/** Press Ana's Day block at x=0 and drag-release to (clientXUp, clientYUp). */
function dayDragTo(clientXUp: number, clientYUp: number): void {
  const block = screen.getByRole('button', { name: ANA_10AM });
  act(() => {
    fireEvent.pointerDown(block, { clientX: 0, clientY: 5 });
  });
  act(() => {
    fireEvent.pointerMove(document, { clientX: clientXUp, clientY: clientYUp });
  });
  act(() => {
    fireEvent.pointerUp(document, { clientX: clientXUp, clientY: clientYUp });
  });
}

describe('WorkScheduleCalendar — Day cross-row drag picks the reassignment Dialog shape', () => {
  beforeEach(() => {
    // Zero all rects so the coordinate math reduces to the documented constants.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 0, 0),
    );
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  it('time UNCHANGED + employee change → "¿Reasignar este turno?" with a reassignment badge', () => {
    renderDay();
    // Start stays 10:00 (600) → upX for 600; drop on Bruno's row (index 1).
    dayDragTo(upXForStart(600), upYForRow(1));

    expect(screen.getByText(TITLE_EMPLOYEE)).toBeInTheDocument();
    expect(screen.getByText(REASSIGN_BADGE)).toBeInTheDocument();
    // The destination therapist (Bruno) is named in the summary — scoped to the
    // Dialog (Bruno's row also exists in the day grid behind it).
    const dialog = screen.getByRole('dialog', { name: TITLE_EMPLOYEE });
    expect(within(dialog).getByText(/Bruno/)).toBeInTheDocument();
  });

  it('time change + employee change → "¿Reasignar y mover este turno?" with a badge', () => {
    renderDay();
    // Start to 11:00 (660) AND Bruno's row → both changed.
    dayDragTo(upXForStart(660), upYForRow(1));

    expect(screen.getByText(TITLE_BOTH)).toBeInTheDocument();
    expect(screen.getByText(REASSIGN_BADGE)).toBeInTheDocument();
  });

  it('Confirm on a reassignment commits the proposed shift with the NEW employeeId', () => {
    const onShiftReschedule = renderDay();
    dayDragTo(upXForStart(600), upYForRow(1));

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    });

    expect(onShiftReschedule).toHaveBeenCalledTimes(1);
    const proposed = onShiftReschedule.mock.calls[0][0];
    expect(proposed.employeeId).toBe('2'); // reassigned to Bruno
    expect(proposed.startTime).toBe('10:00'); // time unchanged
  });
});
