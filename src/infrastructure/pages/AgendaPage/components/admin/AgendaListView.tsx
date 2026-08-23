import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaWeekDay } from '@domain/models/agenda.models';
import type { TCitaId, TEstadoCita } from '@domain/types';
import {
  StyledList,
  StyledListEmpty,
  StyledListDayGroup,
  StyledListDayLabel,
  StyledListDayName,
  StyledListDayNumber,
  StyledListDayItems,
  StyledListItem,
  StyledListItemTime,
  StyledListItemStartTime,
  StyledListItemEndTime,
  StyledListItemMeta,
  StyledListItemClient,
  StyledListItemService,
  StyledListItemRight,
  StyledListItemSala,
  StyledListStatusBadge,
  StyledListStatusGlyph,
} from './AgendaListView.styles';
import { AgendaCitaDetailPopover } from './AgendaCitaDetailPopover';
import { ESTADO_GLYPH, isStruckEstado } from '../shared/agendaEstado';

interface IAgendaListViewProps {
  /** The active week's days (Mon–Sun), already filtered — see AdminAgendaView's filteredWeekDays. */
  readonly weekDays: readonly IAgendaWeekDay[];
  readonly selectedId: TCitaId | null;
  readonly optimisticId: TCitaId | null;
  readonly canManage: boolean;
  readonly actionPending: boolean;
  readonly centroName?: string;
  readonly onActivate: (id: TCitaId) => void;
  readonly onDetailOpenChange: (open: boolean) => void;
  readonly onConfirm: (id: TCitaId) => void;
  readonly onChangeEstado: (id: TCitaId, estado: TEstadoCita) => void;
  readonly onEdit: (id: TCitaId) => void;
  readonly onCancel: (id: TCitaId) => void;
}

export const AgendaListView = ({
  weekDays,
  selectedId,
  optimisticId,
  canManage,
  actionPending,
  centroName,
  onActivate,
  onDetailOpenChange,
  onConfirm,
  onChangeEstado,
  onEdit,
  onCancel,
}: IAgendaListViewProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const nonEmptyDays = weekDays.filter((day) => day.appointments.length > 0);

  return (
    <StyledList aria-label={t('list.ariaLabel')}>
      {nonEmptyDays.length === 0 ? (
        <StyledListEmpty>{t('list.empty')}</StyledListEmpty>
      ) : (
        nonEmptyDays.map((day) => {
          const sorted = [...day.appointments].sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );

          return (
            <StyledListDayGroup key={day.dateStr}>
              <StyledListDayLabel>
                <StyledListDayName>{day.label}</StyledListDayName>
                <StyledListDayNumber $isToday={day.isToday}>{day.dateNumber}</StyledListDayNumber>
              </StyledListDayLabel>

              <StyledListDayItems>
                {sorted.map((appt) => {
                  const isSelected = selectedId === appt.id;
                  const struck = isStruckEstado(appt.estado);
                  const rowEl = (
                    <StyledListItem
                      $selected={isSelected}
                      $optimistic={optimisticId === appt.id}
                      tabIndex={0}
                      role="button"
                      aria-haspopup="dialog"
                      aria-expanded={isSelected}
                      aria-label={t('a11y.eventLabel', {
                        client: appt.clientName ?? '—',
                        start: appt.startTime,
                        end: appt.endTime,
                        service: appt.serviceName,
                        estado: t(`estado.${appt.estado}`),
                      })}
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
                      <StyledListItemTime>
                        <StyledListItemStartTime>{appt.startTime}</StyledListItemStartTime>
                        <StyledListItemEndTime>{appt.endTime}</StyledListItemEndTime>
                      </StyledListItemTime>

                      <StyledListItemMeta>
                        <StyledListItemClient $struck={struck}>
                          {appt.clientName ?? '—'}
                        </StyledListItemClient>
                        <StyledListItemService>{appt.serviceName}</StyledListItemService>
                      </StyledListItemMeta>

                      <StyledListItemRight>
                        <StyledListStatusBadge $estado={appt.estado}>
                          <StyledListStatusGlyph aria-hidden="true">
                            {ESTADO_GLYPH[appt.estado]}
                          </StyledListStatusGlyph>
                          {t(`estado.${appt.estado}`)}
                        </StyledListStatusBadge>
                        <StyledListItemSala>{appt.sala ?? '—'}</StyledListItemSala>
                      </StyledListItemRight>
                    </StyledListItem>
                  );

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
                      {rowEl}
                    </AgendaCitaDetailPopover>
                  ) : (
                    <React.Fragment key={appt.id}>{rowEl}</React.Fragment>
                  );
                })}
              </StyledListDayItems>
            </StyledListDayGroup>
          );
        })
      )}
    </StyledList>
  );
};
