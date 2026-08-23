/**
 * WorkScheduleCalendar.tsx  —  v2
 *
 * Bug fixes:
 *   - StyledShiftArea overflow: hidden  → eliminates cross/bleed artifact
 *   - EmployeeRow manages its own hover state  → no CSS display toggle, no reflow
 *   - Grid lines rendered exclusively by StyledGridLine  → no double-paint
 *
 * New features:
 *   - density prop (xs | sm | md) with dynamic row heights
 *   - Day view: pointer-based drag & drop (move + resize)
 *   - Week view: HTML5 drag between day columns with valid/invalid feedback
 *
 * SRP: UI orchestration only — state lives in hooks.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDayDnD, useWeekDnD, useWorkScheduleCalendar } from './WorkScheduleCalendar.hooks';
import {
  buildMonthGrid,
  computeShiftPosition,
  DEFAULT_SLOT_WIDTH,
  DEFAULT_VISIBLE_RANGE,
  DENSITY_CONFIG,
  formatHourLabel,
  formatTimeRange,
  getGridWidth,
  getHeaderTitle,
  getShiftsForEmployee,
  getVisibleHours,
  getWeekdayShort,
  isSameDay,
  minutesToTimeStr,
  shiftDurationLabel,
  toDateKey,
} from './WorkScheduleCalendar.utils';
import type {
  Employee,
  PendingReschedule,
  ScheduleDensity,
  ScheduleView,
  Shift,
  ShiftColor,
  ShiftDraft,
  ShiftDraftTipo,
  TRescheduleShape,
  VisibleHourRange,
  WorkScheduleCalendarProps,
} from './WorkScheduleCalendar.types';
import * as S from './WorkScheduleCalendar.styles';
import { Avatar, AvatarGroup } from '@infra/components/ui/common/Avatar';
import { Button } from '@infra/components/ui/common/Button';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { Typography } from '@infra/components/ui/core/Typography';

// ─── Constants ────────────────────────────────────────────────────────────────

const TINY_THRESHOLD_PX = 48;
const DEFAULT_DENSITY: ScheduleDensity = 'md';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const ChevLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Padlock — non-colour cue that a shift is read-only (recurrente). Decorative;
// the accessible name carries the read-only hint.
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

// ─── ViewSwitcher ─────────────────────────────────────────────────────────────

const ViewSwitcher: React.FC<{
  current: ScheduleView;
  onChange: (v: ScheduleView) => void;
}> = React.memo(({ current, onChange }) => {
  const { t } = useTranslation('terapeutas');
  const viewLabels: Record<ScheduleView, string> = {
    day: t('workSchedule.viewDay'),
    week: t('workSchedule.viewWeek'),
    month: t('workSchedule.viewMonth'),
  };
  return (
    <S.StyledViewSwitcher role="group" aria-label={t('workSchedule.calendarViewAriaLabel')}>
      {(['day', 'week', 'month'] as ScheduleView[]).map((v) => (
        <S.StyledViewBtn
          key={v}
          type="button"
          $active={current === v}
          onClick={() => {
            onChange(v);
          }}
          aria-pressed={current === v}
        >
          {viewLabels[v]}
        </S.StyledViewBtn>
      ))}
    </S.StyledViewSwitcher>
  );
});
ViewSwitcher.displayName = 'ViewSwitcher';

// ─── Month View ───────────────────────────────────────────────────────────────

// Reference dates for the 7 weekdays (Sun=0 … Sat=6) — used to generate locale-aware labels.
const WEEKDAY_SEED_DATES = Array.from({ length: 7 }, (_, i) => new Date(2025, 0, 5 + i));

const MonthView: React.FC<{
  selectedDate: Date;
  today: Date;
  employees: Employee[];
  dateEmployeeIndex: Map<string, Set<string>>;
  onDayClick: (date: Date) => void;
  locale: string;
}> = React.memo(({ selectedDate, today, employees, dateEmployeeIndex, onDayClick, locale }) => {
  const { t } = useTranslation('terapeutas');
  const grid = useMemo(
    () =>
      buildMonthGrid(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        today,
        employees,
        dateEmployeeIndex,
      ),
    [selectedDate, today, employees, dateEmployeeIndex],
  );
  const weekdayLabels = useMemo(
    () => WEEKDAY_SEED_DATES.map((d) => getWeekdayShort(d, locale)),
    [locale],
  );

  return (
    <S.StyledMonthWrapper role="grid" aria-label={t('workSchedule.monthlyScheduleAriaLabel')}>
      <S.StyledMonthWeekdayRow role="row">
        {weekdayLabels.map((label) => (
          <S.StyledMonthWeekdayLabel key={label} role="columnheader">
            {label}
          </S.StyledMonthWeekdayLabel>
        ))}
      </S.StyledMonthWeekdayRow>

      <S.StyledMonthGrid>
        {grid.flatMap((week) =>
          week.days.map((day) => {
            const key = toDateKey(day.date);
            return (
              <S.StyledMonthDayCell
                key={key}
                role="gridcell"
                aria-label={t('workSchedule.monthDayCellAriaLabel', {
                  date: day.date.toLocaleDateString(),
                  count: day.employees.length,
                })}
                $isCurrentMonth={day.isCurrentMonth}
                $isToday={day.isToday}
                onClick={() => {
                  onDayClick(day.date);
                }}
              >
                <S.StyledMonthDayNumber $isToday={day.isToday}>
                  {day.dayNumber}
                </S.StyledMonthDayNumber>

                {day.employees.length > 0 && (
                  <S.StyledMonthAvatarArea>
                    <AvatarGroup max={3} size="xs" spacing="tight" bordered>
                      {day.employees.map((emp) => (
                        <Avatar key={emp.id} name={emp.name} src={emp.avatarSrc} size="xs" />
                      ))}
                    </AvatarGroup>
                  </S.StyledMonthAvatarArea>
                )}
              </S.StyledMonthDayCell>
            );
          }),
        )}
      </S.StyledMonthGrid>
    </S.StyledMonthWrapper>
  );
});
MonthView.displayName = 'MonthView';

// ─── Week View ────────────────────────────────────────────────────────────────

const WeekView: React.FC<{
  weekDays: Date[];
  today: Date;
  selectedDate: Date;
  employees: Employee[];
  shiftIndex: Map<string, Shift[]>;
  dateEmployeeIndex: Map<string, Set<string>>;
  readOnlyHint: string;
  onDayClick: (date: Date) => void;
  onShiftClick: (shift: Shift) => void;
  onCommit: (proposed: Shift, origin: Shift) => void;
  isShiftReadOnly: (shift: Shift) => boolean;
  locale: string;
}> = React.memo(
  ({
    weekDays,
    today,
    selectedDate,
    employees,
    shiftIndex,
    dateEmployeeIndex,
    readOnlyHint,
    onDayClick,
    onShiftClick,
    onCommit,
    isShiftReadOnly,
    locale,
  }) => {
    const { t } = useTranslation('terapeutas');
    const {
      draggingShiftId,
      getDragOverState,
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
    } = useWeekDnD(shiftIndex, onCommit);

    return (
      <S.StyledWeekWrapper>
        <S.StyledWeekGrid role="grid" aria-label={t('workSchedule.weeklyScheduleAriaLabel')}>
          {weekDays.map((day) => {
            const dateKey = toDateKey(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const { isDragOver, isValidDrop } = getDragOverState(dateKey);
            const employeeIds = dateEmployeeIndex.get(dateKey) ?? new Set<string>();
            const dayEmployees = employees.filter((e) => employeeIds.has(e.id));

            return (
              <S.StyledWeekDayColumn
                key={dateKey}
                role="gridcell"
                $isDragOver={isDragOver}
                $isValidDrop={isValidDrop}
                onDragOver={(e) => {
                  handleDragOver(e, dateKey);
                }}
                onDragLeave={handleDragLeave}
                onDrop={() => {
                  handleDrop(dateKey);
                }}
              >
                <S.StyledWeekDayHeader
                  $isToday={isToday}
                  $isSelected={isSelected}
                  onClick={() => {
                    onDayClick(day);
                  }}
                  aria-label={t('workSchedule.weekDayToDayViewAriaLabel', {
                    date: day.toLocaleDateString(),
                  })}
                >
                  <S.StyledWeekDayLabel>{getWeekdayShort(day, locale)}</S.StyledWeekDayLabel>
                  <S.StyledWeekDayNumber $isToday={isToday}>{day.getDate()}</S.StyledWeekDayNumber>
                </S.StyledWeekDayHeader>

                <S.StyledWeekDayBody>
                  {dayEmployees.length === 0 ? (
                    <S.StyledWeekEmptyState>—</S.StyledWeekEmptyState>
                  ) : (
                    dayEmployees.map((emp) =>
                      getShiftsForEmployee(emp.id, dateKey, shiftIndex).map((shift) => {
                        // Read-only (recurrente): NOT draggable (fixes Latent
                        // Defect #1 — was draggable then no-op'd at the handler).
                        const readOnly = isShiftReadOnly(shift);
                        const baseAriaLabel = `${emp.name} — ${formatTimeRange(shift.startTime, shift.endTime)}`;
                        return (
                          <S.StyledWeekEmployeeCard
                            key={shift.id}
                            draggable={!readOnly}
                            $color={shift.color ?? 'primary'}
                            $isDragging={draggingShiftId === shift.id}
                            $readOnly={readOnly}
                            onDragStart={
                              readOnly
                                ? undefined
                                : () => {
                                    handleDragStart(shift);
                                  }
                            }
                            onDragEnd={readOnly ? undefined : handleDragEnd}
                            onClick={() => {
                              onShiftClick(shift);
                            }}
                            aria-label={
                              readOnly ? `${baseAriaLabel} ${readOnlyHint}` : baseAriaLabel
                            }
                          >
                            {readOnly && (
                              <S.StyledShiftLockGlyph>
                                <LockIcon />
                              </S.StyledShiftLockGlyph>
                            )}
                            <Avatar name={emp.name} src={emp.avatarSrc} size="xs" />
                            <S.StyledWeekEmployeeName>{emp.name}</S.StyledWeekEmployeeName>
                            <S.StyledWeekShiftTime>
                              {formatTimeRange(shift.startTime, shift.endTime)}
                            </S.StyledWeekShiftTime>
                            {/* Non-color cue for read-only recurrente shifts (WCAG 1.4.1) */}
                            {shift.label && (
                              <S.StyledWeekShiftTime>{shift.label}</S.StyledWeekShiftTime>
                            )}
                          </S.StyledWeekEmployeeCard>
                        );
                      }),
                    )
                  )}
                </S.StyledWeekDayBody>
              </S.StyledWeekDayColumn>
            );
          })}
        </S.StyledWeekGrid>
      </S.StyledWeekWrapper>
    );
  },
);
WeekView.displayName = 'WeekView';

// ─── EmployeeRow (Day View) ───────────────────────────────────────────────────
//
// Isolated memoized component so hover state is LOCAL.
// This prevents the parent DayView from re-rendering on every
// mouseenter/mouseleave — fixing the hover freeze bug.

interface EmployeeRowProps {
  employee: Employee;
  empIndex: number;
  shifts: Shift[];
  density: ScheduleDensity;
  dateKey: string;
  visibleRange: VisibleHourRange;
  slotWidth: number;
  gridWidth: number;
  selectedShiftId: string | null;
  draggingId: string | null;
  /** True while a Day drag hovers THIS row as a reassignment target (≠ origin). */
  isReassignTarget: boolean;
  containerElRef: React.RefObject<HTMLDivElement | null>;
  rulerHeight: number;
  allEmployees: Employee[];
  readOnlyHint: string;
  onShiftClick: (shift: Shift) => void;
  onAddShift: (draft: ShiftDraft) => void;
  isShiftReadOnly: (shift: Shift) => boolean;
  beginDragIntent: ReturnType<typeof useDayDnD>['beginDragIntent'];
}

const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
  ({
    employee,
    empIndex,
    shifts,
    density,
    dateKey,
    visibleRange,
    slotWidth,
    gridWidth,
    selectedShiftId,
    draggingId,
    isReassignTarget,
    containerElRef,
    rulerHeight,
    allEmployees,
    readOnlyHint,
    onShiftClick,
    onAddShift,
    isShiftReadOnly,
    beginDragIntent,
  }) => {
    /**
     * Hover state lives here — isolated from parent.
     * React schedules this as a batched low-priority update so it never
     * causes a cascading re-render chain up the tree.
     */
    const { t } = useTranslation('terapeutas');
    const [isHovered, setIsHovered] = useState(false);

    const config = DENSITY_CONFIG[density];
    const hasShifts = shifts.length > 0;

    const handleAddClick = useCallback(() => {
      onAddShift({
        employeeId: employee.id,
        date: dateKey,
        startTime: minutesToTimeStr(visibleRange.startHour * 60),
        endTime: minutesToTimeStr(
          Math.min(visibleRange.startHour * 60 + 480, visibleRange.endHour * 60),
        ),
      });
    }, [employee.id, dateKey, visibleRange, onAddShift]);

    return (
      <S.StyledEmployeeRow
        role="row"
        $isReassignTarget={isReassignTarget}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        {/* Employee label — sticky left */}
        <S.StyledEmployeeLabel
          $rowHeight={config.rowHeight}
          $labelWidth={config.labelWidth}
          role="rowheader"
        >
          {config.showAvatar && <Avatar name={employee.name} src={employee.avatarSrc} size="sm" />}
          <S.StyledEmployeeInfo>
            <S.StyledEmployeeName>{employee.name}</S.StyledEmployeeName>
            {config.showRole && employee.role && (
              <S.StyledEmployeeRole>{employee.role}</S.StyledEmployeeRole>
            )}
          </S.StyledEmployeeInfo>
        </S.StyledEmployeeLabel>

        {/* Shift area — overflow: hidden (key bug fix) */}
        <S.StyledShiftArea $rowHeight={config.rowHeight} $gridWidth={gridWidth} role="gridcell">
          {/* Grid lines — sole renderer, no bg on StyledShiftArea */}
          <S.StyledGridLine $slotWidth={slotWidth} aria-hidden="true" />

          {/* Shift blocks */}
          {shifts.map((shift) => {
            const { left, width, visible } = computeShiftPosition(shift, visibleRange, slotWidth);
            if (!visible) return null;

            const isTiny = width < TINY_THRESHOLD_PX;
            const isSelected = selectedShiftId === shift.id;
            const isDragging = draggingId === shift.id;
            const label = shift.label ?? employee.name;
            // Read-only (recurrente): non-draggable + non-resizable + lock cue.
            // The accessible name gets the read-only hint (non-colour SR cue).
            const readOnly = isShiftReadOnly(shift);
            const baseAriaLabel = `${label}: ${formatTimeRange(shift.startTime, shift.endTime)}`;

            return (
              <S.StyledShiftBlock
                key={shift.id}
                $left={`${left}px`}
                $width={`${width}px`}
                $color={shift.color ?? 'primary'}
                $isSelected={isSelected}
                $isDragging={isDragging}
                $isTiny={isTiny}
                $readOnly={readOnly}
                aria-label={readOnly ? `${baseAriaLabel} ${readOnlyHint}` : baseAriaLabel}
                aria-pressed={isSelected}
                onPointerDown={
                  readOnly
                    ? undefined
                    : (e) => {
                        if (!containerElRef.current) return;
                        // Compute cursor offset within the block for natural grab
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pointerOffsetX = e.clientX - rect.left;
                        beginDragIntent('move', shift, empIndex, e, {
                          employees: allEmployees,
                          containerEl: containerElRef.current,
                          rulerHeight,
                          labelWidth: config.labelWidth,
                          slotWidth,
                          rowHeight: config.rowHeight,
                          visibleRange,
                          pointerOffsetX,
                        });
                      }
                }
                onClick={(e) => {
                  // Only fire click if this was NOT a drag session
                  e.stopPropagation();
                  onShiftClick(shift);
                }}
              >
                {readOnly && (
                  <S.StyledShiftLockGlyph>
                    <LockIcon />
                  </S.StyledShiftLockGlyph>
                )}
                <S.StyledShiftBlockLabel $isTiny={isTiny}>{label}</S.StyledShiftBlockLabel>
                <S.StyledShiftBlockTime $isTiny={isTiny}>
                  {formatTimeRange(shift.startTime, shift.endTime)}
                </S.StyledShiftBlockTime>

                {/* Resize handle — right edge drag. Not rendered for read-only
                    shifts (recurrente cannot be resized). */}
                {!readOnly && (
                  <S.StyledResizeHandle
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (!containerElRef.current) return;
                      beginDragIntent('resize', shift, empIndex, e, {
                        employees: allEmployees,
                        containerEl: containerElRef.current,
                        rulerHeight,
                        labelWidth: config.labelWidth,
                        slotWidth,
                        rowHeight: config.rowHeight,
                        visibleRange,
                      });
                    }}
                    aria-label={t('workSchedule.resizeShiftAriaLabel')}
                  />
                )}
              </S.StyledShiftBlock>
            );
          })}

          {/*
          "Add shift" button — conditionally rendered (NOT CSS display: none).
          Only mounts when the row is hovered AND has no shifts.
          This avoids layout reflows caused by display:none→flex toggling.
        */}
          {!hasShifts && isHovered && (
            <S.StyledAddShiftBtn
              type="button"
              onClick={handleAddClick}
              aria-label={t('workSchedule.addShiftForAriaLabel', { name: employee.name })}
            >
              <PlusIcon />
              {t('workSchedule.addShiftShort')}
            </S.StyledAddShiftBtn>
          )}
        </S.StyledShiftArea>
      </S.StyledEmployeeRow>
    );
  },
);
EmployeeRow.displayName = 'EmployeeRow';

// ─── Day View ─────────────────────────────────────────────────────────────────

interface DayViewProps {
  date: Date;
  employees: Employee[];
  shiftIndex: Map<string, Shift[]>;
  visibleRange: VisibleHourRange;
  slotWidth: number;
  density: ScheduleDensity;
  selectedShiftId: string | null;
  readOnlyHint: string;
  onShiftClick: (shift: Shift) => void;
  onAddShift: (draft: ShiftDraft) => void;
  onCommit: (proposed: Shift, origin: Shift) => void;
  isShiftReadOnly: (shift: Shift) => boolean;
}

const DayView: React.FC<DayViewProps> = React.memo(
  ({
    date,
    employees,
    shiftIndex,
    visibleRange,
    slotWidth,
    density,
    selectedShiftId,
    readOnlyHint,
    onShiftClick,
    onAddShift,
    onCommit,
    isShiftReadOnly,
  }) => {
    const { t } = useTranslation('terapeutas');
    const dateKey = toDateKey(date);
    const config = DENSITY_CONFIG[density];

    const visibleHours = useMemo(() => getVisibleHours(visibleRange), [visibleRange]);
    const gridWidth = useMemo(
      () => getGridWidth(visibleRange, slotWidth),
      [visibleRange, slotWidth],
    );
    const minWidth = config.labelWidth + gridWidth;

    // Reference to the scrollable container — needed by useDayDnD for coordinate math
    const containerElRef = useRef<HTMLDivElement>(null);
    // Height of the sticky ruler row — measured after first render
    const rulerRef = useRef<HTMLDivElement>(null);
    const [rulerHeight, setRulerHeight] = useState(40);

    useEffect(() => {
      if (rulerRef.current) setRulerHeight(rulerRef.current.offsetHeight);
    }, []);

    const { draggingId, dragPreview, beginDragIntent } = useDayDnD(onCommit);

    // Row index currently receiving a cross-row reassignment drag (for the
    // target-row wash). null unless the ghost is over a DIFFERENT row than the
    // dragged shift's origin. Passed as a per-row boolean so only the affected
    // rows re-render (preserves the memoized-row 60fps chain).
    const reassignTargetIndex =
      dragPreview?.isReassignment === true ? dragPreview.previewEmployeeIndex : null;

    if (employees.length === 0) {
      return (
        <S.StyledDayEmptyState>
          <Typography variant="body" color="disabled">
            {t('workSchedule.noEmployees')}
          </Typography>
        </S.StyledDayEmptyState>
      );
    }

    return (
      <S.StyledDayWrapper
        ref={containerElRef}
        role="grid"
        // Keyboard-reachable horizontal-scroll region (WCAG 2.1.1): focusable so
        // arrow keys can pan the Day grid when it overflows its column. NOT
        // autofocused — focus only lands here on an explicit Tab from the user,
        // preserving the panel's focus-on-tab contract (no unexpected focus move).
        tabIndex={0}
        aria-label={t('workSchedule.dailyScheduleAriaLabel')}
      >
        <S.StyledDayInner $minWidth={minWidth}>
          {/* ── Sticky time ruler ── */}
          <S.StyledTimeRulerRow ref={rulerRef} role="row">
            <S.StyledCornerCell $labelWidth={config.labelWidth} aria-hidden="true">
              <Typography variant="caption2" color="tertiary">
                {t('workSchedule.employeesColumn')}
              </Typography>
            </S.StyledCornerCell>
            <S.StyledTimeRuler $gridWidth={gridWidth} aria-hidden="true">
              {visibleHours.map((hour) => (
                <S.StyledHourTick key={hour} $slotWidth={slotWidth}>
                  <S.StyledHourTickLabel>{formatHourLabel(hour)}</S.StyledHourTickLabel>
                </S.StyledHourTick>
              ))}
            </S.StyledTimeRuler>
          </S.StyledTimeRulerRow>

          {/* ── Employee rows ── */}
          <S.StyledEmployeeListBody>
            {employees.map((emp, idx) => {
              const empShifts = getShiftsForEmployee(emp.id, dateKey, shiftIndex);
              return (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  empIndex={idx}
                  shifts={empShifts}
                  density={density}
                  dateKey={dateKey}
                  visibleRange={visibleRange}
                  slotWidth={slotWidth}
                  gridWidth={gridWidth}
                  selectedShiftId={selectedShiftId}
                  draggingId={draggingId}
                  isReassignTarget={reassignTargetIndex === idx}
                  containerElRef={containerElRef}
                  rulerHeight={rulerHeight}
                  allEmployees={employees}
                  readOnlyHint={readOnlyHint}
                  onShiftClick={onShiftClick}
                  onAddShift={onAddShift}
                  isShiftReadOnly={isShiftReadOnly}
                  beginDragIntent={beginDragIntent}
                />
              );
            })}
          </S.StyledEmployeeListBody>

          {/* ── Drag ghost (snapped to grid, inside scroll container) ── */}
          {dragPreview && (
            <S.StyledDragGhost
              $left={dragPreview.left}
              $top={dragPreview.top}
              $width={dragPreview.width}
              $height={dragPreview.height}
              $color={dragPreview.color}
              aria-hidden="true"
            >
              <S.StyledDragGhostLabel>{dragPreview.employeeName}</S.StyledDragGhostLabel>
              <S.StyledDragGhostTime>
                {formatTimeRange(dragPreview.previewStartTime, dragPreview.previewEndTime)}
              </S.StyledDragGhostTime>
              {/* Cross-row reassignment: name the new therapist (non-colour cue). */}
              {dragPreview.isReassignment && (
                <S.StyledDragGhostReassignChip>
                  → {dragPreview.employeeName}
                </S.StyledDragGhostReassignChip>
              )}
            </S.StyledDragGhost>
          )}
        </S.StyledDayInner>
      </S.StyledDayWrapper>
    );
  },
);
DayView.displayName = 'DayView';

// ─── Detail Panel ─────────────────────────────────────────────────────────────

const DetailPanel: React.FC<{
  shift: Shift | null;
  employee: Employee | undefined;
  open: boolean;
  onClose: () => void;
  onEdit: (shift: Shift) => void;
}> = React.memo(({ shift, employee, open, onClose, onEdit }) => {
  const { t } = useTranslation('terapeutas');
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => {
      document.removeEventListener('keydown', h);
    };
  }, [open, onClose]);

  return (
    <>
      <S.StyledPanelOverlay $open={open} onClick={onClose} aria-hidden="true" />
      <S.StyledPanel
        $open={open}
        role="dialog"
        aria-modal="true"
        aria-label={
          shift
            ? t('workSchedule.detailPanel.shiftAriaLabel', {
                name: shift.label ?? employee?.name ?? '',
              })
            : t('workSchedule.detailPanel.shiftDetailsAriaLabel')
        }
      >
        {shift && (
          <>
            <S.StyledPanelColorBar $color={shift.color ?? 'primary'} />
            <S.StyledPanelHeader>
              <S.StyledPanelTitleGroup>
                <S.StyledPanelTitle>
                  {shift.label ?? employee?.name ?? t('workSchedule.detailPanel.shiftFallback')}
                </S.StyledPanelTitle>
                <S.StyledPanelSubtitle>{shift.date}</S.StyledPanelSubtitle>
              </S.StyledPanelTitleGroup>
              <S.StyledIconBtn onClick={onClose} aria-label={t('workSchedule.closePanelAriaLabel')}>
                <XIcon />
              </S.StyledIconBtn>
            </S.StyledPanelHeader>

            <S.StyledPanelBody>
              {employee && (
                <S.StyledPanelSection>
                  <S.StyledPanelSectionLabel>
                    {t('workSchedule.detailPanel.employee')}
                  </S.StyledPanelSectionLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={employee.name} src={employee.avatarSrc} size="sm" />
                    <div>
                      <S.StyledPanelSectionValue>{employee.name}</S.StyledPanelSectionValue>
                      {employee.role && (
                        <Typography variant="caption2" color="tertiary">
                          {employee.role}
                        </Typography>
                      )}
                    </div>
                  </div>
                </S.StyledPanelSection>
              )}
              <S.StyledPanelSection>
                <S.StyledPanelSectionLabel>
                  {t('workSchedule.detailPanel.time')}
                </S.StyledPanelSectionLabel>
                <S.StyledPanelSectionValue>
                  {formatTimeRange(shift.startTime, shift.endTime)}
                </S.StyledPanelSectionValue>
              </S.StyledPanelSection>
              <S.StyledPanelSection>
                <S.StyledPanelSectionLabel>
                  {t('workSchedule.detailPanel.duration')}
                </S.StyledPanelSectionLabel>
                <S.StyledPanelSectionValue>
                  {shiftDurationLabel(shift.startTime, shift.endTime)}
                </S.StyledPanelSectionValue>
              </S.StyledPanelSection>
              {shift.note && (
                <S.StyledPanelSection>
                  <S.StyledPanelSectionLabel>
                    {t('workSchedule.detailPanel.notes')}
                  </S.StyledPanelSectionLabel>
                  <S.StyledPanelSectionValue>{shift.note}</S.StyledPanelSectionValue>
                </S.StyledPanelSection>
              )}
            </S.StyledPanelBody>

            <S.StyledPanelFooter>
              <Button type="button" size="sm" variant="outlined" color="neutral" onClick={onClose}>
                {t('workSchedule.closeAriaLabel')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="solid"
                color="primary"
                iconStart={<EditIcon />}
                onClick={() => {
                  onEdit(shift);
                }}
                aria-label={t('workSchedule.editShiftAriaLabel')}
              >
                {t('workSchedule.editShiftAriaLabel')}
              </Button>
            </S.StyledPanelFooter>
          </>
        )}
      </S.StyledPanel>
    </>
  );
});
DetailPanel.displayName = 'DetailPanel';

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal: React.FC<{
  shift: Shift | null;
  employees: Employee[];
  open: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete: (id: string) => void;
}> = React.memo(({ shift, employees, open, onClose, onSave, onDelete }) => {
  const { t } = useTranslation('terapeutas');
  const [local, setLocal] = useState<Shift | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the incoming shift prop into a local editable copy (documented prop→state exception)
    if (shift) setLocal({ ...shift });
  }, [shift]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => {
      document.removeEventListener('keydown', h);
    };
  }, [open, onClose]);

  if (!local) return null;

  const update = <K extends keyof Shift>(key: K, value: Shift[K]) => {
    setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <S.StyledModalOverlay
      $open={open}
      role="dialog"
      aria-modal="true"
      aria-label={t('workSchedule.editShiftAriaLabel')}
    >
      <S.StyledModalCard>
        <S.StyledModalHeader>
          <S.StyledModalTitle>{t('workSchedule.editModal.title')}</S.StyledModalTitle>
          <S.StyledIconBtn onClick={onClose} aria-label={t('workSchedule.closeAriaLabel')}>
            <XIcon />
          </S.StyledIconBtn>
        </S.StyledModalHeader>

        <S.StyledModalBody>
          <S.StyledFormField>
            <S.StyledFormLabel htmlFor="edit-emp">
              {t('workSchedule.editModal.employee')}
            </S.StyledFormLabel>
            <S.StyledFormSelect
              id="edit-emp"
              value={local.employeeId}
              onChange={(e) => {
                update('employeeId', e.target.value);
              }}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </S.StyledFormSelect>
          </S.StyledFormField>

          <S.StyledFormField>
            <S.StyledFormLabel htmlFor="edit-date">
              {t('workSchedule.editModal.date')}
            </S.StyledFormLabel>
            <S.StyledFormInput
              id="edit-date"
              type="date"
              value={local.date}
              onChange={(e) => {
                update('date', e.target.value);
              }}
            />
          </S.StyledFormField>

          <S.StyledFormRow>
            <S.StyledFormField>
              <S.StyledFormLabel htmlFor="edit-start">
                {t('workSchedule.editModal.start')}
              </S.StyledFormLabel>
              <S.StyledFormInput
                id="edit-start"
                type="time"
                value={local.startTime}
                onChange={(e) => {
                  update('startTime', e.target.value);
                }}
              />
            </S.StyledFormField>
            <S.StyledFormField>
              <S.StyledFormLabel htmlFor="edit-end">
                {t('workSchedule.editModal.end')}
              </S.StyledFormLabel>
              <S.StyledFormInput
                id="edit-end"
                type="time"
                value={local.endTime}
                onChange={(e) => {
                  update('endTime', e.target.value);
                }}
              />
            </S.StyledFormField>
          </S.StyledFormRow>

          <S.StyledFormField>
            <S.StyledFormLabel htmlFor="edit-label">
              {t('workSchedule.editModal.label')}
            </S.StyledFormLabel>
            <S.StyledFormInput
              id="edit-label"
              type="text"
              placeholder={t('workSchedule.editModal.labelPlaceholder')}
              value={local.label ?? ''}
              onChange={(e) => {
                update('label', e.target.value || undefined);
              }}
            />
          </S.StyledFormField>

          <S.StyledFormField>
            <S.StyledFormLabel htmlFor="edit-color">
              {t('workSchedule.editModal.color')}
            </S.StyledFormLabel>
            <S.StyledFormSelect
              id="edit-color"
              value={local.color ?? 'primary'}
              onChange={(e) => {
                update('color', e.target.value as ShiftColor);
              }}
            >
              <option value="primary">{t('workSchedule.editModal.colorPrimary')}</option>
              <option value="secondary">{t('workSchedule.editModal.colorSecondary')}</option>
              <option value="success">{t('workSchedule.editModal.colorSuccess')}</option>
              <option value="warning">{t('workSchedule.editModal.colorWarning')}</option>
              <option value="error">{t('workSchedule.editModal.colorError')}</option>
            </S.StyledFormSelect>
          </S.StyledFormField>

          <S.StyledFormField>
            <S.StyledFormLabel htmlFor="edit-note">
              {t('workSchedule.editModal.notes')}
            </S.StyledFormLabel>
            <S.StyledFormTextarea
              id="edit-note"
              placeholder={t('workSchedule.editModal.notesPlaceholder')}
              value={local.note ?? ''}
              onChange={(e) => {
                update('note', e.target.value || undefined);
              }}
            />
          </S.StyledFormField>
        </S.StyledModalBody>

        <S.StyledModalFooter>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            color="error"
            onClick={() => {
              onDelete(local.id);
            }}
          >
            {t('workSchedule.editModal.delete')}
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="button" size="sm" variant="outlined" color="neutral" onClick={onClose}>
              {t('workSchedule.editModal.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="solid"
              color="primary"
              onClick={() => {
                onSave(local);
              }}
            >
              {t('workSchedule.editModal.save')}
            </Button>
          </div>
        </S.StyledModalFooter>
      </S.StyledModalCard>
    </S.StyledModalOverlay>
  );
});
EditModal.displayName = 'EditModal';

// ─── Create Modal ─────────────────────────────────────────────────────────────

// Day-of-week values follow the DB convention (1=Monday … 7=Sunday).
// Labels are resolved at render time via t('workSchedule.weekdays.<n>') so they
// react to language switches — never hardcode them at module load.
const DIA_SEMANA_VALUES: readonly number[] = [1, 2, 3, 4, 5, 6, 7];

const CreateModal: React.FC<{
  draft: ShiftDraft | null;
  employees: Employee[];
  open: boolean;
  onClose: () => void;
  onCreate: (draft: ShiftDraft) => void;
}> = React.memo(({ draft, employees, open, onClose, onCreate }) => {
  const { t } = useTranslation('terapeutas');
  const [local, setLocal] = useState<ShiftDraft | null>(null);

  useEffect(() => {
    if (!draft) return;
    const normalized: ShiftDraft = {
      ...draft,
      tipo: draft.tipo ?? 'especifico',
      diaSemana: draft.diaSemana ?? 1,
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the incoming draft prop into a local editable copy (documented prop→state exception)
    setLocal(normalized);
  }, [draft]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => {
      document.removeEventListener('keydown', h);
    };
  }, [open, onClose]);

  if (!local) return null;

  const update = <K extends keyof ShiftDraft>(key: K, value: ShiftDraft[K]) => {
    setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const activeTipo: ShiftDraftTipo = local.tipo ?? 'especifico';

  return (
    <S.StyledModalOverlay
      $open={open}
      role="dialog"
      aria-modal="true"
      aria-label={t('workSchedule.addShiftAriaLabel')}
    >
      <S.StyledModalCard>
        <S.StyledModalHeader>
          <S.StyledModalTitle>{t('workSchedule.addShiftTitle')}</S.StyledModalTitle>
          <S.StyledIconBtn onClick={onClose} aria-label={t('workSchedule.closeAriaLabel')}>
            <XIcon />
          </S.StyledIconBtn>
        </S.StyledModalHeader>

        <S.StyledModalBody>
          {/* ── Terapeuta ── */}
          <S.StyledFormField>
            <S.StyledFormLabel htmlFor="create-emp">
              {t('workSchedule.terapeutaLabel')}
            </S.StyledFormLabel>
            <S.StyledFormSelect
              id="create-emp"
              value={local.employeeId}
              onChange={(e) => {
                update('employeeId', e.target.value);
              }}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </S.StyledFormSelect>
          </S.StyledFormField>

          {/* ── Tipo de horario (radio) ── */}
          <S.StyledFormField>
            <S.StyledFormLabel as="span">{t('workSchedule.tipoHorarioLabel')}</S.StyledFormLabel>
            <S.StyledTipoRadioGroup
              role="radiogroup"
              aria-label={t('workSchedule.tipoHorarioAriaLabel')}
            >
              {(['especifico', 'recurrente'] as const).map((tipoValue) => (
                <S.StyledTipoRadioLabel key={tipoValue}>
                  <input
                    type="radio"
                    name="tipo-horario"
                    value={tipoValue}
                    checked={activeTipo === tipoValue}
                    onChange={() => {
                      update('tipo', tipoValue);
                    }}
                  />
                  {tipoValue === 'especifico'
                    ? t('workSchedule.tipoEspecifico')
                    : t('workSchedule.tipoRecurrente')}
                </S.StyledTipoRadioLabel>
              ))}
            </S.StyledTipoRadioGroup>
          </S.StyledFormField>

          {/* ── Fecha (especifico) / Día de semana (recurrente) ── */}
          {activeTipo === 'especifico' ? (
            <S.StyledFormField>
              <S.StyledFormLabel htmlFor="create-date">
                {t('workSchedule.fechaLabel')}
              </S.StyledFormLabel>
              <S.StyledFormInput
                id="create-date"
                type="date"
                value={local.date}
                onChange={(e) => {
                  update('date', e.target.value);
                }}
              />
            </S.StyledFormField>
          ) : (
            <S.StyledFormField>
              <S.StyledFormLabel htmlFor="create-dia">
                {t('workSchedule.diaSemanaLabel')}
              </S.StyledFormLabel>
              <S.StyledFormSelect
                id="create-dia"
                value={local.diaSemana ?? 1}
                onChange={(e) => {
                  update('diaSemana', Number(e.target.value));
                }}
              >
                {DIA_SEMANA_VALUES.map((d) => (
                  <option key={d} value={d}>
                    {t(`workSchedule.weekdays.${d}`)}
                  </option>
                ))}
              </S.StyledFormSelect>
            </S.StyledFormField>
          )}

          {/* ── Horas ── */}
          <S.StyledFormRow>
            <S.StyledFormField>
              <S.StyledFormLabel htmlFor="create-start">
                {t('workSchedule.horaInicioLabel')}
              </S.StyledFormLabel>
              <S.StyledFormInput
                id="create-start"
                type="time"
                value={local.startTime}
                onChange={(e) => {
                  update('startTime', e.target.value);
                }}
              />
            </S.StyledFormField>
            <S.StyledFormField>
              <S.StyledFormLabel htmlFor="create-end">
                {t('workSchedule.horaFinLabel')}
              </S.StyledFormLabel>
              <S.StyledFormInput
                id="create-end"
                type="time"
                value={local.endTime}
                onChange={(e) => {
                  update('endTime', e.target.value);
                }}
              />
            </S.StyledFormField>
          </S.StyledFormRow>
        </S.StyledModalBody>

        <S.StyledModalFooter>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="button" size="sm" variant="outlined" color="neutral" onClick={onClose}>
              {t('workSchedule.cancelar')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="solid"
              color="primary"
              iconStart={<PlusIcon />}
              onClick={() => {
                onCreate(local);
              }}
            >
              {t('workSchedule.añadir')}
            </Button>
          </div>
        </S.StyledModalFooter>
      </S.StyledModalCard>
    </S.StyledModalOverlay>
  );
});
CreateModal.displayName = 'CreateModal';

// ─── Reschedule confirm Dialog body ───────────────────────────────────────────

// Dialog title key by change shape (Designer §4.4).
const rescheduleDialogTitleKey = (shape: TRescheduleShape): string => {
  switch (shape) {
    case 'time':
      return 'workSchedule.confirmReschedule.titleTime';
    case 'employee':
      return 'workSchedule.confirmReschedule.titleEmployee';
    case 'both':
      return 'workSchedule.confirmReschedule.titleBoth';
  }
};

// "YYYY-MM-DD" → locale-formatted day (e.g. "jue 12 jun"). Local-date safe:
// builds a Date at local midnight to avoid the UTC off-by-one.
const formatShiftDate = (date: string, locale: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/**
 * Composed Dialog body for a drag reschedule — three shapes (time / employee /
 * both, Designer §2). Context line on top, then an emphasised FROM/TO pair. The
 * reassignment badge carries text (non-colour cue) for the employee/both shapes.
 */
const RescheduleSummary: React.FC<{
  pending: PendingReschedule;
  locale: string;
  employeeNameById: (id: string) => string;
}> = ({ pending, locale, employeeNameById }) => {
  const { t } = useTranslation('terapeutas');
  const { origin, proposed, shape } = pending;

  const fromTime = t('workSchedule.confirmReschedule.timeValue', {
    horaInicio: origin.startTime,
    horaFin: origin.endTime,
  });
  const toTime = t('workSchedule.confirmReschedule.timeValue', {
    horaInicio: proposed.startTime,
    horaFin: proposed.endTime,
  });
  const fromEmployee = employeeNameById(origin.employeeId);
  const toEmployee = employeeNameById(proposed.employeeId);
  const proposedDate = formatShiftDate(proposed.date, locale);

  // Context line: time-only → "{therapist} · {date}"; employee/both → keep the
  // shared day (+ time for employee-only where time is unchanged).
  const context =
    shape === 'time'
      ? t('workSchedule.confirmReschedule.contextDay', {
          therapist: fromEmployee,
          fecha: proposedDate,
        })
      : shape === 'employee'
        ? t('workSchedule.confirmReschedule.contextDayTime', {
            fecha: proposedDate,
            horaInicio: proposed.startTime,
            horaFin: proposed.endTime,
          })
        : t('workSchedule.confirmReschedule.contextDateOnly', { fecha: proposedDate });

  // FROM/TO values by shape.
  const fromValue =
    shape === 'time'
      ? fromTime
      : shape === 'employee'
        ? fromEmployee
        : t('workSchedule.confirmReschedule.employeeAndTimeValue', {
            therapist: fromEmployee,
            horaInicio: origin.startTime,
            horaFin: origin.endTime,
          });
  const toValue =
    shape === 'time'
      ? toTime
      : shape === 'employee'
        ? toEmployee
        : t('workSchedule.confirmReschedule.employeeAndTimeValue', {
            therapist: toEmployee,
            horaInicio: proposed.startTime,
            horaFin: proposed.endTime,
          });

  return (
    <S.StyledShiftRescheduleSummary>
      <S.StyledRescheduleContext>{context}</S.StyledRescheduleContext>
      <S.StyledRescheduleChange>
        <S.StyledRescheduleRow>
          <S.StyledRescheduleLabel>
            {t('workSchedule.confirmReschedule.fromLabel')}
          </S.StyledRescheduleLabel>
          <S.StyledRescheduleFromValue>{fromValue}</S.StyledRescheduleFromValue>
        </S.StyledRescheduleRow>
        <S.StyledRescheduleRow>
          <S.StyledRescheduleLabel>
            {t('workSchedule.confirmReschedule.toLabel')}
          </S.StyledRescheduleLabel>
          <S.StyledRescheduleToValue>{toValue}</S.StyledRescheduleToValue>
          {shape !== 'time' && (
            <S.StyledReassignBadge>
              {t('workSchedule.confirmReschedule.reassignBadge')}
            </S.StyledReassignBadge>
          )}
        </S.StyledRescheduleRow>
      </S.StyledRescheduleChange>
    </S.StyledShiftRescheduleSummary>
  );
};
RescheduleSummary.displayName = 'RescheduleSummary';

// ─── WorkScheduleCalendar ─────────────────────────────────────────────────────

const NO_OP_READ_ONLY = (): boolean => false;

export const WorkScheduleCalendar: React.FC<WorkScheduleCalendarProps> = ({
  employees,
  shifts: shiftsProp = [],
  initialDate,
  initialView = 'week',
  visibleRange = DEFAULT_VISIBLE_RANGE,
  slotWidth = DEFAULT_SLOT_WIDTH,
  density = DEFAULT_DENSITY,
  onShiftClick,
  onShiftCreate,
  onShiftUpdate,
  onShiftDelete,
  onShiftReschedule,
  isShiftReadOnly = NO_OP_READ_ONLY,
  rescheduleSubmitting = false,
  onVisibleRangeChange,
  locale = 'en',
  className,
}) => {
  const { t } = useTranslation('terapeutas');
  const init = useMemo(() => initialDate ?? new Date(), [initialDate]);

  const {
    currentView,
    setView,
    selectedDate,
    today,
    weekDays,
    goToDay,
    goToPrev,
    goToNext,
    goToToday,
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
  } = useWorkScheduleCalendar(
    shiftsProp,
    init,
    initialView,
    employees,
    onShiftCreate,
    onShiftUpdate,
    onShiftDelete,
    onVisibleRangeChange,
  );

  // ── Drag-reschedule confirmation (calendar-internal) ───────────────────────
  // Pessimistic commit: a drop captures the proposed+origin shift here and opens
  // a confirm Dialog; the optimistic move is DEFERRED to Confirm (so the card
  // never jumps before the user agrees). When `onShiftReschedule` is not wired,
  // a drop persists immediately as before (backwards compatible).
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null);
  // Polite live-region text (proposed change / success / revert). Designer §5.
  const [rescheduleAnnouncement, setRescheduleAnnouncement] = useState('');

  const employeeNameById = useCallback(
    (id: string): string => employees.find((e) => e.id === id)?.name ?? '',
    [employees],
  );

  // Commit channel fed by BOTH Day and Week DnD (see useDayDnD/useWeekDnD). The
  // hooks call this on a changed drop; we gate persistence behind the Dialog.
  //
  // FOLLOW-UP (Analyst OQ-B12 / Designer §5): pointer/HTML5 drag is the v1
  // affordance. The equivalent keyboard path for moving a shift is the
  // EditModal (Tab → shift → Enter → DetailPanel → Editar → date/time/employee
  // → Save), so WCAG 2.1.1 is met without a keyboard-drag. A native keyboard
  // drag (arrow-key nudge) is a deliberately deferred enhancement.
  const requestReschedule = useCallback(
    (proposed: Shift, origin: Shift) => {
      // No reschedule channel → legacy immediate-apply (optimistic + persist).
      if (!onShiftReschedule) {
        updateShift(proposed);
        return;
      }
      const timeChanged =
        proposed.startTime !== origin.startTime ||
        proposed.endTime !== origin.endTime ||
        proposed.date !== origin.date;
      const employeeChanged = proposed.employeeId !== origin.employeeId;
      // Defensive: a no-net-change drop never reaches here (the hooks' `changed`
      // guard short-circuits), but guard anyway so the Dialog stays meaningful.
      if (!timeChanged && !employeeChanged) return;
      const shape: TRescheduleShape = employeeChanged
        ? timeChanged
          ? 'both'
          : 'employee'
        : 'time';

      setPendingReschedule({ origin, proposed, shape });

      // Announce the proposed change (polite). Copy varies by shape.
      const toEmployee = employeeNameById(proposed.employeeId);
      const announcement =
        shape === 'time'
          ? t('workSchedule.a11y.rescheduleProposedTime', {
              horaInicio: proposed.startTime,
              horaFin: proposed.endTime,
            })
          : shape === 'employee'
            ? t('workSchedule.a11y.rescheduleProposedEmployee', { therapist: toEmployee })
            : t('workSchedule.a11y.rescheduleProposedBoth', {
                therapist: toEmployee,
                horaInicio: proposed.startTime,
                horaFin: proposed.endTime,
              });
      setRescheduleAnnouncement(announcement);
    },
    [onShiftReschedule, updateShift, employeeNameById, t],
  );

  const handleConfirmReschedule = useCallback(() => {
    if (!pendingReschedule || !onShiftReschedule) return;
    const { proposed } = pendingReschedule;
    // Ask the consumer to commit. It validates (range/overlap against the target
    // therapist) and either dispatches the mutation (accepted) or rejects with a
    // Toast (overlap/invalid). `void`/undefined return is treated as accepted.
    const accepted = onShiftReschedule(proposed);
    if (accepted === false) {
      // Rejected by validation — the consumer already surfaced the reason
      // (Toast). Keep the card at its origin (no optimistic apply) and close the
      // Dialog without a false success announcement.
      setPendingReschedule(null);
      setRescheduleAnnouncement('');
      return;
    }
    // Accepted → optimistic move now (deferred from the drop) + announce success.
    // The mutation runs in the consumer; its invalidation reconciles to server
    // truth (and on a server error the reducer RESET path snaps the card back —
    // see useWorkScheduleCalendar). Closing here is consistent with the existing
    // EditModal save path (which never observed the async outcome either).
    applyShiftLocal(proposed);
    setRescheduleAnnouncement(t('workSchedule.a11y.rescheduledAnnounce'));
    setPendingReschedule(null);
  }, [pendingReschedule, onShiftReschedule, applyShiftLocal, t]);

  const handleCancelReschedule = useCallback(() => {
    // Pessimistic: the card never moved, so there is nothing to revert.
    setPendingReschedule(null);
    setRescheduleAnnouncement(t('workSchedule.a11y.rescheduleCancelledAnnounce'));
  }, [t]);

  // Close-on-vanish (E-B10): if a refetch removed the shift being rescheduled
  // (deleted elsewhere) while the Dialog is open, discard the pending change so
  // the Dialog never confirms against a row that no longer exists. Compared by
  // id against the canonical server list (shiftsProp), not the optimistic state.
  useEffect(() => {
    if (!pendingReschedule) return;
    const stillExists = shiftsProp.some((s) => s.id === pendingReschedule.origin.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconcile internal Dialog state to an external change (server list lost the dragged row); closing on vanish is a sync-to-external-system, not a render cascade
    if (!stillExists) setPendingReschedule(null);
  }, [shiftsProp, pendingReschedule]);

  const headerTitle = useMemo(
    () => getHeaderTitle(currentView, selectedDate, weekDays, locale),
    [currentView, selectedDate, weekDays, locale],
  );

  const handleShiftClick = useCallback(
    (shift: Shift) => {
      openPanel(shift);
      onShiftClick?.(shift);
    },
    [openPanel, onShiftClick],
  );

  const selectedEmployee = useMemo(
    () => (selectedShift ? employees.find((e) => e.id === selectedShift.employeeId) : undefined),
    [selectedShift, employees],
  );

  const readOnlyHint = t('workSchedule.a11y.readOnlyHint');

  const prevLabel =
    currentView === 'day'
      ? t('workSchedule.prevDay')
      : currentView === 'week'
        ? t('workSchedule.prevWeek')
        : t('workSchedule.prevMonth');
  const nextLabel =
    currentView === 'day'
      ? t('workSchedule.nextDay')
      : currentView === 'week'
        ? t('workSchedule.nextWeek')
        : t('workSchedule.nextMonth');

  return (
    <S.StyledWSCRoot className={className}>
      {/* ── Toolbar ── */}
      <S.StyledWSCHeader>
        <S.StyledWSCHeaderLeft>
          <Button
            size="xs"
            variant="outlined"
            color="neutral"
            type="button"
            onClick={goToPrev}
            aria-label={prevLabel}
            iconStart={<ChevLeft />}
            iconOnly
          />
          <Button
            size="xs"
            variant="outlined"
            color="neutral"
            type="button"
            onClick={goToNext}
            aria-label={nextLabel}
            iconStart={<ChevRight />}
            iconOnly
          />
        </S.StyledWSCHeaderLeft>

        <S.StyledWSCHeaderCenter>
          <Typography variant="body" aria-live="polite" aria-atomic="true">
            {headerTitle}
          </Typography>
        </S.StyledWSCHeaderCenter>

        <S.StyledWSCHeaderRight>
          <Button
            size="xs"
            type="button"
            onClick={goToToday}
            aria-label={t('workSchedule.goToTodayAriaLabel')}
          >
            {t('workSchedule.today')}
          </Button>
          <ViewSwitcher current={currentView} onChange={setView} />
        </S.StyledWSCHeaderRight>
      </S.StyledWSCHeader>

      {/* ── Views ── */}
      {currentView === 'month' && (
        <MonthView
          selectedDate={selectedDate}
          today={today}
          employees={employees}
          dateEmployeeIndex={dateEmployeeIndex}
          onDayClick={goToDay}
          locale={locale}
        />
      )}

      {currentView === 'week' && (
        <WeekView
          weekDays={weekDays}
          today={today}
          selectedDate={selectedDate}
          employees={employees}
          shiftIndex={shiftIndex}
          dateEmployeeIndex={dateEmployeeIndex}
          readOnlyHint={readOnlyHint}
          onDayClick={goToDay}
          onShiftClick={handleShiftClick}
          onCommit={requestReschedule}
          isShiftReadOnly={isShiftReadOnly}
          locale={locale}
        />
      )}

      {currentView === 'day' && (
        <DayView
          date={selectedDate}
          employees={employees}
          shiftIndex={shiftIndex}
          visibleRange={visibleRange}
          slotWidth={slotWidth}
          density={density}
          selectedShiftId={selectedShift?.id ?? null}
          readOnlyHint={readOnlyHint}
          onShiftClick={handleShiftClick}
          onAddShift={openCreateModal}
          onCommit={requestReschedule}
          isShiftReadOnly={isShiftReadOnly}
        />
      )}

      {/* ── Overlays ── */}
      <DetailPanel
        shift={selectedShift}
        employee={selectedEmployee}
        open={panelOpen}
        onClose={closePanel}
        onEdit={(shift) => {
          closePanel();
          openEditModal(shift);
        }}
      />

      <EditModal
        shift={editingShift}
        employees={employees}
        open={editModalOpen}
        onClose={closeEditModal}
        onSave={updateShift}
        onDelete={deleteShift}
      />

      <CreateModal
        draft={draftShift}
        employees={employees}
        open={createModalOpen}
        onClose={closeCreateModal}
        onCreate={createShift}
      />

      {/* Polite live region: proposed change on Dialog open, success on confirm,
          revert on cancel. Kept out of the visible header so the calendar title
          stays put (Designer §5). */}
      <S.StyledRescheduleLiveRegion role="status" aria-live="polite" aria-atomic="true">
        {rescheduleAnnouncement}
      </S.StyledRescheduleLiveRegion>

      {/* Drag-reschedule confirmation. Reuses the common Dialog (no layering
          violation) — the calendar's bespoke DetailPanel/EditModal stay as-is.
          The Modal primitive owns focus-trap, Escape, backdrop, and focus-return
          to the element focused before opening (the dragged shift block). */}
      <Dialog
        open={pendingReschedule !== null}
        onClose={handleCancelReschedule}
        type="confirm"
        title={
          pendingReschedule
            ? t(rescheduleDialogTitleKey(pendingReschedule.shape))
            : t('workSchedule.confirmReschedule.titleTime')
        }
        message={
          pendingReschedule ? (
            <RescheduleSummary
              pending={pendingReschedule}
              locale={locale}
              employeeNameById={employeeNameById}
            />
          ) : (
            ''
          )
        }
        confirmText={t('workSchedule.confirmReschedule.confirm')}
        cancelText={t('workSchedule.confirmReschedule.cancel')}
        loading={rescheduleSubmitting}
        onConfirm={handleConfirmReschedule}
        onCancel={handleCancelReschedule}
      />
    </S.StyledWSCRoot>
  );
};
