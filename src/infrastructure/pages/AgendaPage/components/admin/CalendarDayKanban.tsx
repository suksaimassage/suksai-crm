/**
 * CalendarDayKanban — the bottom-left "kanban" zone of the AgendaCalendarOverlay.
 *
 * Renders the merged day list (`[...appointments, ...unassignedAppointments]`,
 * fused by `mergeDayCitas` upstream) split into two columns by therapist
 * ASSIGNMENT via `partitionCitasByKanbanColumn`: `sinAsignar` (therapistId ===
 * null) and `asignadas` (therapistId !== null). Each card reads, in order,
 * hour → service → meta (therapist · room · centre) and carries the therapist's
 * identity on its `border-left`. Nullable fields render localised placeholders,
 * never the literal "null".
 *
 * `memo` on the board, its columns and its cards — a busy day re-renders on every
 * day switch, and the parent passes a stable `onCardEdit` (`useCallback`).
 */

import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  IAgendaAppointment,
  IAgendaTherapist,
  TTherapistColorMap,
} from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';
import { KANBAN_COLUMN_IDS, type TKanbanColumnId } from '../../agenda.constants';
import { partitionCitasByKanbanColumn, resolveTherapistName } from './calendarOverlay.utils';
import * as S from './CalendarDayKanban.styles';

// ── Column icons (decorative — meaning carried by the text label) ─────────────
// sinAsignar → person with an alert badge; asignadas → person with a check.
const IconUserAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="12" />
    <line x1="19" y1="16" x2="19" y2="16" />
  </svg>
);
const IconUserCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const COLUMN_IDS = KANBAN_COLUMN_IDS;
const COLUMN_ICON: Record<TKanbanColumnId, () => React.ReactElement> = {
  sinAsignar: IconUserAlert,
  asignadas: IconUserCheck,
};

// ── Card ─────────────────────────────────────────────────────────────────────

interface IKanbanCardProps {
  readonly appointment: IAgendaAppointment;
  readonly therapists: readonly IAgendaTherapist[];
  readonly colorMap: TTherapistColorMap;
  readonly centroName: string;
  readonly onEdit: (citaId: TCitaId) => void;
}

const KanbanCardComponent = ({
  appointment,
  therapists,
  colorMap,
  centroName,
  onEdit,
}: IKanbanCardProps) => {
  const { t } = useTranslation('agenda');

  const isUnassigned = appointment.therapistId === null;
  const therapistName =
    resolveTherapistName(appointment.therapistId, therapists) ??
    t('calendarOverlay.card.unassigned');
  const salaName = appointment.sala ?? t('calendarOverlay.card.noRoom');
  const accent =
    appointment.therapistId === null ? null : (colorMap[appointment.therapistId] ?? null);

  const handleClick = useCallback(() => {
    onEdit(appointment.id);
  }, [onEdit, appointment.id]);

  return (
    <S.StyledKanbanCard
      type="button"
      $accent={accent}
      onClick={handleClick}
      aria-label={t('calendarOverlay.card.ariaLabel', {
        hora: appointment.startTime,
        servicio: appointment.serviceName,
        sala: salaName,
        masajista: therapistName,
        centro: centroName,
      })}
    >
      <S.StyledKanbanCardTime>{appointment.startTime}</S.StyledKanbanCardTime>
      <S.StyledKanbanCardService>{appointment.serviceName}</S.StyledKanbanCardService>
      <S.StyledKanbanCardMeta>
        <S.StyledKanbanMetaItem $unassigned={isUnassigned}>{therapistName}</S.StyledKanbanMetaItem>
        <S.StyledKanbanMetaSep aria-hidden="true">·</S.StyledKanbanMetaSep>
        <span>{salaName}</span>
        <S.StyledKanbanMetaSep aria-hidden="true">·</S.StyledKanbanMetaSep>
        <span>{centroName}</span>
      </S.StyledKanbanCardMeta>
    </S.StyledKanbanCard>
  );
};

const KanbanCard = memo(KanbanCardComponent);

// ── Board ─────────────────────────────────────────────────────────────────────

export interface ICalendarDayKanbanProps {
  readonly dayCitas: readonly IAgendaAppointment[];
  readonly therapists: readonly IAgendaTherapist[];
  readonly colorMap: TTherapistColorMap;
  readonly centroName: string;
  readonly dateLabel: string;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
  readonly onCardEdit: (citaId: TCitaId) => void;
}

const CalendarDayKanbanComponent = ({
  dayCitas,
  therapists,
  colorMap,
  centroName,
  dateLabel,
  isLoading,
  isError,
  onRetry,
  onCardEdit,
}: ICalendarDayKanbanProps) => {
  const { t } = useTranslation('agenda');

  const partition = useMemo(() => partitionCitasByKanbanColumn(dayCitas), [dayCitas]);

  return (
    <S.StyledKanban aria-label={t('calendarOverlay.kanbanSectionLabel')}>
      <S.StyledKanbanTitle>{dateLabel}</S.StyledKanbanTitle>

      {isError ? (
        <S.StyledKanbanError role="alert">
          <span>{t('calendarOverlay.error.day')}</span>
          <S.StyledKanbanRetry type="button" onClick={onRetry}>
            {t('calendarOverlay.error.retry')}
          </S.StyledKanbanRetry>
        </S.StyledKanbanError>
      ) : isLoading ? (
        <S.StyledKanbanColumns role="status" aria-label={t('loading')}>
          {COLUMN_IDS.map((id) => (
            <S.StyledKanbanColumn key={id}>
              <S.StyledKanbanSkeleton aria-hidden="true" />
              <S.StyledKanbanSkeleton aria-hidden="true" />
            </S.StyledKanbanColumn>
          ))}
        </S.StyledKanbanColumns>
      ) : (
        <S.StyledKanbanColumns>
          {COLUMN_IDS.map((id) => {
            const items = partition[id];
            const Icon = COLUMN_ICON[id];
            return (
              <S.StyledKanbanColumn
                key={id}
                role="group"
                aria-label={t(`calendarOverlay.columns.${id}`)}
              >
                <S.StyledKanbanColumnHeader>
                  <S.StyledKanbanColumnIcon $columnId={id} aria-hidden="true">
                    <Icon />
                  </S.StyledKanbanColumnIcon>
                  <S.StyledKanbanColumnTitle>
                    {t(`calendarOverlay.columns.${id}`)}
                  </S.StyledKanbanColumnTitle>
                  <S.StyledKanbanColumnCount>{items.length}</S.StyledKanbanColumnCount>
                </S.StyledKanbanColumnHeader>

                {items.length === 0 ? (
                  <S.StyledKanbanEmpty>{t(`calendarOverlay.empty.${id}`)}</S.StyledKanbanEmpty>
                ) : (
                  <S.StyledKanbanList>
                    {items.map((appointment) => (
                      <li key={appointment.id}>
                        <KanbanCard
                          appointment={appointment}
                          therapists={therapists}
                          colorMap={colorMap}
                          centroName={centroName}
                          onEdit={onCardEdit}
                        />
                      </li>
                    ))}
                  </S.StyledKanbanList>
                )}
              </S.StyledKanbanColumn>
            );
          })}
        </S.StyledKanbanColumns>
      )}
    </S.StyledKanban>
  );
};

export const CalendarDayKanban = memo(CalendarDayKanbanComponent);
