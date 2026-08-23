import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';
import {
  StyledTimelinePanel,
  StyledTimelinePanelHeader,
  StyledTimelinePanelTitle,
  StyledRoomPill,
  StyledTimeline,
} from '../../views/TherapistAgendaView.styles';
import { TherapistTimelineItem } from './TherapistTimelineItem';

interface ITherapistTimelineProps {
  readonly appointments: readonly IAgendaAppointment[];
  /** Opens the quick-edit modal for a real cita (break items are inert). */
  readonly onAppointmentClick?: (id: TCitaId) => void;
}

export const TherapistTimeline = ({
  appointments,
  onAppointmentClick,
}: ITherapistTimelineProps): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const sala = appointments[0]?.sala ?? '';

  return (
    <StyledTimelinePanel aria-labelledby="timeline-panel-title">
      <StyledTimelinePanelHeader>
        <StyledTimelinePanelTitle id="timeline-panel-title">
          {t('therapist.timelineTitle')}
        </StyledTimelinePanelTitle>
        {sala && <StyledRoomPill>{sala}</StyledRoomPill>}
      </StyledTimelinePanelHeader>

      <StyledTimeline role="list" aria-label={t('therapist.timelineTitle')}>
        {appointments.map((appt) => (
          <TherapistTimelineItem
            key={appt.id}
            appointment={appt}
            onAppointmentClick={onAppointmentClick}
          />
        ))}
      </StyledTimeline>
    </StyledTimelinePanel>
  );
};
