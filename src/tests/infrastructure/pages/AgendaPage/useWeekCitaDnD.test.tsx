/**
 * useWeekCitaDnD.test.tsx
 *
 * Behavioural tests for the admin week-grid drag & drop gesture hook (Surface A).
 * The hook is move-only and pessimistic: it NEVER moves the real block; on a
 * net-change drop it calls `onDrop(snapshot)` with the snapped destination.
 *
 * Why a harness instead of renderHook: the hook attaches DOCUMENT-level pointer
 * listeners and reads `getBoundingClientRect` of the day tracks + the dragged
 * block. A tiny harness component wires `beginDrag`/`registerTrack` to real DOM
 * nodes; we then stub those nodes' rects (jsdom returns all-zero rects) and drive
 * the gesture with real PointerEvents.
 *
 * Interactions use `fireEvent` (pointerDown on the block, pointerMove/pointerUp on
 * document, keydown for Escape) — `@testing-library/user-event` is NOT a project
 * dependency. `requestAnimationFrame` is stubbed to run synchronously so the
 * RAF-throttled preview is observable immediately within `act`.
 *
 * Geometry mirrors the agenda constants (slotHeight 60, dayStart 10):
 *   - origin track "2026-05-18" occupies x ∈ [0,100]
 *   - other  track "2026-05-19" occupies x ∈ [100,200]
 *   - both tracks have top = 0
 *   - the block (12:00, 60 min) sits at top = timeToTopOffset('12:00',10,60) = 240
 *   - the press grabs the block at its top (pointerOffsetY = 0), so during the
 *     gesture relYTop === clientY and topOffsetToTime(clientY) gives the slot.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import {
  useWeekCitaDnD,
  type IWeekRescheduleDrop,
} from '@infra/pages/AgendaPage/components/admin/useWeekCitaDnD';
import type { IAgendaAppointment } from '@domain/models/agenda.models';

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORIGIN_DATE = '2026-05-18';
const OTHER_DATE = '2026-05-19';

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
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

/** Fixed rects per dateStr — assigned to each track node after render. */
const TRACK_RECTS: Record<string, DOMRect> = {
  [ORIGIN_DATE]: new DOMRect(0, 0, 100, 840),
  [OTHER_DATE]: new DOMRect(100, 0, 100, 840),
};
// The block's own rect (read once in beginDrag for the grab offset). top 240 =
// the 12:00 slot; height 120 = 60 min.
const BLOCK_RECT = new DOMRect(4, 240, 92, 120);

interface IHarnessProps {
  readonly appts: readonly IAgendaAppointment[];
  readonly onDrop: (drop: IWeekRescheduleDrop) => void;
  /** Expose live preview to the test via a data attribute. */
  readonly onPreview?: (json: string) => void;
}

/**
 * Renders two day tracks and one draggable block (the first appt) in the origin
 * column. Each track registers itself; we stub rects in a layout effect so the
 * hook's hit-testing sees deterministic geometry.
 */
const Harness = ({ appts, onDrop, onPreview }: IHarnessProps): React.ReactElement => {
  const { draggingId, preview, dropTargetDateStr, registerTrack, beginDrag } = useWeekCitaDnD({
    weekDays: [
      { dateStr: ORIGIN_DATE, appointments: appts },
      { dateStr: OTHER_DATE, appointments: [] },
    ],
    onDrop,
  });

  onPreview?.(JSON.stringify(preview));

  const registerWithRect = (dateStr: string) => (el: HTMLElement | null) => {
    if (el !== null) {
      el.getBoundingClientRect = () => TRACK_RECTS[dateStr];
    }
    registerTrack(dateStr, el);
  };

  return (
    <div>
      <div
        data-testid={`track-${ORIGIN_DATE}`}
        ref={registerWithRect(ORIGIN_DATE)}
        data-drop-target={dropTargetDateStr === ORIGIN_DATE ? 'true' : 'false'}
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
              beginDrag(a, ORIGIN_DATE, e);
            }}
          >
            {a.clientName}
          </button>
        ))}
      </div>
      <div
        data-testid={`track-${OTHER_DATE}`}
        ref={registerWithRect(OTHER_DATE)}
        data-drop-target={dropTargetDateStr === OTHER_DATE ? 'true' : 'false'}
      />
      <output data-testid="preview-startTime">{preview?.startTime ?? ''}</output>
      <output data-testid="preview-dateStr">{preview?.dateStr ?? ''}</output>
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

describe('useWeekCitaDnD — activation threshold (5px)', () => {
  it('does NOT begin a drag for a sub-threshold move (treated as a click)', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    // Move 3px — below the 5px threshold.
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
// Preview snapping + day-column hit-testing
// ════════════════════════════════════════════════════════════════════════════

describe('useWeekCitaDnD — preview snapping', () => {
  it('snaps the preview start to the 30-min grid', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // clientY 375 → relYTop 375 → 187.5 min → snaps to 180 min → 13:00.
    move(50, 375);
    expect(screen.getByTestId('preview-startTime')).toHaveTextContent('13:00');
  });

  it('reports the preview in the ORIGIN column when the pointer stays in it', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    move(50, 360);
    expect(screen.getByTestId('preview-dateStr')).toHaveTextContent(ORIGIN_DATE);
    expect(screen.getByTestId(`track-${ORIGIN_DATE}`)).toHaveAttribute('data-drop-target', 'true');
  });

  it('hit-tests the OTHER day column when the pointer moves into it', () => {
    render(<Harness appts={[makeAppt()]} onDrop={vi.fn()} />);
    press(1, 50, 240);
    // clientX 150 → inside the other track's [100,200] range.
    move(150, 240);
    expect(screen.getByTestId('preview-dateStr')).toHaveTextContent(OTHER_DATE);
    expect(screen.getByTestId(`track-${OTHER_DATE}`)).toHaveAttribute('data-drop-target', 'true');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Drop semantics — net change fires onDrop, same slot does not
//
// ⚠️ BUG-01 (PRODUCTION, reported to Developer/QA): these "net change ⇒ onDrop"
// cases currently FAIL. In useWeekCitaDnD.ts `finish()` (line ~272) sets
// `intentRef.current = null` BEFORE calling `computePreview(ue)` (line ~275), and
// `computePreview` early-returns null when `intentRef.current === null`. So the
// drop path never computes a destination → `onDrop` is never invoked → the
// confirmation Dialog never opens and a cita can never be rescheduled by drag.
// These assertions encode the CORRECT contract and will pass once the Developer
// fixes the ordering (compute the result BEFORE nulling the ref). The
// preview-during-drag and same-slot/no-op cases are unaffected and pass today.
// ════════════════════════════════════════════════════════════════════════════

describe('useWeekCitaDnD — drop fires onDrop only on a net change', () => {
  it('a time change in the same column emits the snapped destination', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(50, 360); // arm + preview
    up(50, 360); // drop at 13:00 in the origin column
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IWeekRescheduleDrop;
    expect(drop.citaId).toBe(1);
    expect(drop.origin).toEqual({ dateStr: ORIGIN_DATE, startTime: '12:00', endTime: '13:00' });
    expect(drop.proposed).toEqual({ dateStr: ORIGIN_DATE, startTime: '13:00', endTime: '14:00' });
  });

  it('derives the proposed endTime as start + durationMin (move-only)', () => {
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
    const drop = onDrop.mock.calls[0][0] as IWeekRescheduleDrop;
    expect(drop.proposed.startTime).toBe('14:00');
    expect(drop.proposed.endTime).toBe('15:30');
    expect(drop.durationMin).toBe(90);
  });

  it('a day change (same time) emits the new dateStr', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(150, 240); // into the other column, same vertical slot
    up(150, 240);
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IWeekRescheduleDrop;
    expect(drop.proposed.dateStr).toBe(OTHER_DATE);
    expect(drop.proposed.startTime).toBe('12:00');
  });

  it('a drop in the SAME slot (no net change) does NOT fire onDrop', () => {
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    // Move enough to arm the drag, then return to the original slot before release.
    move(50, 360);
    up(50, 240); // back at 12:00 in the origin column → proposed === origin
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('forwards the client + service names in the snapshot', () => {
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
    const drop = onDrop.mock.calls[0][0] as IWeekRescheduleDrop;
    expect(drop.clientName).toBe('Lucía');
    expect(drop.serviceName).toBe('Aromaterapia');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Escape cancels the gesture (drag is not a trap — WCAG 2.1.2)
// ════════════════════════════════════════════════════════════════════════════

describe('useWeekCitaDnD — Escape cancels', () => {
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

describe('useWeekCitaDnD — advisory overlap detection', () => {
  it('flags overlap=true when the snapped slot collides with another in-column block', () => {
    const dragged = makeAppt({ id: 1, startTime: '12:00', endTime: '13:00', durationMin: 60 });
    // A second block occupies 13:00–14:00 in the SAME column.
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
});

// ════════════════════════════════════════════════════════════════════════════
// registerTrack lifecycle
// ════════════════════════════════════════════════════════════════════════════

describe('useWeekCitaDnD — registerTrack / column fallback', () => {
  // ⚠️ Also blocked by BUG-01 (the drop path never invokes onDrop). Encodes the
  // correct contract: a drop whose X is outside every column falls back to the
  // origin column (resolveTargetColumn fallback branch).
  it('a drop with no column under the pointer falls back to the origin column', () => {
    // Unregistering happens via ref(null) on unmount; here we just prove the
    // origin column remains hit-testable for a same-column drop (the fallback
    // path in resolveTargetColumn is also exercised when no column matches X).
    const onDrop = vi.fn();
    render(<Harness appts={[makeAppt()]} onDrop={onDrop} />);
    press(1, 50, 240);
    move(50, 360);
    // Drop far to the LEFT of every column (clientX -50): no column contains it,
    // so resolveTargetColumn falls back to the origin column.
    up(-50, 360);
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IWeekRescheduleDrop;
    expect(drop.proposed.dateStr).toBe(ORIGIN_DATE);
    expect(drop.proposed.startTime).toBe('13:00');
  });
});
