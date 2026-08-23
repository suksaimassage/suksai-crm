/**
 * WorkScheduleCalendar.dnd.test.tsx
 *
 * Surface B — Drag & Drop **deferred-commit** contract of the two DnD hooks
 * (`useDayDnD`, `useWeekDnD`). The confirmation Dialog feature moved the
 * persistence from "optimistic dispatch on drop" to "report a proposed change via
 * onCommit, owner decides". These tests pin the hook-level guarantee the Dialog
 * relies on:
 *
 *   - a drop that produces a NET CHANGE calls `onCommit(proposed, origin)`
 *     EXACTLY ONCE and the hook does NOT mutate any shift list itself (no reducer
 *     dispatch — the hooks own no state list, they only report);
 *   - a drop with NO net change does NOT call `onCommit` (the existing `changed`
 *     short-circuit — Analyst E-B1 / OQ-B6);
 *   - Day MOVE snaps to 15-min and reports the snapped start/end;
 *   - Day RESIZE reports the new endTime (duration change → must be confirmed,
 *     Analyst OQ-B3);
 *   - a Day cross-row landing is a reassignment: the preview flags `isReassignment`
 *     and the proposed shift carries the TARGET employeeId (Analyst OQ-B4);
 *   - Week move between columns changes `date`; an INVALID target column (the
 *     target day already holds that employee's shift) does NOT commit (E-B3).
 *
 * The hooks are pure logic (no DOM of their own) so they are driven with
 * renderHook + act. `useDayDnD` is gesture-driven via real `document` PointerEvents
 * fired with fireEvent (this project does NOT depend on @testing-library/user-event;
 * the established suite convention is fireEvent — and user-event has no pointer-drag
 * primitive anyway). A zeroed container rect makes the pointer math exact:
 * relX === clientX, relY === clientY.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, fireEvent } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  useDayDnD,
  useWeekDnD,
} from '@infra/components/ui/shared/WorkScheduleCalendar/WorkScheduleCalendar.hooks';
import { buildShiftIndex } from '@infra/components/ui/shared/WorkScheduleCalendar/WorkScheduleCalendar.utils';
import type {
  Employee,
  Shift,
  VisibleHourRange,
} from '@infra/components/ui/shared/WorkScheduleCalendar/WorkScheduleCalendar.types';

// ── Geometry (deterministic) ───────────────────────────────────────────────────
// 09:00 origin → rangeStartMin = 540. 96px/hour. With a zeroed container rect,
// labelWidth 0, rulerHeight 0, pointerOffsetX 0 and scroll 0:
//   relX = clientX → rawStartMin = 540 + (clientX/96)*60
//   relY = clientY → targetEmpIdx = floor(clientY / rowHeight)
const VISIBLE: VisibleHourRange = { startHour: 9, endHour: 21 };
const SLOT_WIDTH = 96;
const ROW_HEIGHT = 72;

const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Ana' },
  { id: '2', name: 'Bruno' },
];

/** A 10:00–12:00 especifico shift for Ana (employee '1'), row index 0. */
const SHIFT: Shift = {
  id: 'esp:42',
  employeeId: '1',
  date: '2026-05-18',
  startTime: '10:00',
  endTime: '12:00',
  color: 'primary',
};

// clientX that lands a move's start at a given "HH:MM" (duration preserved):
//   clientX = ((startMin - 540) / 60) * 96
const xForStartMinutes = (startMin: number): number => ((startMin - 9 * 60) / 60) * SLOT_WIDTH;

/**
 * A container element whose getBoundingClientRect is zeroed (so grid-relative
 * coords equal client coords) and whose scroll offsets are 0.
 */
function makeContainer(): HTMLDivElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => null,
  });
  Object.defineProperty(el, 'scrollLeft', { value: 0, configurable: true });
  Object.defineProperty(el, 'scrollTop', { value: 0, configurable: true });
  document.body.appendChild(el);
  return el;
}

/** Minimal React.PointerEvent stand-in — beginDragIntent reads clientX/Y + stopPropagation only. */
function fakeReactPointer(clientX: number, clientY: number): ReactPointerEvent {
  return { clientX, clientY, stopPropagation: vi.fn() } as unknown as ReactPointerEvent;
}

const dayConfig = (containerEl: HTMLDivElement) => ({
  employees: EMPLOYEES,
  containerEl,
  rulerHeight: 0,
  labelWidth: 0,
  slotWidth: SLOT_WIDTH,
  rowHeight: ROW_HEIGHT,
  visibleRange: VISIBLE,
  pointerOffsetX: 0,
});

// rAF runs synchronously so the preview is computed inline during the gesture.
beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

// ════════════════════════════════════════════════════════════════════════════
// useDayDnD — move
// ════════════════════════════════════════════════════════════════════════════

describe('useDayDnD — move commits a changed drop (deferred, no self-mutation)', () => {
  it('calls onCommit(proposed, origin) once with the snapped new time, same employee', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const container = makeContainer();
    const { result } = renderHook(() => useDayDnD(onCommit));

    act(() => {
      // grab at the shift's current start (10:00 → x 96), same row (y 10)
      result.current.beginDragIntent(
        'move',
        SHIFT,
        0,
        fakeReactPointer(xForStartMinutes(600), 10),
        dayConfig(container),
      );
    });
    // move to land start at 11:00 (x for 660 = 192), past the 5px threshold, same row
    act(() => {
      fireEvent.pointerMove(document, { clientX: xForStartMinutes(660), clientY: 10 });
    });
    act(() => {
      fireEvent.pointerUp(document, { clientX: xForStartMinutes(660), clientY: 10 });
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    const [proposed, origin] = onCommit.mock.calls[0];
    expect(proposed.startTime).toBe('11:00');
    expect(proposed.endTime).toBe('13:00'); // duration (120) preserved
    expect(proposed.employeeId).toBe('1'); // same row → no reassignment
    expect(proposed.id).toBe('esp:42');
    // The origin snapshot is the pre-drag shift (drives the Dialog "from").
    expect(origin).toEqual(SHIFT);
  });

  it('snaps a between-grid drop to the nearest 15 minutes', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const container = makeContainer();
    const { result } = renderHook(() => useDayDnD(onCommit));

    act(() => {
      result.current.beginDragIntent(
        'move',
        SHIFT,
        0,
        fakeReactPointer(xForStartMinutes(600), 10),
        dayConfig(container),
      );
    });
    // Aim start at 10:50 (650 min) → snapToGrid(650,15) = 645 → 10:45.
    act(() => {
      fireEvent.pointerMove(document, { clientX: xForStartMinutes(650), clientY: 10 });
    });
    act(() => {
      fireEvent.pointerUp(document, { clientX: xForStartMinutes(650), clientY: 10 });
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0].startTime).toBe('10:45');
  });

  it('does NOT call onCommit when the drop lands at the same place (no net change)', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const container = makeContainer();
    const { result } = renderHook(() => useDayDnD(onCommit));

    act(() => {
      result.current.beginDragIntent(
        'move',
        SHIFT,
        0,
        fakeReactPointer(xForStartMinutes(600), 10),
        dayConfig(container),
      );
    });
    // Nudge >5px to activate the drag, then return EXACTLY to the origin start (10:00).
    act(() => {
      fireEvent.pointerMove(document, { clientX: xForStartMinutes(600) + 40, clientY: 10 });
    });
    act(() => {
      fireEvent.pointerUp(document, { clientX: xForStartMinutes(600), clientY: 10 });
    });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does NOT call onCommit for a pure click (no movement past the 5px threshold)', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const container = makeContainer();
    const { result } = renderHook(() => useDayDnD(onCommit));

    act(() => {
      result.current.beginDragIntent(
        'move',
        SHIFT,
        0,
        fakeReactPointer(xForStartMinutes(600), 10),
        dayConfig(container),
      );
    });
    // Move only 3px (< DND_THRESHOLD 5) then release — never becomes a drag.
    act(() => {
      fireEvent.pointerMove(document, { clientX: xForStartMinutes(600) + 3, clientY: 10 });
    });
    act(() => {
      fireEvent.pointerUp(document, { clientX: xForStartMinutes(600) + 3, clientY: 10 });
    });

    expect(onCommit).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useDayDnD — cross-row reassignment
// ════════════════════════════════════════════════════════════════════════════

describe('useDayDnD — cross-row landing is a reassignment', () => {
  it('reports the target employeeId and flags the preview isReassignment', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const container = makeContainer();
    const { result } = renderHook(() => useDayDnD(onCommit));

    act(() => {
      result.current.beginDragIntent(
        'move',
        SHIFT,
        0,
        fakeReactPointer(xForStartMinutes(600), 10),
        dayConfig(container),
      );
    });
    // Land on Bruno's row (index 1 → y in [72,144)), time unchanged (start 10:00).
    act(() => {
      fireEvent.pointerMove(document, { clientX: xForStartMinutes(600), clientY: ROW_HEIGHT + 10 });
    });
    // The preview produced during the move reflects the reassignment target.
    expect(result.current.dragPreview?.isReassignment).toBe(true);
    expect(result.current.dragPreview?.previewEmployeeIndex).toBe(1);

    act(() => {
      fireEvent.pointerUp(document, { clientX: xForStartMinutes(600), clientY: ROW_HEIGHT + 10 });
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    const [proposed] = onCommit.mock.calls[0];
    expect(proposed.employeeId).toBe('2'); // reassigned to Bruno
    expect(proposed.startTime).toBe('10:00'); // time unchanged
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useDayDnD — resize
// ════════════════════════════════════════════════════════════════════════════

describe('useDayDnD — resize commits an endTime change', () => {
  it('reports the new (snapped) endTime, keeps start + employee, never reassigns', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const container = makeContainer();
    const { result } = renderHook(() => useDayDnD(onCommit));

    // Resize handle path: type 'resize', pointerOffsetX is irrelevant (endTime
    // tracks relX). Grab at the right edge (12:00 → x 288).
    act(() => {
      result.current.beginDragIntent(
        'resize',
        SHIFT,
        0,
        fakeReactPointer(xForStartMinutes(720), 10),
        dayConfig(container),
      );
    });
    // Drag the right edge out to 13:00 (x for 780 = 384).
    act(() => {
      fireEvent.pointerMove(document, { clientX: xForStartMinutes(780), clientY: 10 });
    });
    act(() => {
      fireEvent.pointerUp(document, { clientX: xForStartMinutes(780), clientY: 10 });
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    const [proposed] = onCommit.mock.calls[0];
    expect(proposed.startTime).toBe('10:00'); // start unchanged
    expect(proposed.endTime).toBe('13:00'); // extended
    expect(proposed.employeeId).toBe('1'); // resize never reassigns
  });
});

// ════════════════════════════════════════════════════════════════════════════
// useWeekDnD — column move + invalid drop
// ════════════════════════════════════════════════════════════════════════════

describe('useWeekDnD — move between columns', () => {
  beforeEach(() => {
    // The Day-view rAF mock is harmless here; the Week hook is HTML5-drag based
    // and is driven by calling its handlers directly (jsdom has no DragEvent).
  });

  it('commits the proposed shift with the NEW date when the target column is free', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const index = buildShiftIndex([SHIFT]); // Ana busy only on 2026-05-18
    const { result } = renderHook(() => useWeekDnD(index, onCommit));

    act(() => {
      result.current.handleDragStart(SHIFT);
    });
    act(() => {
      result.current.handleDrop('2026-05-20'); // empty column for Ana
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    const [proposed, origin] = onCommit.mock.calls[0];
    expect(proposed.date).toBe('2026-05-20');
    expect(proposed.startTime).toBe('10:00'); // time unchanged by a week move
    expect(proposed.employeeId).toBe('1');
    expect(origin).toEqual(SHIFT);
  });

  it('does NOT commit a drop onto the SAME column (no net change)', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const index = buildShiftIndex([SHIFT]);
    const { result } = renderHook(() => useWeekDnD(index, onCommit));

    act(() => {
      result.current.handleDragStart(SHIFT);
    });
    act(() => {
      result.current.handleDrop('2026-05-18'); // its own column
    });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does NOT commit when the target day already holds that employee a shift (invalid drop)', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    // Ana already has a shift on 2026-05-20 → dropping the dragged one there is invalid.
    const blocker: Shift = { ...SHIFT, id: 'esp:99', date: '2026-05-20' };
    const index = buildShiftIndex([SHIFT, blocker]);
    const { result } = renderHook(() => useWeekDnD(index, onCommit));

    act(() => {
      result.current.handleDragStart(SHIFT);
    });
    act(() => {
      result.current.handleDrop('2026-05-20');
    });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('exposes the valid/invalid drop state per column via getDragOverState', () => {
    const onCommit = vi.fn<(proposed: Shift, origin: Shift) => void>();
    const blocker: Shift = { ...SHIFT, id: 'esp:99', date: '2026-05-20' };
    const index = buildShiftIndex([SHIFT, blocker]);
    const { result } = renderHook(() => useWeekDnD(index, onCommit));

    act(() => {
      result.current.handleDragStart(SHIFT);
    });
    // Hover a free column → valid.
    act(() => {
      result.current.handleDragOver(
        {
          preventDefault: () => undefined,
          dataTransfer: { dropEffect: '' },
        } as unknown as React.DragEvent,
        '2026-05-21',
      );
    });
    expect(result.current.getDragOverState('2026-05-21')).toEqual({
      isDragOver: true,
      isValidDrop: true,
    });
    // The occupied column is invalid (Ana already works it).
    act(() => {
      result.current.handleDragOver(
        {
          preventDefault: () => undefined,
          dataTransfer: { dropEffect: '' },
        } as unknown as React.DragEvent,
        '2026-05-20',
      );
    });
    expect(result.current.getDragOverState('2026-05-20')).toEqual({
      isDragOver: true,
      isValidDrop: false,
    });
  });
});
