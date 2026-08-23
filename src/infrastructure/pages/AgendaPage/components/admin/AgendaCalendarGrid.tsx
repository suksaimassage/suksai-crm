import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaTherapist, IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId, TEstadoCita, TUserId } from '@domain/types';
import { isTerminalEstado } from '@domain/index';
import { Empty } from '@infra/components/ui/common/Empty';
import {
  StyledCal,
  StyledCalHead,
  StyledCalCorner,
  StyledTherapistColHeader,
  StyledTherapistAvatar,
  StyledTherapistColMeta,
  StyledTherapistColName,
  StyledTherapistColRoom,
  StyledTherapistColStatus,
  StyledUnassignedColHeader,
  StyledUnassignedColBadge,
  StyledUnassignedColMeta,
  StyledUnassignedColTitle,
  StyledUnassignedColCount,
  StyledCalEmptyState,
  StyledCalBody,
  StyledHourColWrapper,
  StyledHourLbl,
  StyledTrack,
  StyledTrackInner,
  StyledNowLine,
  StyledEvt,
  StyledEvtGlyph,
  StyledEvtLock,
  StyledEvtTime,
  StyledEvtClient,
  StyledEvtService,
  StyledEvtRoom,
  StyledEvtCentro,
  StyledBlock,
  StyledBlockLabel,
  StyledDayGhost,
  StyledDayGhostGlyph,
  StyledDayGhostChip,
} from './AgendaCalendarGrid.styles';
import type { TTherapistStatusVariant } from './AgendaCalendarGrid.styles';
import {
  useDayCitaDnD,
  UNASSIGNED_COLUMN,
  type IDayRescheduleDrop,
  type TDayColumnId,
} from './useDayCitaDnD';
import { AgendaCitaDetailPopover } from './AgendaCitaDetailPopover';
import { ESTADO_GLYPH } from '../shared/agendaEstado';
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
  getTodayKey,
  topOffsetToTime,
} from '@infra/utils/agenda.utils';

interface IAgendaCalendarGridProps {
  readonly therapists: readonly IAgendaTherapist[];
  readonly appointments: readonly IAgendaAppointment[];
  /**
   * Citas with no therapist assigned yet (estado 'sin_asignar'). When non-empty a
   * leading "Sin asignación" column is rendered before the therapist columns so
   * these citas are visible for the day. Its blocks are a drag SOURCE: dropping one
   * onto a therapist column assigns that therapist.
   */
  readonly unassignedAppointments?: readonly IAgendaAppointment[];
  readonly activeDate: string;
  /** Cita whose detail popover is open (selection ring). */
  readonly selectedId: TCitaId | null;
  /** Cita being optimistically mutated (dimmed). */
  readonly optimisticId: TCitaId | null;
  readonly canManage: boolean;
  readonly actionPending: boolean;
  /**
   * A reschedule is pending confirmation or its mutation is in flight. While true
   * no new drag may begin (Analyst E-A7) — draggable blocks render `not-allowed`
   * and ignore pointerdown.
   */
  readonly rescheduleBusy: boolean;
  readonly centroName?: string;
  readonly onActivate: (id: TCitaId) => void;
  readonly onDetailOpenChange: (open: boolean) => void;
  readonly onConfirm: (id: TCitaId) => void;
  readonly onChangeEstado: (id: TCitaId, estado: TEstadoCita) => void;
  readonly onEdit: (id: TCitaId) => void;
  readonly onCancel: (id: TCitaId) => void;
  /** Net-change drop (hour and/or therapist column, incl. assign-from-unassigned) → parent opens the confirm Dialog. */
  readonly onRescheduleDrop: (drop: IDayRescheduleDrop) => void;
  /**
   * Double-click on an empty slot → parent opens the create modal prefilled.
   * `therapistId` is null for a double-click in the "Sin asignación" column (the
   * cita is created without a therapist — sin_asignar).
   */
  readonly onCreateAtSlot: (params: { therapistId: TUserId | null; horaInicio: string }) => void;
}

const TRACK_HEIGHT = AGENDA_TOTAL_SLOTS * AGENDA_SLOT_HEIGHT_PX;

/** A 'break' variant cita represents a non-bookable block, not a real appointment. */
function isBlock(appt: IAgendaAppointment): boolean {
  return appt.evtVariant === 'break';
}

interface ITherapistStatus {
  readonly variant: TTherapistStatusVariant;
  readonly label: string;
  readonly a11yLabel: string;
}

function deriveTherapistStatus(
  therapistAppts: readonly IAgendaAppointment[],
  tNoCitas: string,
  tDone: string,
  tNext: (time: string, sala: string) => string,
  tNextA11y: (time: string, sala: string) => string,
): ITherapistStatus {
  // therapistAppts ya viene filtrado por terapeuta (ver `grouped` en el render),
  // así que aquí solo descartamos los bloques no reservables.
  const real = therapistAppts.filter((a) => !isBlock(a));
  if (real.length === 0) {
    return { variant: 'none', label: tNoCitas, a11yLabel: tNoCitas };
  }
  const nonTerminal = real
    .filter((a) => !isTerminalEstado(a.estado))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (nonTerminal.length > 0) {
    const next = nonTerminal[0];
    return {
      variant: 'next',
      label: tNext(next.startTime, next.sala ?? '—'),
      a11yLabel: tNextA11y(next.startTime, next.sala ?? '—'),
    };
  }
  return { variant: 'done', label: tDone, a11yLabel: tDone };
}

const AgendaCalendarGridInner = ({
  therapists,
  appointments,
  unassignedAppointments = [],
  activeDate,
  selectedId,
  optimisticId,
  canManage,
  actionPending,
  rescheduleBusy,
  centroName,
  onActivate,
  onDetailOpenChange,
  onConfirm,
  onChangeEstado,
  onEdit,
  onCancel,
  onRescheduleDrop,
  onCreateAtSlot,
}: IAgendaCalendarGridProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const now = new Date();
  const nowMinutes = (now.getHours() - AGENDA_DAY_START_HOUR) * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 30) * AGENDA_SLOT_HEIGHT_PX;
  const isToday = activeDate === getTodayKey();
  const showNowLine = isToday && nowMinutes >= 0 && nowMinutes <= AGENDA_TOTAL_SLOTS * 30;

  const slots = Array.from({ length: AGENDA_TOTAL_SLOTS }, (_, i) => i);

  const hasUnassigned = unassignedAppointments.length > 0;

  // Agrupar las citas por terapeuta una sola vez por render (O(citas)), en lugar
  // de re-filtrar `appointments` por cada terapeuta (O(terapeutas × citas)).
  // useMemo: the Map is passed to useDayCitaDnD whose useEffect has it as a dep;
  // a stable reference avoids an extra effect run on every render when only
  // selection/modal state flips in the parent. Compiler is NOT enabled —
  // see project_react_compiler_not_active.
  const apptsByTherapist = useMemo<ReadonlyMap<number, IAgendaAppointment[]>>(() => {
    const map = new Map<number, IAgendaAppointment[]>();
    for (const appt of appointments) {
      // therapistId es null en citas 'sin_asignar': el filtro previo
      // (`a.therapistId === th.id`) nunca las emparejaba con ninguna columna, así
      // que las omitimos para conservar exactamente ese comportamiento.
      if (appt.therapistId === null) continue;
      const bucket = map.get(appt.therapistId);
      if (bucket) {
        bucket.push(appt);
      } else {
        map.set(appt.therapistId, [appt]);
      }
    }
    return map;
  }, [appointments]);

  // Pointer drag & drop (Surface A). The hook never moves the real block; on a
  // net-change drop (new hour and/or new column, incl. assign-from-unassigned) it
  // calls onRescheduleDrop with a self-contained snapshot. Hooks run unconditionally
  // before any early return — apptsByTherapist is already built above.
  const { draggingId, preview, dropTargetColumnId, registerTrack, beginDrag } = useDayCitaDnD({
    therapists,
    apptsByTherapist,
    activeDate,
    onDrop: onRescheduleDrop,
    unassignedName: t('grid.unassignedColumn'),
  });

  if (therapists.length === 0 && !hasUnassigned) {
    return (
      <StyledCal aria-label={t('grid.calendarAriaLabel')}>
        <StyledCalEmptyState role="status" aria-live="polite">
          <Empty
            preset="no-results"
            title={t('grid.emptyTitle')}
            description={t('grid.emptyDescription')}
          />
        </StyledCalEmptyState>
      </StyledCal>
    );
  }

  const trackCount = therapists.length + (hasUnassigned ? 1 : 0);

  /**
   * Double-click on an empty slot → create a cita prefilled with that slot's time.
   * Shared by the therapist columns (therapistId = th.id) and the "Sin asignación"
   * column (therapistId = null → the cita is created without a therapist). Returns
   * undefined when the user can't manage citas (no create affordance).
   */
  const slotDoubleClickHandler = (
    therapistId: TUserId | null,
  ): ((e: React.MouseEvent<HTMLElement>) => void) | undefined =>
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
          onCreateAtSlot({ therapistId, horaInicio });
        }
      : undefined;

  /** Ghost preview for the column it currently hovers (pessimistic — real block never moves). */
  const renderGhost = (columnId: TDayColumnId): React.ReactNode =>
    preview !== null && preview.columnId === columnId ? (
      <StyledDayGhost
        $top={preview.topPx}
        $height={preview.heightPx}
        $overlap={preview.overlap}
        aria-hidden="true"
      >
        <StyledDayGhostGlyph>↳</StyledDayGhostGlyph>
        <StyledDayGhostChip>
          {preview.startTime}–{preview.endTime}
        </StyledDayGhostChip>
      </StyledDayGhost>
    ) : null;

  /** Renders one appointment block for a column (therapist id OR the unassigned column). */
  const renderApptBlock = (appt: IAgendaAppointment, columnId: TDayColumnId): React.ReactNode => {
    const top = timeToTopOffset(appt.startTime, AGENDA_DAY_START_HOUR, AGENDA_SLOT_HEIGHT_PX);
    const height = durationToHeight(appt.durationMin, AGENDA_SLOT_HEIGHT_PX);

    // Non-bookable block — decorative, not interactive (§4.2) and NOT draggable. A
    // lock glyph + the lockedHint aria suffix make "can't move" legible without
    // relying on the hatch alone. (Only therapist columns carry these.)
    if (isBlock(appt)) {
      return (
        <StyledBlock
          key={appt.id}
          $top={top}
          $height={height}
          role="note"
          data-agenda-occupied="true"
          aria-label={`${t('a11y.blockLabel', { label: appt.serviceName })} ${t('a11y.lockedHint')}`}
        >
          <StyledBlockLabel>{appt.serviceName}</StyledBlockLabel>
          <StyledEvtLock aria-hidden="true">🔒</StyledEvtLock>
          {height >= 60 && <StyledEvtTime>{appt.startTime}</StyledEvtTime>}
        </StyledBlock>
      );
    }

    const isSelected = selectedId === appt.id;

    // Drag eligibility (Analyst OQ-A5/§8): only authorised users may drag, and
    // terminal-estado citas are blocked at the source. sin_asignar is non-terminal,
    // so unassigned blocks are draggable (drop onto a therapist column = assign).
    const isTerminal = isTerminalEstado(appt.estado);
    const isDraggable = canManage && !isTerminal;
    const isDragging = draggingId === appt.id;
    const baseLabel = t('a11y.eventLabel', {
      client: appt.clientName ?? '—',
      start: appt.startTime,
      end: appt.endTime,
      service: appt.serviceName,
      estado: t(`estado.${appt.estado}`),
    });

    const eventEl = (
      <StyledEvt
        $variant={appt.evtVariant}
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
        aria-label={isTerminal ? `${baseLabel} ${t('a11y.lockedHint')}` : baseLabel}
        data-agenda-occupied="true"
        onPointerDown={
          isDraggable && !rescheduleBusy
            ? (e) => {
                beginDrag(appt, columnId, e);
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
        <StyledEvtTime>
          <StyledEvtGlyph aria-hidden="true">{ESTADO_GLYPH[appt.estado]}</StyledEvtGlyph>
          {appt.startTime}–{appt.endTime}
        </StyledEvtTime>
        {isTerminal && <StyledEvtLock aria-hidden="true">🔒</StyledEvtLock>}
        <StyledEvtClient>{appt.clientName ?? '—'}</StyledEvtClient>
        {height >= 60 && <StyledEvtService>{appt.serviceName}</StyledEvtService>}
        {height >= 80 && <StyledEvtRoom>{appt.sala ?? '—'}</StyledEvtRoom>}
        {height >= 100 && appt.centroName !== '' && (
          <StyledEvtCentro title={t('detail.centro')}>
            <span aria-hidden="true">📍</span>
            {appt.centroName}
          </StyledEvtCentro>
        )}
      </StyledEvt>
    );

    // Wrap only the selected event in the detail popover so it anchors to (and
    // restores focus to) the clicked block.
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
  };

  return (
    <StyledCal aria-label={t('grid.calendarAriaLabel')}>
      <StyledCalHead $trackCount={trackCount}>
        <StyledCalCorner />

        {hasUnassigned && (
          <StyledUnassignedColHeader>
            <StyledUnassignedColBadge aria-hidden="true">!</StyledUnassignedColBadge>
            <StyledUnassignedColMeta>
              <StyledUnassignedColTitle>{t('grid.unassignedColumn')}</StyledUnassignedColTitle>
              <StyledUnassignedColCount>
                {t('grid.unassignedCount', { n: unassignedAppointments.length })}
              </StyledUnassignedColCount>
            </StyledUnassignedColMeta>
          </StyledUnassignedColHeader>
        )}

        {therapists.map((th) => {
          const displayName = th.apellidos ? `${th.nombre} ${th.apellidos}` : th.nombre;
          const status = deriveTherapistStatus(
            apptsByTherapist.get(th.id) ?? [],
            t('therapistStatus.noCitas'),
            t('therapistStatus.dayCompleted'),
            (time, sala) => t('therapistStatus.nextCita', { time, sala }),
            (time, sala) => t('a11y.nextCita', { time, sala }),
          );
          return (
            <StyledTherapistColHeader key={th.id}>
              <StyledTherapistAvatar $inactive={!th.isActive} aria-hidden="true">
                {th.initials}
              </StyledTherapistAvatar>
              <StyledTherapistColMeta>
                <StyledTherapistColName>{displayName}</StyledTherapistColName>
                <StyledTherapistColRoom>{th.sala}</StyledTherapistColRoom>
                <StyledTherapistColStatus
                  $variant={status.variant}
                  aria-label={status.variant === 'next' ? status.a11yLabel : undefined}
                >
                  {status.label}
                </StyledTherapistColStatus>
              </StyledTherapistColMeta>
            </StyledTherapistColHeader>
          );
        })}
      </StyledCalHead>

      <StyledCalBody $trackCount={trackCount}>
        <StyledHourColWrapper aria-hidden="true">
          {slots.map((slot) => (
            <StyledHourLbl key={slot}>{formatHoraLabel(slot, AGENDA_DAY_START_HOUR)}</StyledHourLbl>
          ))}
        </StyledHourColWrapper>

        {hasUnassigned && (
          <StyledTrack
            key="unassigned-track"
            ref={(el) => {
              registerTrack(UNASSIGNED_COLUMN, el);
            }}
            $isToday={isToday}
            $unassigned
            $dropTarget={dropTargetColumnId === UNASSIGNED_COLUMN}
          >
            <StyledTrackInner $height={TRACK_HEIGHT} onDoubleClick={slotDoubleClickHandler(null)}>
              {showNowLine && <StyledNowLine $top={nowTop} aria-hidden="true" />}
              {renderGhost(UNASSIGNED_COLUMN)}
              {unassignedAppointments.map((appt) => renderApptBlock(appt, UNASSIGNED_COLUMN))}
            </StyledTrackInner>
          </StyledTrack>
        )}

        {therapists.map((th) => {
          const thAppts = apptsByTherapist.get(th.id) ?? [];
          return (
            <StyledTrack
              key={th.id}
              ref={(el) => {
                registerTrack(th.id, el);
              }}
              $isToday={isToday}
              $dropTarget={dropTargetColumnId === th.id}
            >
              <StyledTrackInner
                $height={TRACK_HEIGHT}
                onDoubleClick={slotDoubleClickHandler(th.id)}
              >
                {showNowLine && <StyledNowLine $top={nowTop} aria-hidden="true" />}

                {/* Preview ghost — snapped landing slot for the dragged cita
                    (pessimistic commit; the real block never moves). Rendered in
                    the target column only; decorative for SR. */}
                {renderGhost(th.id)}

                {thAppts.map((appt) => renderApptBlock(appt, th.id))}
              </StyledTrackInner>
            </StyledTrack>
          );
        })}
      </StyledCalBody>
    </StyledCal>
  );
};

/**
 * memo(): the day grid is a hot path — T therapist columns × N appointment blocks.
 * Wrapping prevents re-renders when only selection/modal/cancel state flips in
 * AdminAgendaView; the grid only re-renders when its own data or stable callbacks
 * change. The DnD handlers and all array props are stabilized by useCallback /
 * useMemo in the parent (see AdminAgendaView). Compiler is NOT enabled —
 * see project_react_compiler_not_active.
 */
export const AgendaCalendarGrid = memo(AgendaCalendarGridInner);
