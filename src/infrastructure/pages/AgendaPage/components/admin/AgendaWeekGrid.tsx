import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  IAgendaWeekDay,
  IAgendaAppointment,
  TTherapistColorMap,
  IAgendaTherapist,
} from '@domain/models/agenda.models';
import type { TAgendaTherapistColor, TCitaId, TEstadoCita } from '@domain/types';
import { isTerminalEstado } from '@domain/index';
import { AgendaCitaDetailPopover } from './AgendaCitaDetailPopover';
import { AgendaCitaClusterPopover } from './AgendaCitaClusterPopover';
import {
  StyledWeekCal,
  StyledWeekScrollArea,
  StyledWeekHead,
  StyledWeekCorner,
  StyledWeekDayCol,
  StyledWeekDayLabel,
  StyledWeekDayNumber,
  StyledWeekDayCount,
  StyledWeekBody,
  StyledWeekHourCol,
  StyledWeekHourLbl,
  StyledWeekTrack,
  StyledWeekTrackInner,
  StyledWeekNowLine,
  StyledWeekEvt,
  StyledWeekEvtTime,
  StyledWeekEvtClient,
  StyledWeekEvtService,
  StyledWeekEvtLock,
  StyledWeekCluster,
  StyledWeekClusterStackEdge,
  StyledWeekClusterGlyph,
  StyledWeekClusterCount,
  StyledWeekClusterLabel,
  StyledWeekLegend,
  StyledWeekLegendItem,
  StyledWeekGhost,
  StyledWeekGhostGlyph,
  StyledWeekGhostChip,
} from './AgendaWeekGrid.styles';
import {
  AGENDA_SLOT_HEIGHT_PX,
  AGENDA_DAY_START_HOUR,
  AGENDA_DAY_END_HOUR,
  AGENDA_TOTAL_SLOTS,
} from '../../agenda.constants';
import {
  timeToTopOffset,
  durationToHeight,
  formatHoraLabel,
  topOffsetToTime,
} from '@infra/utils/agenda.utils';
import {
  clusterDayAppointments,
  type TAgendaDaySlot,
  type IAgendaClusterSlot,
} from '@infra/utils/agenda.cluster';
import { useWeekCitaDnD, type IWeekRescheduleDrop } from './useWeekCitaDnD';

interface IAgendaWeekGridProps {
  readonly weekDays: readonly IAgendaWeekDay[];
  readonly colorMap: TTherapistColorMap;
  readonly therapists: readonly IAgendaTherapist[];
  /** Cita whose detail popover is open (selection ring). */
  readonly selectedId: TCitaId | null;
  /** Cluster whose list popup is open (`dateStr#earliestStartMin`), or null. */
  readonly openClusterKey: string | null;
  /** Cita being optimistically mutated (dimmed). */
  readonly optimisticId: TCitaId | null;
  /** True if the current user may mutate citas (superadmin/recepcionista). */
  readonly canManage: boolean;
  /** A mutation is in flight → disable popover actions. */
  readonly actionPending: boolean;
  /**
   * A reschedule is pending confirmation or its mutation is in flight. While
   * true no new drag may begin (Analyst E-A7) — singleton blocks render
   * `not-allowed` and ignore pointerdown.
   */
  readonly rescheduleBusy: boolean;
  readonly centroName?: string;
  readonly onActivate: (id: TCitaId) => void;
  readonly onDetailOpenChange: (open: boolean) => void;
  /** Toggle a cluster's list popup open/closed by key (null = close any). */
  readonly onClusterOpenChange: (key: string | null) => void;
  readonly onConfirm: (id: TCitaId) => void;
  readonly onChangeEstado: (id: TCitaId, estado: TEstadoCita) => void;
  readonly onEdit: (id: TCitaId) => void;
  readonly onCancel: (id: TCitaId) => void;
  /** Net-change drop → parent opens the confirm Dialog (Surface A). */
  readonly onRescheduleDrop: (drop: IWeekRescheduleDrop) => void;
  /** Double-click on an empty slot → parent opens the create modal prefilled. */
  readonly onCreateAtSlot: (params: { dateStr: string; horaInicio: string }) => void;
  /** Click on a day-header column → parent switches to Day view for that date. */
  readonly onDayHeaderClick: (dateStr: string) => void;
}

const TRACK_HEIGHT = AGENDA_TOTAL_SLOTS * AGENDA_SLOT_HEIGHT_PX;
const DEFAULT_COLOR: TAgendaTherapistColor = 'a';
/** Below this folder height the mono start label is hidden (mirrors StyledWeekEvt). */
const CLUSTER_LABEL_MIN_HEIGHT = 34;
/** Below this folder height the back-card rims are suppressed (avoids a smear). */
const CLUSTER_STACK_MIN_HEIGHT = 24;

/**
 * Resolve a cluster's therapist color: homogeneous (all members share one
 * therapistId) → that color; otherwise heterogeneous. Callers only pass clusters,
 * which always have ≥2 members, so `appointments[0]` is present.
 */
function resolveClusterVariant(
  appointments: readonly IAgendaAppointment[],
  colorMap: TTherapistColorMap,
): { variant: 'homogeneous' | 'heterogeneous'; color: TAgendaTherapistColor } {
  const firstTherapist = appointments[0].therapistId;
  const allSame =
    firstTherapist !== null && appointments.every((a) => a.therapistId === firstTherapist);
  if (!allSame) {
    return { variant: 'heterogeneous', color: DEFAULT_COLOR };
  }
  const color =
    (colorMap as Record<number, TAgendaTherapistColor>)[firstTherapist] ?? DEFAULT_COLOR;
  return { variant: 'homogeneous', color };
}

/** The latest-ending member supplies the union range's end time for labels. */
function clusterRangeEnd(appointments: readonly IAgendaAppointment[]): string {
  let endTime = appointments[0].endTime;
  let maxEnd = -Infinity;
  for (const a of appointments) {
    const top = timeToTopOffset(a.startTime, AGENDA_DAY_START_HOUR, AGENDA_SLOT_HEIGHT_PX);
    const end = top + durationToHeight(a.durationMin, AGENDA_SLOT_HEIGHT_PX);
    if (end > maxEnd) {
      maxEnd = end;
      endTime = a.endTime;
    }
  }
  return endTime;
}

const AgendaWeekGridInner = ({
  weekDays,
  colorMap,
  therapists,
  selectedId,
  openClusterKey,
  optimisticId,
  canManage,
  actionPending,
  rescheduleBusy,
  centroName,
  onActivate,
  onDetailOpenChange,
  onClusterOpenChange,
  onConfirm,
  onChangeEstado,
  onEdit,
  onCancel,
  onRescheduleDrop,
  onCreateAtSlot,
  onDayHeaderClick,
}: IAgendaWeekGridProps): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const slots = Array.from({ length: AGENDA_TOTAL_SLOTS }, (_, i) => i);

  // Pointer drag & drop (Surface A). The hook never moves the real block; on a
  // net-change drop it calls onRescheduleDrop with a self-contained snapshot.
  const { draggingId, preview, dropTargetDateStr, registerTrack, beginDrag } = useWeekCitaDnD({
    weekDays,
    onDrop: onRescheduleDrop,
  });

  const now = new Date();
  const nowMinutes = (now.getHours() - AGENDA_DAY_START_HOUR) * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 30) * AGENDA_SLOT_HEIGHT_PX;
  const isNowInRange = nowMinutes >= 0 && nowMinutes <= AGENDA_TOTAL_SLOTS * 30;

  // Derive end date — last available day in the range
  const weekEndDateStr = weekDays.at(-1)?.dateStr ?? '';

  // Per-column grouping (singleton | cluster). Memoized so it doesn't recompute
  // when unrelated state flips (selection/optimisticId) — the React Compiler is
  // NOT enabled, so this memoization is functional (project_react_compiler_not_active).
  const daySlots = useMemo<readonly { day: IAgendaWeekDay; slots: readonly TAgendaDaySlot[] }[]>(
    () =>
      weekDays.map((day) => ({
        day,
        slots: clusterDayAppointments(day.appointments, day.dateStr, AGENDA_DAY_START_HOUR),
      })),
    [weekDays],
  );

  // Stable folder toggle (D10/E8): re-activating the open folder closes it.
  const handleClusterActivate = useCallback(
    (key: string) => {
      onClusterOpenChange(openClusterKey === key ? null : key);
    },
    [onClusterOpenChange, openClusterKey],
  );

  return (
    <StyledWeekCal
      aria-label={t('week.title', {
        start: weekDays[0]?.dateStr ?? '',
        end: weekEndDateStr,
      })}
    >
      {/* Header + body share one horizontal-scroll ancestor (mobile) so the
          day-header row and the appointment columns scroll in lock-step. */}
      <StyledWeekScrollArea>
        <StyledWeekHead>
          <StyledWeekCorner />
          {weekDays.map((day) => (
            <StyledWeekDayCol
              key={day.dateStr}
              $isToday={day.isToday}
              role="button"
              tabIndex={0}
              aria-label={t('week.viewDayAriaLabel', { day: `${day.label} ${day.dateNumber}` })}
              onClick={() => {
                onDayHeaderClick(day.dateStr);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDayHeaderClick(day.dateStr);
                }
              }}
            >
              <StyledWeekDayLabel>{day.label}</StyledWeekDayLabel>
              <StyledWeekDayNumber $isToday={day.isToday}>{day.dateNumber}</StyledWeekDayNumber>
              <StyledWeekDayCount>
                {day.citaCount > 0 ? t('week.dayCitaCount', { count: day.citaCount }) : ' '}
              </StyledWeekDayCount>
            </StyledWeekDayCol>
          ))}
        </StyledWeekHead>

        {/* Body */}
        <StyledWeekBody>
          {/* Hour labels */}
          <StyledWeekHourCol aria-hidden="true">
            {slots.map((slot) => (
              <StyledWeekHourLbl key={slot}>
                {formatHoraLabel(slot, AGENDA_DAY_START_HOUR)}
              </StyledWeekHourLbl>
            ))}
          </StyledWeekHourCol>

          {/* Day tracks */}
          {daySlots.map(({ day, slots: columnSlots }) => (
            <StyledWeekTrack
              key={day.dateStr}
              ref={(el) => {
                registerTrack(day.dateStr, el);
              }}
              $isToday={day.isToday}
              $dropTarget={dropTargetDateStr === day.dateStr}
            >
              <StyledWeekTrackInner
                $height={TRACK_HEIGHT}
                onDoubleClick={
                  canManage
                    ? (e) => {
                        if ((e.target as HTMLElement).closest('[data-agenda-occupied]')) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const horaInicio = topOffsetToTime(
                          e.clientY - rect.top,
                          AGENDA_DAY_START_HOUR,
                          AGENDA_SLOT_HEIGHT_PX,
                          30,
                          AGENDA_DAY_END_HOUR,
                          0,
                        );
                        onCreateAtSlot({ dateStr: day.dateStr, horaInicio });
                      }
                    : undefined
                }
              >
                {day.isToday && isNowInRange && (
                  <StyledWeekNowLine $top={nowTop} aria-hidden="true" />
                )}

                {/* Preview ghost — snapped landing slot for the dragged cita
                  (pessimistic commit; the real block never moves). Rendered in
                  the target column only; decorative for SR (aria-hidden). */}
                {preview !== null && preview.dateStr === day.dateStr && (
                  <StyledWeekGhost
                    $top={preview.topPx}
                    $height={preview.heightPx}
                    $overlap={preview.overlap}
                    aria-hidden="true"
                  >
                    <StyledWeekGhostGlyph>↳</StyledWeekGhostGlyph>
                    <StyledWeekGhostChip>
                      {preview.startTime}–{preview.endTime}
                    </StyledWeekGhostChip>
                  </StyledWeekGhost>
                )}

                {columnSlots.map((slot) => {
                  if (slot.kind === 'singleton') {
                    const appt = slot.appointment;
                    const color: TAgendaTherapistColor =
                      (appt.therapistId !== null
                        ? (colorMap as Record<number, TAgendaTherapistColor>)[appt.therapistId]
                        : undefined) ?? DEFAULT_COLOR;
                    const top = timeToTopOffset(
                      appt.startTime,
                      AGENDA_DAY_START_HOUR,
                      AGENDA_SLOT_HEIGHT_PX,
                    );
                    const height = durationToHeight(appt.durationMin, AGENDA_SLOT_HEIGHT_PX);
                    const isSelected = selectedId === appt.id;

                    // Drag eligibility (Analyst OQ-A5/§8): only authorised users may
                    // drag, and terminal-estado citas are blocked at the source so
                    // historical records aren't moved accidentally. Locked blocks
                    // keep their read affordance (press still opens the detail).
                    const isTerminal = isTerminalEstado(appt.estado);
                    const isDraggable = canManage && !isTerminal;
                    const isDragging = draggingId === appt.id;
                    // Non-color cue: terminal blocks gain a lock glyph + a label
                    // suffix so SR users know why the block can't be moved.
                    const ariaLabel = `${appt.clientName ?? '—'} · ${appt.startTime}–${appt.endTime} · ${appt.serviceName}${
                      isTerminal ? ` ${t('a11y.lockedHint')}` : ''
                    }`;

                    const eventEl = (
                      <StyledWeekEvt
                        $color={color}
                        $top={top}
                        $height={height}
                        $selected={isSelected}
                        $optimistic={optimisticId === appt.id}
                        $draggable={isDraggable}
                        $lifted={isDragging}
                        $dragging={isDragging}
                        $dragDisabled={isDraggable && rescheduleBusy}
                        tabIndex={0}
                        role="button"
                        aria-haspopup="dialog"
                        aria-expanded={isSelected}
                        aria-label={ariaLabel}
                        data-agenda-occupied="true"
                        onPointerDown={
                          isDraggable && !rescheduleBusy
                            ? (e) => {
                                beginDrag(appt, day.dateStr, e);
                              }
                            : undefined
                        }
                        onClick={() => {
                          onActivate(appt.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onActivate(appt.id);
                          }
                        }}
                      >
                        <StyledWeekEvtTime>{appt.startTime}</StyledWeekEvtTime>
                        {isTerminal && <StyledWeekEvtLock aria-hidden="true">🔒</StyledWeekEvtLock>}
                        <StyledWeekEvtClient>{appt.clientName ?? '—'}</StyledWeekEvtClient>
                        {height >= 48 && (
                          <StyledWeekEvtService>{appt.serviceName}</StyledWeekEvtService>
                        )}
                      </StyledWeekEvt>
                    );

                    // Wrap only the selected event in the detail popover so it
                    // anchors to (and restores focus to) the clicked block.
                    return isSelected ? (
                      <AgendaCitaDetailPopover
                        key={appt.id}
                        open
                        onOpenChange={onDetailOpenChange}
                        appointment={appt}
                        centroName={centroName}
                        canManage={canManage}
                        actionPending={actionPending}
                        onConfirm={onConfirm}
                        onChangeEstado={onChangeEstado}
                        onEdit={onEdit}
                        onCancel={onCancel}
                      >
                        {eventEl}
                      </AgendaCitaDetailPopover>
                    ) : (
                      <React.Fragment key={appt.id}>{eventEl}</React.Fragment>
                    );
                  }

                  // ── Cluster ("folder") ──────────────────────────────────────────
                  const cluster: IAgendaClusterSlot = slot;
                  const top = (cluster.startMin / 30) * AGENDA_SLOT_HEIGHT_PX;
                  const height = (cluster.spanMin / 30) * AGENDA_SLOT_HEIGHT_PX;
                  const renderedHeight = Math.max(height - 4, 18);
                  const { variant, color } = resolveClusterVariant(cluster.appointments, colorMap);
                  const isOpen = openClusterKey === cluster.key;
                  const hasOptimisticMember =
                    optimisticId !== null &&
                    cluster.appointments.some((a) => a.id === optimisticId);
                  const rangeStart = cluster.appointments[0]?.startTime ?? '';
                  const rangeEnd = clusterRangeEnd(cluster.appointments);
                  const triggerLabel = t('week.cluster.triggerLabel', {
                    count: cluster.appointments.length,
                    start: rangeStart,
                    end: rangeEnd,
                  });

                  // The folder CARD is the focusable popover trigger; the two
                  // back-card rims are TRACK-level SIBLINGS of the card (not its
                  // children) so their absolute geometry resolves against the
                  // relatively-positioned StyledWeekTrackInner — NOT against the
                  // already-offset card — keeping them inside the column and behind
                  // the card (Bug 1 fix). They are decorative (aria-hidden, no
                  // pointer events) and self-position via their track-relative styles.
                  const stackEdges = renderedHeight >= CLUSTER_STACK_MIN_HEIGHT && (
                    <>
                      <StyledWeekClusterStackEdge
                        aria-hidden="true"
                        $top={top}
                        $height={height}
                        $variant={variant}
                        $color={color}
                        $depth={2}
                      />
                      <StyledWeekClusterStackEdge
                        aria-hidden="true"
                        $top={top}
                        $height={height}
                        $variant={variant}
                        $color={color}
                        $depth={1}
                      />
                    </>
                  );

                  const folderCard = (
                    <StyledWeekCluster
                      $variant={variant}
                      $color={color}
                      $top={top}
                      $height={height}
                      $open={isOpen}
                      $optimistic={hasOptimisticMember}
                      tabIndex={0}
                      role="button"
                      aria-haspopup="dialog"
                      aria-expanded={isOpen}
                      aria-label={triggerLabel}
                      data-agenda-occupied="true"
                      onClick={() => {
                        handleClusterActivate(cluster.key);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleClusterActivate(cluster.key);
                        }
                      }}
                    >
                      <StyledWeekClusterGlyph $variant={variant} aria-hidden="true">
                        ⧉
                      </StyledWeekClusterGlyph>
                      <StyledWeekClusterCount $variant={variant}>
                        {cluster.appointments.length}
                      </StyledWeekClusterCount>
                      {renderedHeight >= CLUSTER_LABEL_MIN_HEIGHT && (
                        <StyledWeekClusterLabel>{rangeStart}</StyledWeekClusterLabel>
                      )}
                    </StyledWeekCluster>
                  );

                  // Wrap only the OPEN cluster's CARD in its list popup (mirrors the
                  // selected-singleton detail-popover wrap above) so focus-return on
                  // close still lands on the focusable trigger. The rims stay siblings.
                  return (
                    <React.Fragment key={cluster.key}>
                      {stackEdges}
                      {isOpen ? (
                        <AgendaCitaClusterPopover
                          open
                          onOpenChange={(next) => {
                            onClusterOpenChange(next ? cluster.key : null);
                          }}
                          appointments={cluster.appointments}
                          colorMap={colorMap}
                          optimisticId={optimisticId}
                          rangeStart={rangeStart}
                          rangeEnd={rangeEnd}
                          onEdit={onEdit}
                        >
                          {folderCard}
                        </AgendaCitaClusterPopover>
                      ) : (
                        folderCard
                      )}
                    </React.Fragment>
                  );
                })}
              </StyledWeekTrackInner>
            </StyledWeekTrack>
          ))}
        </StyledWeekBody>
      </StyledWeekScrollArea>

      {/* Therapist color legend */}
      {therapists.length > 0 && (
        <StyledWeekLegend aria-label={t('week.legend')}>
          {therapists.map((th) => {
            const color: TAgendaTherapistColor =
              (colorMap as Record<number, TAgendaTherapistColor>)[th.id] ?? DEFAULT_COLOR;
            return (
              <StyledWeekLegendItem key={th.id} $color={color}>
                {th.apellidos ? `${th.nombre} ${th.apellidos}` : th.nombre}
              </StyledWeekLegendItem>
            );
          })}
        </StyledWeekLegend>
      )}
    </StyledWeekCal>
  );
};

/**
 * memo(): the week grid renders 7 columns × N appointment blocks per column.
 * It already has useMemo (daySlots) and useCallback (handleClusterActivate)
 * internally. Wrapping prevents re-renders when only selection/modal/cancel state
 * flips in AdminAgendaView; the stable callbacks and memoized arrays from the
 * parent complete the optimization chain. Compiler is NOT enabled —
 * see project_react_compiler_not_active.
 */
export const AgendaWeekGrid = memo(AgendaWeekGridInner);
