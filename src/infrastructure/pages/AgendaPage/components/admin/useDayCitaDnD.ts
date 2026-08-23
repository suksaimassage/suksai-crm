/**
 * useDayCitaDnD — pointer-based drag & drop for the admin DAY grid (Surface A).
 *
 * Day-view sibling of `useWeekCitaDnD`. The two grids share the same gesture
 * idiom; the ONLY axis difference is the horizontal one: in the week grid each
 * column is a DAY (hit-test → dateStr), here each column is a THERAPIST (hit-test
 * → therapistId). The date is fixed (= `activeDate`), so a drag both:
 *   - VERTICAL  → a new 30-min start (and end = start + durationMin; MOVE-ONLY,
 *     duration is fixed by the servicio — Rule 2 rejects an independent end).
 *   - HORIZONTAL→ a new therapist column (reassignment), validated server-side
 *     by `useRescheduleCita` (rules 1–10 re-run on the destination therapist when
 *     `usuarioId` changes — availability + overlap).
 *
 * "SIN ASIGNACIÓN" column: the grid also renders a leading pseudo-column
 * (`UNASSIGNED_COLUMN`) for citas with no therapist. Its blocks are a drag SOURCE
 * — dropping one onto a therapist column ASSIGNS that therapist (the reschedule
 * carries `usuarioId`, and `citaService.reschedule` auto-transitions the
 * sin_asignar cita to 'pendiente'). Dragging the OTHER way (therapist → unassigned)
 * is deliberately NOT a valid target: a therapist-origin drag never resolves onto
 * the unassigned column, so a cita can't be silently unassigned by DnD.
 *
 * Mirrors useWeekCitaDnD exactly otherwise: a mutable `intentRef`, a 5px activation
 * threshold so click and drag never conflict, RAF-throttled pointer-move → preview
 * computation, document-level listeners, and a `changed` guard on drop. Escape
 * cancels the gesture (drag is not a trap — WCAG 2.1.2).
 *
 * The commit is pessimistic: this hook NEVER moves the real block. On a net change
 * (start time changed OR column changed) it calls `onDrop(snapshot)` with a
 * self-contained origin+proposed snapshot; the parent opens the confirm Dialog and
 * persists via `useRescheduleCita`.
 *
 * Performance: RAF-throttle + a `focus`-free hot path follow
 * `bugfix_chrome_perf_violations_overlays`. The preview state is isolated so a
 * pointer-move does not recompute the grid's per-therapist grouping.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId, TUserId } from '@domain/types';
import { timeToTopOffset, durationToHeight, topOffsetToTime } from '@infra/utils/agenda.utils';
import {
  AGENDA_SLOT_HEIGHT_PX,
  AGENDA_DAY_START_HOUR,
  AGENDA_DAY_END_HOUR,
} from '../../agenda.constants';

/** Movement (px) required before a press becomes a drag — mirrors DND_THRESHOLD. */
const DND_THRESHOLD = 5;
/** Vertical snap granularity (min). 30 = the agenda's slot grid. */
const DND_SNAP_MIN = 30;

/** Sentinel column id for the leading "Sin asignación" pseudo-column. */
export const UNASSIGNED_COLUMN = 'unassigned' as const;

/** A day-grid column is either a therapist (id) or the unassigned pseudo-column. */
export type TDayColumnId = TUserId | typeof UNASSIGNED_COLUMN;

/** Slim therapist descriptor the hook needs to label columns + the snapshot. */
export interface IDayDnDTherapist {
  readonly id: TUserId;
  readonly nombre: string;
  readonly apellidos: string;
}

/**
 * Snapshot handed to the parent on a net-change drop. Mirrors IWeekRescheduleDrop
 * but the column identity is the THERAPIST (id + display name) on BOTH origin and
 * proposed, plus a fixed `dateStr` (the day never changes in this view).
 *
 * `therapistId` is `TUserId | null`: null = the unassigned column. An origin of
 * null with a therapist proposed = an ASSIGNMENT; a therapist origin never
 * resolves to a null proposed (therapist → unassigned is not a valid drop target).
 */
export interface IDayRescheduleDrop {
  readonly citaId: TCitaId;
  readonly clientName: string | null;
  readonly serviceName: string;
  readonly durationMin: number;
  /** The fixed active date (YYYY-MM-DD) — unchanged by the drag. */
  readonly dateStr: string;
  readonly origin: {
    readonly therapistId: TUserId | null;
    readonly therapistName: string;
    readonly startTime: string;
    readonly endTime: string;
  };
  readonly proposed: {
    readonly therapistId: TUserId | null;
    readonly therapistName: string;
    readonly startTime: string;
    readonly endTime: string;
  };
}

/** Live preview-ghost position while dragging (gesture-local). */
export interface IDayDragPreview {
  /** Column the ghost is currently over (therapist id or the unassigned sentinel). */
  readonly columnId: TDayColumnId;
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
  originColumnId: TDayColumnId;
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

interface IUseDayCitaDnDParams {
  /** Therapist columns in render order — used to hit-test + label the snapshot. */
  readonly therapists: readonly IDayDnDTherapist[];
  /** Appointments grouped by therapist id — used for the advisory overlap hint. */
  readonly apptsByTherapist: ReadonlyMap<TUserId, readonly IAgendaAppointment[]>;
  /** The fixed active date (YYYY-MM-DD) carried into the snapshot. */
  readonly activeDate: string;
  /** Fired on a drop whose (column, startTime) differs from the original. */
  readonly onDrop: (drop: IDayRescheduleDrop) => void;
  /** Display name for the unassigned pseudo-column (localized), for the snapshot. */
  readonly unassignedName?: string;
}

interface IUseDayCitaDnDResult {
  /** Cita currently lifted/dragging (for $lifted/$dragging styling), or null. */
  readonly draggingId: TCitaId | null;
  /** Live ghost position, or null when not dragging. */
  readonly preview: IDayDragPreview | null;
  /** Column under the pointer (for the $dropTarget wash), or null. */
  readonly dropTargetColumnId: TDayColumnId | null;
  /** Ref callback registering each column-track element for hit-testing. */
  readonly registerTrack: (columnId: TDayColumnId, el: HTMLElement | null) => void;
  /** Begin a drag from a block's onPointerDown. */
  readonly beginDrag: (
    appt: IAgendaAppointment,
    originColumnId: TDayColumnId,
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

/** Display name from the slim therapist descriptor (matches the column header). */
function therapistName(th: IDayDnDTherapist): string {
  return th.apellidos ? `${th.nombre} ${th.apellidos}` : th.nombre;
}

export function useDayCitaDnD({
  therapists,
  apptsByTherapist,
  activeDate,
  onDrop,
  unassignedName = '',
}: IUseDayCitaDnDParams): IUseDayCitaDnDResult {
  const [draggingId, setDraggingId] = useState<TCitaId | null>(null);
  const [preview, setPreview] = useState<IDayDragPreview | null>(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState<TDayColumnId | null>(null);

  const intentRef = useRef<IDragIntent | null>(null);
  // Live registry of column-track DOM nodes, keyed by column id (set via ref
  // callback). Used for the horizontal hit-test. Includes the unassigned column.
  const tracksRef = useRef<Map<TDayColumnId, HTMLElement>>(new Map());
  // therapists/apptsByTherapist/activeDate/onDrop are read inside the
  // document-level handlers (move/up), which always run after render, so "latest
  // refs" kept fresh in an effect let those handlers see current data without
  // re-binding listeners mid-drag.
  const therapistsRef = useRef(therapists);
  const apptsByTherapistRef = useRef(apptsByTherapist);
  const activeDateRef = useRef(activeDate);
  const onDropRef = useRef(onDrop);
  const unassignedNameRef = useRef(unassignedName);
  useEffect(() => {
    therapistsRef.current = therapists;
    apptsByTherapistRef.current = apptsByTherapist;
    activeDateRef.current = activeDate;
    onDropRef.current = onDrop;
    unassignedNameRef.current = unassignedName;
  }, [therapists, apptsByTherapist, activeDate, onDrop, unassignedName]);

  const registerTrack = useCallback((columnId: TDayColumnId, el: HTMLElement | null): void => {
    if (el === null) {
      tracksRef.current.delete(columnId);
    } else {
      tracksRef.current.set(columnId, el);
    }
  }, []);

  /**
   * Resolve the column under the pointer; falls back to the origin. A therapist
   * origin never resolves onto the unassigned column (therapist → unassigned is
   * not a valid drop), so that column is skipped unless the drag started there.
   */
  const resolveTargetColumn = useCallback(
    (
      clientX: number,
      originColumnId: TDayColumnId,
    ): {
      columnId: TDayColumnId;
      rect: DOMRect;
    } => {
      for (const [columnId, el] of tracksRef.current) {
        if (columnId === UNASSIGNED_COLUMN && originColumnId !== UNASSIGNED_COLUMN) continue;
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          return { columnId, rect };
        }
      }
      const fallbackEl = tracksRef.current.get(originColumnId);
      if (fallbackEl === undefined) {
        // Defensive: the origin track is always mounted while its own block is
        // being dragged, so this branch is unreachable in practice. Returning a
        // zero rect keeps the function total without a non-null assertion.
        return { columnId: originColumnId, rect: new DOMRect() };
      }
      return { columnId: originColumnId, rect: fallbackEl.getBoundingClientRect() };
    },
    [],
  );

  // Takes the active `intent` explicitly rather than reading `intentRef.current`,
  // so it is independent of the ref's lifecycle. This is what lets `finish` compute
  // the drop destination AFTER the ref has been torn down (see the commit path).
  const computePreview = useCallback(
    (event: PointerEvent, intent: IDragIntent): IDayDragPreview => {
      const { appt, durationMin, originColumnId, pointerOffsetY } = intent;
      const { columnId, rect } = resolveTargetColumn(event.clientX, originColumnId);

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
      // visually collide with another block in the TARGET therapist's column?
      // Excludes the dragged cita itself. Purely a hint — never blocks the drop.
      // The unassigned column has no overlap map entry → no hint there.
      const targetAppts =
        typeof columnId === 'number' ? apptsByTherapistRef.current.get(columnId) : undefined;
      const overlap =
        targetAppts?.some((a) => {
          if (a.id === appt.id) return false;
          const aStart = timeToMin(a.startTime);
          return rangesOverlap(startMin, endMin, aStart, aStart + a.durationMin);
        }) ?? false;

      return { columnId, startTime, endTime, topPx, heightPx, overlap };
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
    setDropTargetColumnId(null);
  }, []);

  /** Resolve a column id → display name for the snapshot (unassigned → its label). */
  const columnName = useCallback((columnId: TDayColumnId): string => {
    if (columnId === UNASSIGNED_COLUMN) return unassignedNameRef.current;
    const th = therapistsRef.current.find((t) => t.id === columnId);
    return th !== undefined ? therapistName(th) : '—';
  }, []);

  const beginDrag = useCallback(
    (appt: IAgendaAppointment, originColumnId: TDayColumnId, e: React.PointerEvent): void => {
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
          setDropTargetColumnId(next.columnId);
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
            result.columnId !== intent.originColumnId || result.startTime !== intent.appt.startTime;
          if (changed) {
            const toId: TUserId | null =
              result.columnId === UNASSIGNED_COLUMN ? null : result.columnId;
            const fromId: TUserId | null =
              intent.originColumnId === UNASSIGNED_COLUMN ? null : intent.originColumnId;
            onDropRef.current({
              citaId: intent.citaId,
              clientName: intent.appt.clientName,
              serviceName: intent.appt.serviceName,
              durationMin: intent.durationMin,
              dateStr: activeDateRef.current,
              origin: {
                therapistId: fromId,
                therapistName: columnName(intent.originColumnId),
                startTime: intent.appt.startTime,
                endTime: intent.appt.endTime,
              },
              proposed: {
                therapistId: toId,
                therapistName: columnName(result.columnId),
                startTime: result.startTime,
                endTime: result.endTime,
              },
            });
          }
        }
        // No-change drops (and a pure click that never crossed the threshold) fall
        // through to the block's onClick → detail popover.
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
        originColumnId,
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
    [cleanupListeners, columnName, computePreview, resetState],
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

  return { draggingId, preview, dropTargetColumnId, registerTrack, beginDrag };
}
