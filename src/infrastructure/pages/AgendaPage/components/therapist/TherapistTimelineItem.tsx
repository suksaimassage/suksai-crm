import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';
import {
  StyledTimelineItem,
  StyledTimelineNode,
  StyledTimelineWhen,
  StyledTimelineTime,
  StyledTimelineDuration,
  StyledTimelineCard,
  StyledTimelineCardNowBadge,
  StyledCardClient,
  StyledCardService,
  StyledCardNote,
  StyledBreakCard,
} from '../../views/TherapistAgendaView.styles';

interface ITherapistTimelineItemProps {
  readonly appointment: IAgendaAppointment;
  /** When provided, a real cita card becomes an activatable edit button. */
  readonly onAppointmentClick?: (id: TCitaId) => void;
}

export const TherapistTimelineItem = ({
  appointment,
  onAppointmentClick,
}: ITherapistTimelineItemProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  if (appointment.evtVariant === 'break') {
    return (
      <StyledTimelineItem
        $state="break"
        role="listitem"
        aria-label={`Descanso ${appointment.startTime}–${appointment.endTime}`}
      >
        <StyledTimelineNode $state="break" aria-hidden="true" />
        <StyledTimelineWhen>
          <StyledTimelineTime>{appointment.startTime}</StyledTimelineTime>
          <StyledTimelineDuration>{appointment.durationMin} min</StyledTimelineDuration>
        </StyledTimelineWhen>
        <StyledBreakCard>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 3v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          {appointment.clientName ?? '—'} · {appointment.startTime}–{appointment.endTime}
        </StyledBreakCard>
      </StyledTimelineItem>
    );
  }

  const editAriaLabel = t('therapist.timelineEditAriaLabel', {
    client: appointment.clientName ?? '—',
    start: appointment.startTime,
    end: appointment.endTime,
  });

  return (
    <StyledTimelineItem
      $state={appointment.timelineState}
      role="listitem"
      aria-label={`${appointment.clientName ?? '—'} ${appointment.startTime}–${appointment.endTime}`}
    >
      <StyledTimelineNode $state={appointment.timelineState} aria-hidden="true" />
      <StyledTimelineWhen>
        <StyledTimelineTime>{appointment.startTime}</StyledTimelineTime>
        <StyledTimelineDuration>{appointment.durationMin} min</StyledTimelineDuration>
      </StyledTimelineWhen>
      <StyledTimelineCard
        $state={appointment.timelineState}
        type="button"
        aria-label={editAriaLabel}
        onClick={() => onAppointmentClick?.(appointment.id)}
      >
        {appointment.timelineState === 'now' && (
          <StyledTimelineCardNowBadge aria-label={t('therapist.timelineStateNow')}>
            {t('therapist.timelineStateNow')}
          </StyledTimelineCardNowBadge>
        )}
        {appointment.timelineState === 'done' && (
          <StyledTimelineCardNowBadge aria-label={t('therapist.done')}>
            {t('therapist.done')}
          </StyledTimelineCardNowBadge>
        )}
        <StyledCardClient>{appointment.clientName ?? '—'}</StyledCardClient>
        {appointment.visitInfo !== null && (
          <StyledCardService>
            {appointment.serviceName} · {appointment.visitInfo}
          </StyledCardService>
        )}
        {appointment.visitInfo === null && (
          <StyledCardService>{appointment.serviceName}</StyledCardService>
        )}
        {appointment.notes !== null && <StyledCardNote>{appointment.notes}</StyledCardNote>}
      </StyledTimelineCard>
    </StyledTimelineItem>
  );
};
