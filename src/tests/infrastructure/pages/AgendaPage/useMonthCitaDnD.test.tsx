/**
 * useMonthCitaDnD.test.tsx
 *
 * Behavioural tests for the admin MONTH-grid drag & drop gesture hook (Surface A).
 * Month-view sibling of useDayCitaDnD/useWeekCitaDnD: the month grid has NO vertical
 * time axis — each cell is a whole DAY, so a drag only translates the cita's DATE and
 * the time-of-day is preserved. The hit-test is therefore 2-D (clientX AND clientY
 * inside a cell rect). Move-only + pessimistic: it NEVER moves the chip; on a
 * different-day drop it calls onDrop(snapshot).
 *
 * Harness rationale (mirrors useDayCitaDnD.test): the hook attaches DOCUMENT-level
 * pointer listeners and reads getBoundingClientRect of the day cells + the dragged
 * chip. jsdom returns all-zero rects, so a tiny harness wires beginDrag/registerCell
 * to real DOM nodes and stubs those nodes' rects. requestAnimationFrame is queued and
 * flushed at a real frame boundary so the RAF-throttled target resolution settles.
 *
 * Geometry:
 *   - ORIGIN cell '2026-05-07' occupies the rect [0,0 → 100,100]
 *   - TARGET cell '2026-05-14' occupies the rect [100,0 → 200,100]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import {
  useMonthCitaDnD,
  type IMonthRescheduleDrop,
} from '@infra/pages/AgendaPage/components/admin/useMonthCitaDnD';
import type { IAgendaMonthChipData } from '@domain/models/agenda.models';

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORIGIN_DATE = '2026-05-07';
const TARGET_DATE = '2026-05-14';

const CELL_RECTS: Record<string, DOMRect> = {
  [ORIGIN_DATE]: new DOMRect(0, 0, 100, 100),
  [TARGET_DATE]: new DOMRect(100, 0, 100, 100),
};

const makeChip = (overrides: Partial<IAgendaMonthChipData> = {}): IAgendaMonthChipData => ({
  id: 42,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  serviceName: 'Masaje',
  estado: 'confirmada',
  clientName: 'Ana',
  therapistId: 1,
  ...overrides,
});

interface IHarnessProps {
  readonly chip: IAgendaMonthChipData;
  readonly onDrop: (drop: IMonthRescheduleDrop) => void;
}

const Harness = ({ chip, onDrop }: IHarnessProps): React.ReactElement => {
  const { draggingId, dropTargetDateStr, registerCell, beginDrag } = useMonthCitaDnD({ onDrop });

  const registerWithRect = (dateStr: string) => (el: HTMLElement | null) => {
    if (el !== null) el.getBoundingClientRect = () => CELL_RECTS[dateStr];
    registerCell(dateStr, el);
  };

  return (
    <div>
      <div
        data-testid={`cell-${ORIGIN_DATE}`}
        ref={registerWithRect(ORIGIN_DATE)}
        data-drop-target={dropTargetDateStr === ORIGIN_DATE ? 'true' : 'false'}
      >
        <button
          type="button"
          data-testid="chip"
          data-dragging={draggingId === chip.id ? 'true' : 'false'}
          onPointerDown={(e) => {
            beginDrag(chip, ORIGIN_DATE, e);
          }}
        >
          {chip.clientName}
        </button>
      </div>
      <div
        data-testid={`cell-${TARGET_DATE}`}
        ref={registerWithRect(TARGET_DATE)}
        data-drop-target={dropTargetDateStr === TARGET_DATE ? 'true' : 'false'}
      />
    </div>
  );
};

// ── Manual rAF queue (mirrors useDayCitaDnD.test) ─────────────────────────────

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
      return rafQueue.length;
    });
  cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  rafSpy.mockRestore();
  cafSpy.mockRestore();
});

const press = (clientX = 50, clientY = 50): void => {
  act(() => {
    fireEvent.pointerDown(screen.getByTestId('chip'), { button: 0, clientX, clientY });
  });
};
const move = (clientX: number, clientY: number): void => {
  act(() => {
    fireEvent.pointerMove(document, { clientX, clientY });
    flushRAF();
  });
};
const up = (clientX: number, clientY: number): void => {
  act(() => {
    fireEvent.pointerUp(document, { clientX, clientY });
  });
};

// ════════════════════════════════════════════════════════════════════════════
// Activation threshold — click (open Day view) vs drag (reschedule)
// ════════════════════════════════════════════════════════════════════════════

describe('useMonthCitaDnD — activation threshold (5px)', () => {
  it('does NOT begin a drag for a sub-threshold move (treated as a click)', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip()} onDrop={onDrop} />);
    press(50, 50);
    move(52, 52); // ≈2.8px — below threshold
    expect(screen.getByTestId('chip')).toHaveAttribute('data-dragging', 'false');
    up(150, 50); // even though released over the target cell, no drag armed
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('arms the drag once movement crosses the 5px threshold', () => {
    render(<Harness chip={makeChip()} onDrop={vi.fn()} />);
    press(50, 50);
    move(60, 50); // 10px
    expect(screen.getByTestId('chip')).toHaveAttribute('data-dragging', 'true');
  });

  it('ignores a non-left button press (no gesture starts)', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip()} onDrop={onDrop} />);
    act(() => {
      fireEvent.pointerDown(screen.getByTestId('chip'), { button: 2, clientX: 50, clientY: 50 });
    });
    move(150, 50);
    up(150, 50);
    expect(onDrop).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Target-cell hit-test + drop semantics
// ════════════════════════════════════════════════════════════════════════════

describe('useMonthCitaDnD — target cell + drop', () => {
  it('highlights the cell under the pointer while dragging', () => {
    render(<Harness chip={makeChip()} onDrop={vi.fn()} />);
    press(50, 50);
    move(150, 50); // into the target cell
    expect(screen.getByTestId(`cell-${TARGET_DATE}`)).toHaveAttribute('data-drop-target', 'true');
  });

  it('a drop on a DIFFERENT day fires onDrop with the new date and the SAME time', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip()} onDrop={onDrop} />);
    press(50, 50);
    move(150, 50);
    up(150, 50);
    expect(onDrop).toHaveBeenCalledTimes(1);
    const drop = onDrop.mock.calls[0][0] as IMonthRescheduleDrop;
    expect(drop.citaId).toBe(42);
    expect(drop.origin.dateStr).toBe(ORIGIN_DATE);
    expect(drop.proposed.dateStr).toBe(TARGET_DATE);
    // Time-of-day preserved — a month drag only changes the date.
    expect(drop.proposed.startTime).toBe('10:00');
    expect(drop.proposed.endTime).toBe('11:00');
    expect(drop.durationMin).toBe(60);
    expect(drop.serviceName).toBe('Masaje');
  });

  it('a drop back on the SAME day (no net change) does NOT fire onDrop', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip()} onDrop={onDrop} />);
    press(50, 50);
    move(150, 50); // arm + move away
    up(50, 50); // released back over the origin cell
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('a drop outside every cell falls back to the origin (no change → no onDrop)', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip()} onDrop={onDrop} />);
    press(50, 50);
    move(-500, -500); // nowhere near a cell
    up(-500, -500);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('forwards a null client name verbatim (parent maps it to a placeholder)', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip({ clientName: null })} onDrop={onDrop} />);
    press(50, 50);
    move(150, 50);
    up(150, 50);
    const drop = onDrop.mock.calls[0][0] as IMonthRescheduleDrop;
    expect(drop.clientName).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Escape cancels the gesture (drag is not a trap — WCAG 2.1.2)
// ════════════════════════════════════════════════════════════════════════════

describe('useMonthCitaDnD — Escape cancels', () => {
  it('Escape during a drag cancels it with no onDrop, and the later pointerup is inert', () => {
    const onDrop = vi.fn();
    render(<Harness chip={makeChip()} onDrop={onDrop} />);
    press(50, 50);
    move(150, 50);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.getByTestId('chip')).toHaveAttribute('data-dragging', 'false');
    up(150, 50);
    expect(onDrop).not.toHaveBeenCalled();
  });
});
