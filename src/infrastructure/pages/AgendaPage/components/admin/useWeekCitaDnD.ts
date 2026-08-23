/**
 * useWeekCitaDnD — pointer-based drag & drop for the admin week grid (Surface A).
 *
 * MOVE-ONLY: a cita's duration is fixed by its servicio (Rule 2 / DURATION_MISMATCH
 * rejects any independent end change), so a drag only translates the block — to a
 * new 30-min start and/or a new day column. The new end is always
 * `start + durationMin`.
 *
 * Mirrors the established `useDayDnD` idiom (WorkScheduleCalendar.hooks.ts): a
 * mutable `intentRef`, a 5px activation threshold so click and drag never conflict,
 * RAF-throttled pointer-move → preview computation, document-level listeners, and
 * a `changed` guard on drop. Escape cancels the gesture (drag is not a trap).
 *
 * The commit is pessimistic: this hook NEVER moves the real block. On a net change
 * it calls `onDrop(snapshot)` with a self-contained origin+proposed snapshot; the
 * parent opens the confirm Dialog and persists via `useRescheduleCita`.
 *
 * Performance: RAF-throttle + `focus`-free hot path follow
 * `bugfix_chrome_perf_violations_overlays`. The preview state is isolated so a
 * pointer-move does not recompute the grid's clustering useMemo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';
import { timeToTopOffset, durationToHeight, topOffsetToTime } from '@infra/utils/agenda.utils';
import {
  AGENDA_SLOT_HEIGHT_PX,
  AGENDA_DAY_START_HOUR,
  AGENDA_DAY_END_HOUR,
} from '../../agenda.constants';

/** Movement (px) required before a press becomes a drag — mirrors DND_THRESHOLD. */
const DND_THRESHOLD = 5;
/** Vertical snap granularity (min). 30 = the agenda's slot grid (Analyst OQ-A4). */
const DND_SNAP_MIN = 30;

/** Snapshot handed to the parent on a net-change drop (Analyst §3). */
export interface IWeekRescheduleDrop {
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
    readonly dateStr: string;
    readonly startTime: string;
    readonly endTime: string;
  };
}

/** Live preview-ghost position while dragging (gesture-local). */
export interface IWeekDragPreview {
  readonly dateStr: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly topPx: number;
  readonly heightPx: number;
  /** Advisory: the snapped slot visually overlaps an existing block in-column. */
  readonly overlap: boolean;
}

interface IDragIntent {
  citaId: TCitaId;
  appt: IAgendaAppointment;
  originDateStr: string;
  durationMin: number;
  /** Pointer Y offset within the block at grab time (so the block doesn't jump). */
  pointerOffsetY: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  rafId: number | null;
  latestEvent: PointerEvent | null;
  moveHandler: (e: PointerEvent) => void;
  upHandler: (e: PointerEvent) => void;
  keyHandler: (e: KeyboardEvent) => void;
}

interface IUseWeekCitaDnDParams {
  /** All week days in render order — used to hit-test the day column + overlaps. */
  readonly weekDays: readonly {
    readonly dateStr: string;
    readonly appointments: readonly IAgendaAppointment[];
  }[];
  /** Fired on a drop whose (dateStr, startTime) differs from the original. */
  readonly onDrop: (drop: IWeekRescheduleDrop) => void;
}

interface IUseWeekCitaDnDResult {
  /** Cita currently lifted/dragging (for $lifted/$dragging styling), or null. */
  readonly draggingId: TCitaId | null;
  /** Live ghost position, or null when not dragging. */
  readonly preview: IWeekDragPreview | null;
  /** dateStr of the column under the pointer (for the $dropTarget wash), or null. */
  readonly dropTargetDateStr: string | null;
  /** Ref callback registering each day-track element for hit-testing. */
  readonly registerTrack: (dateStr: string, el: HTMLElement | null) => void;
  /** Begin a drag from a block's onPointerDown. */
  readonly beginDrag: (
    appt: IAgendaAppointment,
    originDateStr: string,
    e: React.PointerEvent,
  ) => void;
}

/** Does [aStart,aEnd) overlap [bStart,bEnd)? (minutes). */
function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function timeToMin(time: string): number {
  const [h, m] = time.split(':');
  // `|| 0` guards a malformed "HH" (no minutes) → NaN at runtime; it is a
  // value-based fallback, not a type-based one (h/m are typed string here).
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
}

export function useWeekCitaDnD({ weekDays, onDrop }: IUseWeekCitaDnDParams): IUseWeekCitaDnDResult {
  const [draggingId, setDraggingId] = useState<TCitaId | null>(null);
  const [preview, setPreview] = useState<IWeekDragPreview | null>(null);
  const [dropTargetDateStr, setDropTargetDateStr] = useState<string | null>(null);

  const intentRef = useRef<IDragIntent | null>(null);
  // Live registry of day-track DOM nodes, keyed by dateStr (set via ref callback).
  const tracksRef = useRef<Map<string, HTMLElement>>(new Map());
  // weekDays/onDrop are read inside the document-level handlers (move/up), which
  // always run after render, so a "latest ref" kept fresh in an effect lets those
  // handlers see current data without re-binding listeners mid-drag.
  const weekDaysRef = useRef(weekDays);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    weekDaysRef.current = weekDays;
    onDropRef.current = onDrop;
  }, [weekDays, onDrop]);

  const registerTrack = useCallback((dateStr: string, el: HTMLElement | null): void => {
    if (el === null) {
      tracksRef.current.delete(dateStr);
    } else {
      tracksRef.current.set(dateStr, el);
    }
  }, []);

  /** Resolve the day column under the pointer; falls back to the origin column. */
  const resolveTargetColumn = useCallback(
    (
      clientX: number,
      fallbackDateStr: string,
    ): {
      dateStr: string;
      rect: DOMRect;
    } => {
      for (const [dateStr, el] of tracksRef.current) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          return { dateStr, rect };
        }
      }
      const fallbackEl = tracksRef.current.get(fallbackDateStr);
      if (fallbackEl === undefined) {
        // Defensive: the origin track is always mounted while its own block is
        // being dragged, so this branch is unreachable in practice. Returning a
        // zero rect keeps the function total without a non-null assertion.
        return { dateStr: fallbackDateStr, rect: new DOMRect() };
      }
      return { dateStr: fallbackDateStr, rect: fallbackEl.getBoundingClientRect() };
    },
    [],
  );

  // Takes the active `intent` explicitly rather than reading `intentRef.current`,
  // so it is independent of the ref's lifecycle. This is what lets `finish` compute
  // the drop destination AFTER the ref has been torn down (see the commit path).
  const computePreview = useCallback(
    (event: PointerEvent, intent: IDragIntent): IWeekDragPreview => {
      const { appt, durationMin, originDateStr, pointerOffsetY } = intent;
      const { dateStr, rect } = resolveTargetColumn(event.clientX, originDateStr);

      // Pointer Y relative to the track top, minus where in the block we grabbed,
      // so the block's TOP (not the cursor) tracks the slot.
      const relYTop = event.clientY - rect.top - pointerOffsetY;
      const startTime = topOffsetToTime(
        relYTop,
        AGENDA_DAY_START_HOUR,
        AGENDA_SLOT_HEIGHT_PX,
        DND_SNAP_MIN,
        AGENDA_DAY_END_HOUR,
        durationMin,
      );
      const startMin = timeToMin(startTime);
      const endMin = startMin + durationMin;
      const topPx = timeToTopOffset(startTime, AGENDA_DAY_START_HOUR, AGENDA_SLOT_HEIGHT_PX);
      const heightPx = durationToHeight(durationMin, AGENDA_SLOT_HEIGHT_PX);

      // Derive endTime "HH:MM" from minutes for the snapshot + chip.
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Advisory overlap (Designer §4.2 nice-to-have): does this snapped slot
      // visually collide with another block in the target column? Excludes the
      // dragged cita itself. Purely a hint — never blocks the drop.
      const targetDay = weekDaysRef.current.find((d) => d.dateStr === dateStr);
      const overlap =
        targetDay?.appointments.some((a) => {
          if (a.id === appt.id) return false;
          const aStart = timeToMin(a.startTime);
          return rangesOverlap(startMin, endMin, aStart, aStart + a.durationMin);
        }) ?? false;

      return { dateStr, startTime, endTime, topPx, heightPx, overlap };
    },
    [resolveTargetColumn],
  );

  const cleanupListeners = useCallback((intent: IDragIntent): void => {
    document.removeEventListener('pointermove', intent.moveHandler);
    document.removeEventListener('pointerup', intent.upHandler);
    document.removeEventListener('keydown', intent.keyHandler, true);
    if (intent.rafId !== null) cancelAnimationFrame(intent.rafId);
  }, []);

  const resetState = useCallback((): void => {
    setDraggingId(null);
    setPreview(null);
    setDropTargetDateStr(null);
  }, []);

  const beginDrag = useCallback(
    (appt: IAgendaAppointment, originDateStr: string, e: React.PointerEvent): void => {
      // Left button only; ignore if a gesture is already in flight.
      if (e.button !== 0 || intentRef.current !== null) return;

      const blockRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pointerOffsetY = e.clientY - blockRect.top;

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
          const next = computePreview(ev, current);
          setPreview(next);
          setDropTargetDateStr(next.dateStr);
        });
      };

      const finish = (commit: boolean, ue: PointerEvent | null): void => {
        const intent = intentRef.current;
        if (intent === null) return;
        cleanupListeners(intent);
        intentRef.current = null;

        if (commit && intent.isDragging && ue !== null) {
          // Compute off the captured `intent` — the ref is already null here, but
          // `computePreview` no longer depends on it, so the destination resolves.
          const result = computePreview(ue, intent);
          const changed =
            result.dateStr !== intent.originDateStr || result.startTime !== intent.appt.startTime;
          if (changed) {
            onDropRef.current({
              citaId: intent.citaId,
              clientName: intent.appt.clientName,
              serviceName: intent.appt.serviceName,
              durationMin: intent.durationMin,
              origin: {
                dateStr: intent.originDateStr,
                startTime: intent.appt.startTime,
                endTime: intent.appt.endTime,
              },
              proposed: {
                dateStr: result.dateStr,
                startTime: result.startTime,
                endTime: result.endTime,
              },
            });
          }
        }
        // No-change drops (and a pure click that never crossed the threshold) fall
        // through to the block's onClick → detail popover (Analyst OQ-A2).
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
        citaId: appt.id,
        appt,
        originDateStr,
        durationMin: appt.durationMin,
        pointerOffsetY,
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
    [cleanupListeners, computePreview, resetState],
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

  return { draggingId, preview, dropTargetDateStr, registerTrack, beginDrag };
}
