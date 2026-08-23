/**
 * WorkScheduleCalendar.hooks.ts
 * SRP: state management and derived data only.
 * Exports:
 *   useWorkScheduleCalendar — core calendar state
 *   useDayDnD               — pointer-based Day-view drag & drop + resize
 *   useWeekDnD              — HTML5 Week-view drag between day columns
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type {
  DayDragPreview,
  Employee,
  ScheduleView,
  Shift,
  ShiftDraft,
  VisibleHourRange,
  WorkScheduleCalendarProps,
} from './WorkScheduleCalendar.types';
import {
  addDays,
  buildDateEmployeeIndex,
  buildShiftIndex,
  generateShiftId,
  getShiftsForEmployee,
  getVisibleDateRange,
  getWeekDays,
  minutesToTimeStr,
  snapToGrid,
  timeToMinutes,
} from './WorkScheduleCalendar.utils';

// ─── Shift reducer ────────────────────────────────────────────────────────────

type ShiftAction =
  | { type: 'CREATE'; payload: Shift }
  | { type: 'UPDATE'; payload: Shift }
  | { type: 'DELETE'; payload: string }
  // RESET re-seeds the whole list from canonical server state. Used by the
  // re-sync effect when the `initialShifts` prop identity changes (i.e. a real
  // React Query refetch produced new data), so a post-mutation refetch replaces
  // the optimistic temp-id shift with the persisted row instead of being ignored
  // until the next remount. See the diagnosis in the spec (state-loss bug).
  | { type: 'RESET'; payload: Shift[] };

function shiftReducer(state: Shift[], action: ShiftAction): Shift[] {
  switch (action.type) {
    case 'CREATE':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((s) => (s.id === action.payload.id ? action.payload : s));
    case 'DELETE':
      return state.filter((s) => s.id !== action.payload);
    case 'RESET':
      return action.payload;
  }
}

/**
 * Stable CONTENT signature of the canonical server shift list. The RESET re-sync
 * keys on this (by VALUE) instead of the `initialShifts` array identity: the prop
 * is re-derived on every WorkScheduleSection render (fresh Set/Date/array, not
 * referentially stable), so an identity check fired RESET on unrelated re-renders
 * and wiped the in-flight optimistic-create shift. Comparing content means RESET
 * fires only when the server data actually changed (a real refetch result).
 */
function shiftsSignature(list: readonly Shift[]): string {
  return list
    .map(
      (s) =>
        `${s.id}|${s.employeeId}|${s.date}|${s.startTime}|${s.endTime}|${s.color ?? ''}|${s.label ?? ''}`,
    )
    .join('~');
}

// ─── useWorkScheduleCalendar ──────────────────────────────────────────────────

export interface UseWorkScheduleReturn {
  currentView: ScheduleView;
  setView: (view: ScheduleView) => void;
  selectedDate: Date;
  today: Date;
  weekDays: Date[];
  goToDay: (date: Date) => void;
  goToPrev: () => void;
  goToNext: () => void;
  goToToday: () => void;
  animDirection: 'forward' | 'backward';
  shifts: Shift[];
  shiftIndex: Map<string, Shift[]>;
  dateEmployeeIndex: Map<string, Set<string>>;
  selectedShift: Shift | null;
  panelOpen: boolean;
  openPanel: (shift: Shift) => void;
  closePanel: () => void;
  editingShift: Shift | null;
  editModalOpen: boolean;
  openEditModal: (shift: Shift) => void;
  closeEditModal: () => void;
  draftShift: ShiftDraft | null;
  createModalOpen: boolean;
  openCreateModal: (draft: ShiftDraft) => void;
  closeCreateModal: () => void;
  createShift: (draft: ShiftDraft) => void;
  updateShift: (shift: Shift) => void;
  /**
   * Optimistic-only local move: dispatches a reducer UPDATE WITHOUT calling the
   * external onShiftUpdate callback or closing any modal. Used by the drag
   * reschedule confirm flow to (a) apply the move on Confirm — deferred from the
   * drop, so the card never jumps before the user agrees — and (b) snap the card
   * back to its origin on a server error. Persistence is the caller's job
   * (onShiftReschedule).
   */
  applyShiftLocal: (shift: Shift) => void;
  deleteShift: (id: string) => void;
}

export function useWorkScheduleCalendar(
  initialShifts: Shift[],
  initialDate: Date,
  initialView: ScheduleView,
  _employees: Employee[],
  onShiftCreate?: WorkScheduleCalendarProps['onShiftCreate'],
  onShiftUpdate?: WorkScheduleCalendarProps['onShiftUpdate'],
  onShiftDelete?: WorkScheduleCalendarProps['onShiftDelete'],
  onVisibleRangeChange?: WorkScheduleCalendarProps['onVisibleRangeChange'],
): UseWorkScheduleReturn {
  const today = useMemo(() => new Date(), []);

  const [currentView, setCurrentView] = useState<ScheduleView>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [shifts, dispatchShift] = useReducer(shiftReducer, initialShifts);

  // ── Re-sync the reducer to canonical server state ──────────────────────────
  // Keyed on the CONTENT signature (not array identity): `initialShifts` is
  // re-derived on every WorkScheduleSection render and is NOT referentially
  // stable, so an identity check fired RESET on every unrelated re-render and
  // wiped the in-flight optimistic-create shift before the refetch reconciled.
  // Comparing content means RESET fires only on a genuine refetch result; the
  // optimistic temp-id shift survives unrelated re-renders (same signature) and
  // is replaced by the persisted `esp:<id>` row only when the server data changes
  // (edits/deletes likewise reconcile to server truth). First-mount sig is the
  // seed, so the effect is a no-op then.
  const shiftsSig = shiftsSignature(initialShifts);
  const seededSigRef = useRef(shiftsSig);
  useEffect(() => {
    if (seededSigRef.current === shiftsSig) return;
    seededSigRef.current = shiftsSig;
    dispatchShift({ type: 'RESET', payload: initialShifts });
  }, [shiftsSig, initialShifts]);
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [draftShift, setDraftShift] = useState<ShiftDraft | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const shiftIndex = useMemo(() => buildShiftIndex(shifts), [shifts]);
  const dateEmployeeIndex = useMemo(() => buildDateEmployeeIndex(shifts), [shifts]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // ── Surface the visible date range to consumers ───────────────────────────
  // Recomputes the inclusive day-bounds the current view can show and notifies
  // the consumer (e.g. so a data read widens to cover the shown period instead
  // of only the current month). Fires once on mount and on every view/date
  // change. `onVisibleRangeChange` identity is intentionally excluded from deps:
  // the consumer typically passes an inline handler that changes each render;
  // including it would emit on unrelated renders. The view+date are the true
  // triggers. The consumer should drive STATE off this (it does — setVisibleRange).
  useEffect(() => {
    if (!onVisibleRangeChange) return;
    const { start, end } = getVisibleDateRange(currentView, selectedDate);
    onVisibleRangeChange(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- emit on view/date change only; handler identity excluded by design
  }, [currentView, selectedDate]);

  const setView = useCallback((view: ScheduleView) => {
    setCurrentView(view);
  }, []);

  const goToDay = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentView('day');
  }, []);

  const goToPrev = useCallback(() => {
    setAnimDirection('backward');
    setSelectedDate((prev) => {
      if (currentView === 'day') return addDays(prev, -1);
      if (currentView === 'week') return addDays(prev, -7);
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, [currentView]);

  const goToNext = useCallback(() => {
    setAnimDirection('forward');
    setSelectedDate((prev) => {
      if (currentView === 'day') return addDays(prev, 1);
      if (currentView === 'week') return addDays(prev, 7);
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, [currentView]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setAnimDirection(now > selectedDate ? 'forward' : 'backward');
    setSelectedDate(now);
  }, [selectedDate]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedShift(null);
    }, 300);
  }, []);

  const openPanel = useCallback((shift: Shift) => {
    setSelectedShift(shift);
    setPanelOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setTimeout(() => {
      setEditingShift(null);
    }, 250);
  }, []);

  const openEditModal = useCallback((shift: Shift) => {
    setEditingShift({ ...shift });
    setEditModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setTimeout(() => {
      setDraftShift(null);
    }, 250);
  }, []);

  const openCreateModal = useCallback((draft: ShiftDraft) => {
    setDraftShift(draft);
    setCreateModalOpen(true);
  }, []);

  const createShift = useCallback(
    (draft: ShiftDraft) => {
      const shift: Shift = {
        ...draft,
        id: generateShiftId(),
        color: 'primary',
      };
      dispatchShift({ type: 'CREATE', payload: shift });
      onShiftCreate?.(draft);
      closeCreateModal();
    },
    [onShiftCreate, closeCreateModal],
  );

  const updateShift = useCallback(
    (shift: Shift) => {
      dispatchShift({ type: 'UPDATE', payload: shift });
      onShiftUpdate?.(shift);
      closeEditModal();
    },
    [onShiftUpdate, closeEditModal],
  );

  // Optimistic-only local move (no external callback, no modal close) — see the
  // interface doc. Stable identity (no deps) so it never breaks memoization.
  const applyShiftLocal = useCallback((shift: Shift) => {
    dispatchShift({ type: 'UPDATE', payload: shift });
  }, []);

  const deleteShift = useCallback(
    (id: string) => {
      dispatchShift({ type: 'DELETE', payload: id });
      onShiftDelete?.(id);
      closeEditModal();
      closePanel();
    },
    [onShiftDelete, closeEditModal, closePanel],
  );

  return {
    currentView,
    setView,
    selectedDate,
    today,
    weekDays,
    goToDay,
    goToPrev,
    goToNext,
    goToToday,
    animDirection,
    shifts,
    shiftIndex,
    dateEmployeeIndex,
    selectedShift,
    panelOpen,
    openPanel,
    closePanel,
    editingShift,
    editModalOpen,
    openEditModal,
    closeEditModal,
    draftShift,
    createModalOpen,
    openCreateModal,
    closeCreateModal,
    createShift,
    updateShift,
    applyShiftLocal,
    deleteShift,
  };
}

// ─── useDayDnD ────────────────────────────────────────────────────────────────

const DND_THRESHOLD = 5; // px movement required to activate drag
const DND_SNAP = 15; // minute snap granularity

interface DragIntentRef {
  type: 'move' | 'resize';
  shift: Shift;
  employeeIndex: number;
  employees: Employee[];
  containerEl: HTMLDivElement;
  rulerHeight: number;
  labelWidth: number;
  slotWidth: number;
  rowHeight: number;
  visibleRange: VisibleHourRange;
  /** Cursor offset within the shift block at drag start (for "move") */
  pointerOffsetX: number;
  durationMin: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  rafId: number | null;
  latestEvent: PointerEvent | null;
  moveHandler: (e: PointerEvent) => void;
  upHandler: (e: PointerEvent) => void;
}

/**
 * Pointer-based drag & drop for the Day view.
 *
 * Supports:
 *   - "move"   — drag a shift block horizontally (time) and vertically (employee)
 *   - "resize" — drag the right edge to extend/shrink endTime
 *
 * Uses a 5px threshold before activating so click and drag never conflict.
 * Preview is computed via RAF for smooth 60fps updates.
 *
 * On a drop that changes the shift, it calls `onCommit(proposed, origin)` — it
 * does NOT itself persist or mutate the shift list. The owner (WorkScheduleCalendar)
 * decides whether that opens a confirm Dialog (pessimistic) or applies immediately
 * (legacy). Passing both the proposed and origin shifts lets the Dialog summarise
 * the change.
 */
export function useDayDnD(onCommit: (proposed: Shift, origin: Shift) => void) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DayDragPreview | null>(null);
  const intentRef = useRef<DragIntentRef | null>(null);

  // ── Preview computation ────────────────────────────────────────────────────

  const computePreview = useCallback((event: PointerEvent): DayDragPreview | null => {
    const intent = intentRef.current;
    if (!intent) return null;

    const {
      containerEl,
      labelWidth,
      rulerHeight,
      slotWidth,
      rowHeight,
      visibleRange,
      employees,
      shift,
      type,
      pointerOffsetX,
      durationMin,
      employeeIndex,
    } = intent;

    const rect = containerEl.getBoundingClientRect();
    // Grid-relative coordinates (accounting for scroll)
    const relX = event.clientX - rect.left + containerEl.scrollLeft - labelWidth;
    const relY = event.clientY - rect.top + containerEl.scrollTop - rulerHeight;

    const rangeStartMin = visibleRange.startHour * 60;
    const rangeEndMin = visibleRange.endHour * 60;

    if (type === 'move') {
      // Adjust for where within the block the user grabbed
      const adjustedRelX = relX - pointerOffsetX;
      const rawStartMin = rangeStartMin + (adjustedRelX / slotWidth) * 60;
      const snappedStartMin = Math.max(
        rangeStartMin,
        Math.min(rangeEndMin - durationMin, snapToGrid(rawStartMin, DND_SNAP)),
      );
      const snappedEndMin = snappedStartMin + durationMin;

      const targetEmpIdx = Math.max(
        0,
        Math.min(employees.length - 1, Math.floor(relY / rowHeight)),
      );

      return {
        type: 'move',
        shiftId: shift.id,
        previewStartTime: minutesToTimeStr(snappedStartMin),
        previewEndTime: minutesToTimeStr(snappedEndMin),
        previewEmployeeIndex: targetEmpIdx,
        left: labelWidth + ((snappedStartMin - rangeStartMin) / 60) * slotWidth,
        top: rulerHeight + targetEmpIdx * rowHeight + 8,
        width: Math.max((durationMin / 60) * slotWidth, 4),
        height: rowHeight - 16,
        color: shift.color ?? 'primary',
        employeeName: employees[targetEmpIdx]?.name ?? '',
        // Cross-row landing = reassignment → drives the ghost "→ therapist" chip.
        isReassignment: employees[targetEmpIdx]?.id !== shift.employeeId,
      };
    } else {
      // resize — only endTime changes, employee stays the same
      const originalStartMin = timeToMinutes(shift.startTime);
      const rawEndMin = rangeStartMin + (relX / slotWidth) * 60;
      const snappedEndMin = Math.max(
        originalStartMin + DND_SNAP,
        Math.min(rangeEndMin, snapToGrid(rawEndMin, DND_SNAP)),
      );

      return {
        type: 'resize',
        shiftId: shift.id,
        previewStartTime: shift.startTime,
        previewEndTime: minutesToTimeStr(snappedEndMin),
        previewEmployeeIndex: employeeIndex,
        left: labelWidth + ((originalStartMin - rangeStartMin) / 60) * slotWidth,
        top: rulerHeight + employeeIndex * rowHeight + 8,
        width: Math.max(((snappedEndMin - originalStartMin) / 60) * slotWidth, 4),
        height: rowHeight - 16,
        color: shift.color ?? 'primary',
        employeeName: employees[employeeIndex]?.name ?? '',
        // Resize never changes the employee.
        isReassignment: false,
      };
    }
  }, []);

  // ── Begin drag (called from onPointerDown on a block or resize handle) ──────

  const beginDragIntent = useCallback(
    (
      type: 'move' | 'resize',
      shift: Shift,
      empIndex: number,
      e: React.PointerEvent,
      config: {
        employees: Employee[];
        containerEl: HTMLDivElement;
        rulerHeight: number;
        labelWidth: number;
        slotWidth: number;
        rowHeight: number;
        visibleRange: VisibleHourRange;
        /** Cursor x-offset within the block (for move type only) */
        pointerOffsetX?: number;
      },
    ) => {
      e.stopPropagation();

      const durationMin = timeToMinutes(shift.endTime) - timeToMinutes(shift.startTime);

      const moveHandler = (me: PointerEvent) => {
        const intent = intentRef.current;
        if (!intent) return;

        if (!intent.isDragging) {
          const dx = me.clientX - intent.startX;
          const dy = me.clientY - intent.startY;
          if (Math.sqrt(dx * dx + dy * dy) < DND_THRESHOLD) return;
          intent.isDragging = true;
          setDraggingId(shift.id);
        }

        intent.latestEvent = me;
        // RAF-throttle: skip if a frame is already scheduled
        if (intent.rafId !== null) return;
        intent.rafId = requestAnimationFrame(() => {
          if (!intentRef.current) return;
          intentRef.current.rafId = null;
          const ev = intentRef.current.latestEvent;
          if (ev) setDragPreview(computePreview(ev));
        });
      };

      const upHandler = (ue: PointerEvent) => {
        const intent = intentRef.current;
        if (!intent) return;

        document.removeEventListener('pointermove', moveHandler);
        if (intent.rafId !== null) cancelAnimationFrame(intent.rafId);

        if (intent.isDragging) {
          const preview = computePreview(ue);
          setDraggingId(null);
          setDragPreview(null);
          intentRef.current = null;

          if (preview) {
            // Explicit undefined type: array index access may return undefined at runtime
            const targetEmployee: Employee | undefined =
              config.employees[preview.previewEmployeeIndex];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: array index may be undefined despite TS typing (noUncheckedIndexedAccess not enabled)
            if (targetEmployee !== undefined) {
              // Apply only when something actually changed
              const changed =
                preview.previewStartTime !== shift.startTime ||
                preview.previewEndTime !== shift.endTime ||
                targetEmployee.id !== shift.employeeId;

              if (changed) {
                // Report the proposed change + the origin snapshot; the owner
                // gates persistence (confirm Dialog) — the hook does not mutate.
                onCommit(
                  {
                    ...shift,
                    employeeId: targetEmployee.id,
                    startTime: preview.previewStartTime,
                    endTime: preview.previewEndTime,
                  },
                  shift,
                );
              }
            }
          }
        } else {
          intentRef.current = null;
          // Pure click — let the onClick handler fire naturally
        }
      };

      intentRef.current = {
        type,
        shift,
        employeeIndex: empIndex,
        employees: config.employees,
        containerEl: config.containerEl,
        rulerHeight: config.rulerHeight,
        labelWidth: config.labelWidth,
        slotWidth: config.slotWidth,
        rowHeight: config.rowHeight,
        visibleRange: config.visibleRange,
        pointerOffsetX: config.pointerOffsetX ?? 0,
        durationMin,
        isDragging: false,
        startX: e.clientX,
        startY: e.clientY,
        rafId: null,
        latestEvent: null,
        moveHandler,
        upHandler,
      };

      document.addEventListener('pointermove', moveHandler);
      document.addEventListener('pointerup', upHandler, { once: true });
    },
    [computePreview, onCommit],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const intent = intentRef.current;
      if (!intent) return;
      document.removeEventListener('pointermove', intent.moveHandler);
      document.removeEventListener('pointerup', intent.upHandler);
      if (intent.rafId !== null) cancelAnimationFrame(intent.rafId);
    };
  }, []);

  return { draggingId, dragPreview, beginDragIntent };
}

// ─── useWeekDnD ───────────────────────────────────────────────────────────────

/**
 * HTML5 drag-based DnD for the Week view.
 *
 * Rules:
 *   - Drag a shift card from its source day column
 *   - If target day column already contains a shift for that employee → invalid drop
 *   - Otherwise → shift is moved to the new date
 *
 * On a valid drop it calls `onCommit(proposed, origin)` — it does NOT persist or
 * mutate the shift list. The owner (WorkScheduleCalendar) gates persistence
 * (confirm Dialog vs legacy immediate apply).
 */
export function useWeekDnD(
  shiftIndex: Map<string, Shift[]>,
  onCommit: (proposed: Shift, origin: Shift) => void,
) {
  const [draggingShift, setDraggingShift] = useState<Shift | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

  const isValidDrop = useCallback(
    (shift: Shift | null, targetDateKey: string): boolean => {
      if (!shift) return false;
      if (shift.date === targetDateKey) return false; // same column
      const existing = getShiftsForEmployee(shift.employeeId, targetDateKey, shiftIndex);
      return existing.length === 0;
    },
    [shiftIndex],
  );

  const handleDragStart = useCallback((shift: Shift) => {
    setDraggingShift(shift);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, dateKey: string) => {
      e.preventDefault();
      setDragOverDateKey(dateKey);
      e.dataTransfer.dropEffect = isValidDrop(draggingShift, dateKey) ? 'move' : 'none';
    },
    [draggingShift, isValidDrop],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear when leaving the column itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDateKey(null);
    }
  }, []);

  const handleDrop = useCallback(
    (dateKey: string) => {
      if (draggingShift && isValidDrop(draggingShift, dateKey)) {
        // Report proposed (new date) + origin; owner gates persistence.
        onCommit({ ...draggingShift, date: dateKey }, draggingShift);
      }
      setDraggingShift(null);
      setDragOverDateKey(null);
    },
    [draggingShift, isValidDrop, onCommit],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingShift(null);
    setDragOverDateKey(null);
  }, []);

  const getDragOverState = useCallback(
    (dateKey: string) => ({
      isDragOver: dragOverDateKey === dateKey,
      isValidDrop: dragOverDateKey === dateKey && isValidDrop(draggingShift, dateKey),
    }),
    [dragOverDateKey, draggingShift, isValidDrop],
  );

  return {
    draggingShiftId: draggingShift?.id ?? null,
    dragOverDateKey,
    getDragOverState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
