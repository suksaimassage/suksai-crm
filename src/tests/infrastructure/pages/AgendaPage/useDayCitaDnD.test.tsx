/**
 * useDayCitaDnD.test.tsx
 *
 * Behavioural tests for the admin DAY-grid drag & drop gesture hook (Surface A).
 * Day-view sibling of useWeekCitaDnD: the ONLY axis difference is the horizontal
 * one — here each column is a THERAPIST (hit-test → therapistId), the date is
 * fixed (= activeDate). A drag both:
 *   - VERTICAL  → a new 30-min start (snap), end = start + durationMin (MOVE-ONLY).
 *   - HORIZONTAL→ a new therapist column (reassignment).
 * The hook is move-only and pessimistic: it NEVER moves the real block; on a net
 * change (start time changed OR therapist column changed) it calls onDrop(snapshot)
 * with the snapped destination.
 *
 * ⚠️ Unlike useWeekCitaDnD (which has the documented BUG-01 — `finish()` nulls the
 * intent ref BEFORE computing the destination, so its net-change drops never fire),
 * the day hook's `finish()` captures `const intent = intentRef.current` FIRST and
 * computes `computePreview(ue, intent)` off that local AFTER nulling the ref. So the
 * day hook fires onDrop correctly today — these net-change cases PASS (they are the
 * correct contract, and the day implementation already satisfies it).
 *
 * Harness rationale (mirrors the week test): the hook attaches DOCUMENT-level pointer
 * listeners and reads getBoundingClientRect of the therapist tracks + the dragged
 * block. jsdom returns all-zero rects, so a tiny harness wires beginDrag/registerTrack
 * to real DOM nodes and stubs those nodes' rects. Interactions use `fireEvent`
 * (pointerDown on the block, pointerMove/pointerUp on document, keydown for Escape) —
 * `@testing-library/user-event` is NOT a project dependency. requestAnimationFrame is
 * queued and flushed at a real frame boundary so the RAF-throttled preview settles.
 *
 * Geometry mirrors the agenda day constants (slotHeight 60, dayStart 10, dayEnd 21):
 *   - origin therapist 10 occupies x ∈ [0,100]
 *   - other  therapist 11 occupies x ∈ [100,200]
 *   - both tracks have top = 0
 *   - the block (12:00, 60 min) sits at top = timeToTopOffset('12:00',10,60) = 240
 *   - the press grabs the block at its top (pointerOffsetY = 0), so during the
 *     gesture relYTop === clientY and topOffsetToTime(clientY) gives the slot.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import {
  useDayCitaDnD,
  UNASSIGNED_COLUMN,
  type IDayRescheduleDrop,
  type IDayDnDTherapist,
} from '@infra/pages/AgendaPage/components/admin/useDayCitaDnD';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TUserId } from '@domain/types';

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORIGIN_TH = 10;
const OTHER_TH = 11;
const ACTIVE_DATE = '2026-06-09';

const THERAPISTS: readonly IDayDnDTherapist[] = [
  { id: ORIGIN_TH, nombre: 'Naree', apellidos: 'Siri' },
  { id: OTHER_TH, nombre: 'Som', apellidos: 'Chai' },
];

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: ORIGIN_TH,
  startTime: '12:00',
  endTime: '13:00',
  durationMin: 60,
  clientName: 'Ana',
  visitInfo: null,
  serviceName: 'Masaje',
  sala: 'Sala 1',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 6000,
  ...overrides,
});

/** Fixed rects per therapistId — assigned to each track node after render. */
const TRACK_RECTS: Record<number, DOMRect> = {
  [ORIGIN_TH]: new DOMRect(0, 0, 100, 840),
  [OTHER_TH]: new DOMRect(100, 0, 100, 840),
};
// The block's own rect (read once in beginDrag for the grab offset). top 240 =
// the 12:00 slot; height 120 = 60 min.
const BLOCK_RECT = new DOMRect(4, 240, 92, 120);

interface IHarnessProps {
  readonly appts: readonly IAgendaAppointment[];
  readonly onDrop: (drop: IDayRescheduleDrop) => void;
  /** Appointments in the OTHER therapist column — feeds the advisory overlap hint. */
  readonly otherAppts?: readonly IAgendaAppointment[];
}

/**
 * Renders two therapist tracks and one draggable block (the first appt) in the
 * origin column. Each track registers itself; we stub rects (jsdom returns all-zero
 * rects) so the hook's hit-testing sees deterministic geometry.
 */
const Harness = ({ appts, onDrop, otherAppts = [] }: IHarnessProps): React.ReactElement => {
  const apptsByTherapist = new Map<TUserId, readonly IAgendaAppointment[]>([
    [ORIGIN_TH, appts],
    [OTHER_TH, otherAppts],
  ]);

  const { draggingId, preview, dropTargetColumnId, registerTrack, beginDrag } = useDayCitaDnD({
    therapists: THERAPISTS,
    apptsByTherapist,
    activeDate: ACTIVE_DATE,
    onDrop,
  });

  const registerWithRect = (therapistId: number) => (el: HTMLElement | null) => {
    if (el !== null) {
      el.getBoundingClientRect = () => TRACK_RECTS[therapistId];
    }
    registerTrack(therapistId, el);
  };

  return (
    <div>
      <div
        data-testid={`track-${ORIGIN_TH}`}
        ref={registerWithRect(ORIGIN_TH)}
        data-drop-target={dropTargetColumnId === ORIGIN_TH ? 'true' : 'false'}
      >
        {appts.map((a) => (
          <button
            key={a.id}
            type="button"
            data-testid={`block-${a.id}`}
            data-dragging={draggingId === a.id ? 'true' : 'false'}
            ref={(el) => {
              if (el !== null) el.getBoundingClientRect = () => BLOCK_RECT;
            }}
            onPointerDown={(e) => {
              beginDrag(a, ORIGIN_TH, e);
            }}
          >
            {a.clientName}
          </button>
        ))}
      </div>
      <div
        data-testid={`track-${OTHER_TH}`}
        ref={registerWithRect(OTHER_TH)}
        data-drop-target={dropTargetColumnId === OTHER_TH ? 'true' : 'false'}
      />
      <output data-testid="preview-startTime">{preview?.startTime ?? ''}</output>
      <output data-testid="preview-endTime">{preview?.endTime ?? ''}</output>
      <output data-testid="preview-therapistId">{preview ? String(preview.columnId) : ''}</output>
      <output data-testid="preview-overlap">{preview ? String(preview.overlap) : ''}</output>
    </div>
  );
};

// ── Manual rAF queue ────────────────────────────────────────────────────────
// The hook RAF-throttles preview computation: `intent.rafId = requestAnimationFrame(cb)`
// and the cb clears `intent.rafId = null`. A SYNCHRONOUS stub breaks that — the cb
// runs and nulls rafId, but the outer assignment then overwrites rafId with the
// return value, so the throttle stays "armed" and every SUBSEQUENT move is dropped.
// Instead we queue callbacks and flush them AFTER the assignment completes, exactly
// reproducing a real frame boundary (rafId is set, then later cleared by the cb).

let rafQueue: FrameRequestCallback[] = [];
let rafSpy: ReturnType<typeof vi.spyOn>;
let cafSpy: ReturnType<typeof vi.spyOn>;

const flushRAF = (): void => {
  const q = rafQueue;
  rafQueue = [];
  for (const cb of q) cb(0);
};

beforeEach(() => {
  rafQueue = [];
  rafSpy = vi
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length; // non-zero handle
    });
  cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  rafSpy.mockRestore();
  cafSpy.mockRestore();
});

/** Press the block at its top-left grab point (pointerOffsetY = 0). */
const press = (id: number, clientX = 50, clientY = 240): void => {
  act(() => {
    fireEvent.pointerDown(screen.getByTestId(`block-${id}`), { button: 0, clientX, clientY });
  });
};
const move = (clientX: number, clientY: number): void => {
  act(() => {
    fireEvent.pointerMove(document, { clientX, clientY });
    // Flush the throttled compute scheduled by THIS move so the preview state
    // settles before assertions (a real frame boundary).
    flushRAF();
  });
};
const up = (clientX: number, clientY: number): void => {
  act(() => {
    fireEvent.pointerUp(document, { clientX, clientY });
  });
};

// ════════════════════════════════════════════════════════════════════════════
// 5px activation threshold — click vs drag must never conflict
// ════════════════════════════════════════════════════════════════════════════

describe('useDayCitaDnD — activation threshold (5px)', () => {
  it('does NOT begin a drag for a sub-threshold move (treated as a click)', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    // Move 3px (√(2²+2²) ≈ 2.83) — below the 5px threshold.
    move(52, 242);
    expect(screen.getByTestId('block-1')).toHaveAttribute('data-dragging', 'false');
    // Release in a different slot would normally be a change, but since the drag
    // never armed, no reschedule is emitted (it falls through to onClick).
    up(50, 360);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('arms the drag once movement crosses the 5px threshold', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    // Move 10px → past threshold → dragging.
    move(50, 250);
    expect(screen.getByTestId('block-1')).toHaveAttribute('data-dragging', 'true');
  });

  it('ignores a non-left button press (no gesture starts)', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    act(() => {
      fireEvent.pointerDown(screen.getByTestId('block-1'), {
        button: 2,
        clientX: 50,
        clientY: 240,
      });
    });
    move(50, 360);
    up(50, 360);
    expect(onDrop).not.toHaveBeenCalled();
    expect(screen.getByTestId('block-1')).toHaveAttribute('data-dragging', 'false');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Vertical preview snapping (30-min grid)
// ════════════════════════════════════════════════════════════════════════════

describe('useDayCitaDnD — vertical snapping', () => {
  it('snaps the preview start to the 30-min grid', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // clientY 375 → relYTop 375 → 187.5 min → snaps to 180 min → 13:00.
    move(50, 375);
    expect(screen.getByTestId('preview-startTime')).toHaveTextContent('13:00');
  });

  it('reports the preview in the ORIGIN therapist column when the pointer stays in it', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    move(50, 360);
    expect(screen.getByTestId('preview-therapistId')).toHaveTextContent(String(ORIGIN_TH));
    expect(screen.getByTestId(`track-${ORIGIN_TH}`)).toHaveAttribute('data-drop-target', 'true');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Horizontal hit-test — the therapist column under the pointer
// ════════════════════════════════════════════════════════════════════════════

describe('useDayCitaDnD — horizontal therapist hit-test', () => {
  it('hit-tests the OTHER therapist column when the pointer moves into it', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // clientX 150 → inside the other track's [100,200] range.
    move(150, 240);
    expect(screen.getByTestId('preview-therapistId')).toHaveTextContent(String(OTHER_TH));
    expect(screen.getByTestId(`track-${OTHER_TH}`)).toHaveAttribute('data-drop-target', 'true');
  });

  it('a pointer with no column under it falls back to the origin column', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // clientX -50 → outside every track; resolveTargetColumn falls back to origin.
    move(-50, 360);
    expect(screen.getByTestId('preview-therapistId')).toHaveTextContent(String(ORIGIN_TH));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Drop semantics — net change fires onDrop, same slot does not
// ════════════════════════════════════════════════════════════════════════════

describe('useDayCitaDnD — drop fires onDrop only on a net change', () => {
  it('a time change in the SAME therapist column emits proposed.therapistId === origin + the new hour', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(50, 360); // arm + preview
    up(50, 360); // drop at 13:00 in the origin therapist column
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IDayRescheduleDrop;
    expect(drop.citaId).toBe(1);
    expect(drop.dateStr).toBe(ACTIVE_DATE);
    // Same therapist on both ends; only the hour moved.
    expect(drop.origin.therapistId).toBe(ORIGIN_TH);
    expect(drop.proposed.therapistId).toBe(ORIGIN_TH);
    expect(drop.origin.startTime).toBe('12:00');
    expect(drop.proposed.startTime).toBe('13:00');
    expect(drop.proposed.endTime).toBe('14:00');
  });

  it('a therapist-column change (same time) emits the destination therapistId', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(150, 240); // into the other column, same vertical slot
    up(150, 240);
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IDayRescheduleDrop;
    expect(drop.proposed.therapistId).toBe(OTHER_TH);
    expect(drop.proposed.startTime).toBe('12:00'); // time unchanged
    // The destination therapist display name comes from the descriptor list.
    expect(drop.proposed.therapistName).toBe('Som Chai');
    expect(drop.origin.therapistName).toBe('Naree Siri');
  });

  it('derives the proposed endTime as start + durationMin (move-only, 90-min service)', () => {
    const onDrop = vi.fn();
    // 90-min service: 12:00–13:30. Move to 14:00 start → end must be 15:30.
    render(
      <Harness
        appts={[makeAppt({ durationMin: 90, startTime: '12:00', endTime: '13:30' })]}
        onDrop={onDrop}
      />,
    );
    press(1, 50, 240);
    // clientY 480 → relYTop 480 → 240 min → 14:00.
    move(50, 480);
    up(50, 480);
    const drop = onDrop.mock.calls[0][0] as IDayRescheduleDrop;
    expect(drop.proposed.startTime).toBe('14:00');
    expect(drop.proposed.endTime).toBe('15:30');
    expect(drop.durationMin).toBe(90);
  });

  it('a drop in the SAME slot AND same therapist (no net change) does NOT fire onDrop', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    // Move enough to arm the drag, then return to the original slot before release.
    move(50, 360);
    up(50, 240); // back at 12:00 in the origin column → proposed === origin
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('forwards the client + service names and the fixed dateStr in the snapshot', () => {
    const onDrop = vi.fn();
    render(
      <Harness
        appts={[makeAppt({ clientName: 'Lucía', serviceName: 'Aromaterapia' })]}
        onDrop={onDrop}
      />,
    );
    press(1, 50, 240);
    move(50, 360);
    up(50, 360);
    const drop = onDrop.mock.calls[0][0] as IDayRescheduleDrop;
    expect(drop.clientName).toBe('Lucía');
    expect(drop.serviceName).toBe('Aromaterapia');
    expect(drop.dateStr).toBe(ACTIVE_DATE);
  });

  it('a null client name is forwarded verbatim (the parent maps it to a placeholder)', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt({ clientName: null })]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(50, 360);
    up(50, 360);
    const drop = onDrop.mock.calls[0][0] as IDayRescheduleDrop;
    expect(drop.clientName).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Escape cancels the gesture (drag is not a trap — WCAG 2.1.2)
// ════════════════════════════════════════════════════════════════════════════

describe('useDayCitaDnD — Escape cancels', () => {
  it('Escape during a drag cancels it with no onDrop, and the later pointerup is inert', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(50, 360); // armed + would be a change
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onDrop).not.toHaveBeenCalled();
    // Dragging state cleared.
    expect(screen.getByTestId('block-1')).toHaveAttribute('data-dragging', 'false');
    // A pointerup after cancel must do nothing (the intent was torn down).
    up(50, 360);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('a non-Escape key does NOT cancel the gesture', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(50, 360);
    act(() => {
      fireEvent.keyDown(document, { key: 'a' });
    });
    // Still dragging — the gesture survives an unrelated key (Escape is the only
    // cancel key). The preview also remains live.
    expect(screen.getByTestId('block-1')).toHaveAttribute('data-dragging', 'true');
    expect(screen.getByTestId('preview-startTime')).toHaveTextContent('13:00');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Advisory overlap flag in the preview (never blocks the drop)
// ════════════════════════════════════════════════════════════════════════════

describe('useDayCitaDnD — advisory overlap detection', () => {
  it('flags overlap=true when the snapped slot collides with another block in the TARGET column', () => {
    const dragged = makeAppt({ id: 1, startTime: '12:00', endTime: '13:00', durationMin: 60 });
    // A second block occupies 13:00–14:00 in the SAME (origin) therapist column.
    const other = makeAppt({ id: 2, startTime: '13:00', endTime: '14:00', durationMin: 60 });
    render(<Harness appts={[dragged, other]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // Move the dragged block onto 13:00 (clientY 360) → overlaps block #2.
    move(50, 360);
    expect(screen.getByTestId('preview-overlap')).toHaveTextContent('true');
  });

  it('excludes the dragged cita itself from the overlap test (no self-overlap)', () => {
    const dragged = makeAppt({ id: 1, startTime: '12:00', endTime: '13:00', durationMin: 60 });
    render(<Harness appts={[dragged]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // Arm the drag (past 5px), then settle back onto the block's own 12:00 slot.
    // The only block in-column is the dragged cita itself → overlap must be false.
    move(50, 360);
    move(50, 240);
    expect(screen.getByTestId('preview-startTime')).toHaveTextContent('12:00');
    expect(screen.getByTestId('preview-overlap')).toHaveTextContent('false');
  });

  it('detects overlap against the DESTINATION therapist column after a horizontal move', () => {
    const dragged = makeAppt({ id: 1, startTime: '12:00', endTime: '13:00', durationMin: 60 });
    // The OTHER therapist already has a 12:00–13:00 block; dragging into that
    // column at the same slot must flag overlap.
    const otherBlock = makeAppt({ id: 9, startTime: '12:00', endTime: '13:00', durationMin: 60 });
    render(<Harness appts={[dragged]} otherAppts={[otherBlock]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    move(150, 240); // into the other column at 12:00
    expect(screen.getByTestId('preview-therapistId')).toHaveTextContent(String(OTHER_TH));
    expect(screen.getByTestId('preview-overlap')).toHaveTextContent('true');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// "Sin asignación" column — drag-to-assign (origin = the unassigned pseudo-column)
// ════════════════════════════════════════════════════════════════════════════
// Geometry: the unassigned column occupies x ∈ [0,100]; therapist ORIGIN_TH sits
// at x ∈ [100,200]. A sin_asignar block starts in the unassigned column.

const ASSIGN_RECTS: Record<string, DOMRect> = {
  [UNASSIGNED_COLUMN]: new DOMRect(0, 0, 100, 840),
  [ORIGIN_TH]: new DOMRect(100, 0, 100, 840),
};

interface IAssignHarnessProps {
  readonly originColumn: 'unassigned' | typeof ORIGIN_TH;
  readonly onDrop: (drop: IDayRescheduleDrop) => void;
}

/**
 * Two columns — the unassigned pseudo-column and one therapist — plus a single
 * draggable block whose origin is `originColumn`. Used to prove (a) unassigned →
 * therapist fires an assignment snapshot and (b) therapist → unassigned is NOT a
 * valid drop (the block snaps back to its therapist column, no onDrop).
 */
const AssignHarness = ({ originColumn, onDrop }: IAssignHarnessProps): React.ReactElement => {
  const sinAsignar = makeAppt({
    id: 7,
    therapistId: null,
    estado: 'sin_asignar',
    clientName: 'Sin cliente',
  });
  const apptsByTherapist = new Map<TUserId, readonly IAgendaAppointment[]>([[ORIGIN_TH, []]]);

  const { registerTrack, beginDrag } = useDayCitaDnD({
    therapists: THERAPISTS,
    apptsByTherapist,
    activeDate: ACTIVE_DATE,
    onDrop,
    unassignedName: 'Sin asignación',
  });

  const registerWithRect = (columnId: 'unassigned' | number) => (el: HTMLElement | null) => {
    if (el !== null) el.getBoundingClientRect = () => ASSIGN_RECTS[columnId];
    registerTrack(columnId, el);
  };

  return (
    <div>
      <div data-testid="track-unassigned" ref={registerWithRect(UNASSIGNED_COLUMN)} />
      <div data-testid={`track-${ORIGIN_TH}`} ref={registerWithRect(ORIGIN_TH)} />
      <button
        type="button"
        data-testid="block-7"
        ref={(el) => {
          if (el !== null) el.getBoundingClientRect = () => BLOCK_RECT;
        }}
        onPointerDown={(e) => {
          beginDrag(sinAsignar, originColumn, e);
        }}
      >
        drag me
      </button>
    </div>
  );
};

describe('useDayCitaDnD — Sin asignación drag-to-assign', () => {
  it('unassigned → therapist emits origin.therapistId null + proposed therapist (assignment)', () => {
    const onDrop = vi.fn();
    render(<AssignHarness originColumn={UNASSIGNED_COLUMN} onDrop={onDrop} />);
    press(7, 50, 240); // start in the unassigned column
    move(150, 240); // into the therapist column, same 12:00 slot
    up(150, 240);
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IDayRescheduleDrop;
    expect(drop.origin.therapistId).toBeNull();
    expect(drop.origin.therapistName).toBe('Sin asignación');
    expect(drop.proposed.therapistId).toBe(ORIGIN_TH);
    expect(drop.proposed.therapistName).toBe('Naree Siri');
    expect(drop.proposed.startTime).toBe('12:00');
  });

  it('therapist → unassigned is NOT a valid drop (snaps back to the therapist, no onDrop)', () => {
    const onDrop = vi.fn();
    render(<AssignHarness originColumn={ORIGIN_TH} onDrop={onDrop} />);
    press(7, 150, 240); // start in the therapist column
    move(50, 240); // drag horizontally over the unassigned column, same slot
    up(50, 240);
    // The unassigned column is skipped for a therapist-origin drag → fallback to
    // the origin therapist, same time → no net change → onDrop never fires.
    expect(onDrop).not.toHaveBeenCalled();
  });
});
