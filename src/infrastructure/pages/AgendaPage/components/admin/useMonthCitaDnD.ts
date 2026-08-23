/**
 * useMonthCitaDnD — pointer-based drag & drop for the admin MONTH grid (Surface A).
 *
 * Month-view sibling of `useWeekCitaDnD` / `useDayCitaDnD`. The month grid has NO
 * vertical time axis: each cell is a whole calendar DAY, so a drag only translates
 * a cita's DATE — the time-of-day is preserved (start/end carried verbatim into the
 * snapshot). The hit-test is therefore 2-D (clientX AND clientY inside a cell rect)
 * instead of the day/week grids' single-axis column test.
 *
 * Mirrors the established gesture idiom exactly: a mutable `intentRef`, a 5px
 * activation threshold so a click (→ open Day view) and a drag (→ reschedule) never
 * conflict, RAF-throttled pointer-move → target-cell resolution, document-level
 * listeners, and a `changed` guard on drop. Escape cancels (drag is not a trap —
 * WCAG 2.1.2).
 *
 * The commit is pessimistic: this hook NEVER moves the real chip. On a net change
 * (a different day) it calls `onDrop(snapshot)` with a self-contained
 * origin+proposed snapshot; the parent opens the confirm Dialog and persists via
 * `useRescheduleCita`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IAgendaMonthChipData } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';

/** Movement (px) required before a press becomes a drag — mirrors the sibling hooks. */
const DND_THRESHOLD = 5;

/** Snapshot handed to the parent on a net-change (different-day) drop. */
export interface IMonthRescheduleDrop {
  readonly citaId: TCitaId;
  readonly clientName: string | null;
  readonly serviceName: string;
  readonly durationMin: number;
  readonly origin: {
    readonly dateStr: string;
    readonly startTime: string;
    readonly endTime: string;
  };
  readonly proposed: {
    /** The target day — the ONLY thing a month drag changes. */
    readonly dateStr: string;
    /** Time-of-day is preserved: proposed.startTime === origin.startTime. */
    readonly startTime: string;
    readonly endTime: string;
  };
}

interface IDragIntent {
  citaId: TCitaId;
  chip: IAgendaMonthChipData;
  originDateStr: string;
  isDragging: boolean;
  startX: number;
  startY: number;
  rafId: number | null;
  latestEvent: PointerEvent | null;
  moveHandler: (e: PointerEvent) => void;
  upHandler: (e: PointerEvent) => void;
  keyHandler: (e: KeyboardEvent) => void;
}

interface IUseMonthCitaDnDParams {
  /** Fired on a drop whose target dateStr differs from the origin. */
  readonly onDrop: (drop: IMonthRescheduleDrop) => void;
}

interface IUseMonthCitaDnDResult {
  /** Cita currently lifted/dragging (for $dragging styling), or null. */
  readonly draggingId: TCitaId | null;
  /** dateStr of the cell under the pointer (for the $dropTarget wash), or null. */
  readonly dropTargetDateStr: string | null;
  /** Ref callback registering each day-cell element for hit-testing. */
  readonly registerCell: (dateStr: string, el: HTMLElement | null) => void;
  /** Begin a drag from a chip's onPointerDown. */
  readonly beginDrag: (
    chip: IAgendaMonthChipData,
    originDateStr: string,
    e: React.PointerEvent,
  ) => void;
}

export function useMonthCitaDnD({ onDrop }: IUseMonthCitaDnDParams): IUseMonthCitaDnDResult {
  const [draggingId, setDraggingId] = useState<TCitaId | null>(null);
  const [dropTargetDateStr, setDropTargetDateStr] = useState<string | null>(null);

  const intentRef = useRef<IDragIntent | null>(null);
  // Live registry of day-cell DOM nodes, keyed by dateStr (set via ref callback).
  const cellsRef = useRef<Map<string, HTMLElement>>(new Map());
  // onDrop is read inside the document-level handlers (move/up), which always run
  // after render, so a "latest ref" kept fresh in an effect lets those handlers see
  // the current callback without re-binding listeners mid-drag.
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const registerCell = useCallback((dateStr: string, el: HTMLElement | null): void => {
    if (el === null) {
      cellsRef.current.delete(dateStr);
    } else {
      cellsRef.current.set(dateStr, el);
    }
  }, []);

  /**
   * Resolve the day cell under the pointer (2-D hit-test). Returns the origin as a
   * fallback when the pointer is outside every cell (e.g. dragged past the grid
   * edge) so a release there reads as "no change" instead of a random cell.
   */
  const resolveTargetCell = useCallback(
    (clientX: number, clientY: number, fallback: string): string => {
      for (const [dateStr, el] of cellsRef.current) {
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return dateStr;
        }
      }
      return fallback;
    },
    [],
  );

  const cleanupListeners = useCallback((intent: IDragIntent): void => {
    document.removeEventListener('pointermove', intent.moveHandler);
    document.removeEventListener('pointerup', intent.upHandler);
    document.removeEventListener('keydown', intent.keyHandler, true);
    if (intent.rafId !== null) cancelAnimationFrame(intent.rafId);
  }, []);

  const resetState = useCallback((): void => {
    setDraggingId(null);
    setDropTargetDateStr(null);
  }, []);

  const beginDrag = useCallback(
    (chip: IAgendaMonthChipData, originDateStr: string, e: React.PointerEvent): void => {
      // Left button only; ignore if a gesture is already in flight.
      if (e.button !== 0 || intentRef.current !== null) return;

      const moveHandler = (me: PointerEvent): void => {
        const intent = intentRef.current;
        if (intent === null) return;

        if (!intent.isDragging) {
          const dx = me.clientX - intent.startX;
          const dy = me.clientY - intent.startY;
          if (Math.sqrt(dx * dx + dy * dy) < DND_THRESHOLD) return;
          intent.isDragging = true;
          setDraggingId(intent.citaId);
        }

        intent.latestEvent = me;
        if (intent.rafId !== null) return; // a frame is already scheduled
        intent.rafId = requestAnimationFrame(() => {
          const current = intentRef.current;
          if (current === null) return;
          current.rafId = null;
          const ev = current.latestEvent;
          if (ev === null) return;
          setDropTargetDateStr(resolveTargetCell(ev.clientX, ev.clientY, current.originDateStr));
        });
      };

      const finish = (commit: boolean, ue: PointerEvent | null): void => {
        const intent = intentRef.current;
        if (intent === null) return;
        cleanupListeners(intent);
        intentRef.current = null;

        if (commit && intent.isDragging && ue !== null) {
          const targetDateStr = resolveTargetCell(ue.clientX, ue.clientY, intent.originDateStr);
          if (targetDateStr !== intent.originDateStr) {
            onDropRef.current({
              citaId: intent.citaId,
              clientName: intent.chip.clientName,
              serviceName: intent.chip.serviceName,
              durationMin: intent.chip.durationMin,
              origin: {
                dateStr: intent.originDateStr,
                startTime: intent.chip.startTime,
                endTime: intent.chip.endTime,
              },
              proposed: {
                dateStr: targetDateStr,
                // Time-of-day is preserved — a month drag only changes the date.
                startTime: intent.chip.startTime,
                endTime: intent.chip.endTime,
              },
            });
          }
        }
        // No-change drops (and a pure click that never crossed the threshold) fall
        // through to the chip's onClick → open Day view for that date.
        resetState();
      };

      const upHandler = (ue: PointerEvent): void => {
        finish(true, ue);
      };

      const keyHandler = (ke: KeyboardEvent): void => {
        if (ke.key === 'Escape') {
          ke.preventDefault();
          // Cancel the gesture, no commit (drag is not a trap — WCAG 2.1.2).
          finish(false, null);
        }
      };

      intentRef.current = {
        citaId: chip.id,
        chip,
        originDateStr,
        isDragging: false,
        startX: e.clientX,
        startY: e.clientY,
        rafId: null,
        latestEvent: null,
        moveHandler,
        upHandler,
        keyHandler,
      };

      document.addEventListener('pointermove', moveHandler);
      document.addEventListener('pointerup', upHandler, { once: true });
      document.addEventListener('keydown', keyHandler, true);
    },
    [cleanupListeners, resetState, resolveTargetCell],
  );

  // Cleanup any in-flight gesture on unmount.
  useEffect(() => {
    return () => {
      const intent = intentRef.current;
      if (intent === null) return;
      cleanupListeners(intent);
      intentRef.current = null;
    };
  }, [cleanupListeners]);

  return { draggingId, dropTargetDateStr, registerCell, beginDrag };
}
