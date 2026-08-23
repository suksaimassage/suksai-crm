import React from 'react';
import { useTranslation } from 'react-i18next';
import type {
  IAgendaDayNotes,
  IAgendaShiftStats,
  IAgendaReview,
} from '@domain/models/agenda.models';
import { formatHorasEnSala } from '@infra/utils/agenda.utils';
import {
  StyledTRail,
  StyledTRailPanel,
  StyledTRailPanelTitle,
  StyledMicroStats,
  StyledMicroStatItem,
  StyledMicroStatValue,
  StyledMicroStatLabel,
  StyledReview,
  StyledReviewStars,
  StyledReviewBody,
  StyledReviewMeta,
  StyledNoteBlock,
  StyledNoteMeta,
} from '../../views/TherapistAgendaView.styles';

interface ITherapistRailProps {
  readonly notes: IAgendaDayNotes | null;
  readonly stats: IAgendaShiftStats;
  readonly reviews: readonly IAgendaReview[];
  readonly weekMasajesCount: number;
  readonly masajeMasRealizado: string;
}

function renderStars(count: number): string {
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}

export const TherapistRail = ({
  notes,
  stats,
  reviews,
  weekMasajesCount,
  masajeMasRealizado,
}: ITherapistRailProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  return (
    <StyledTRail>
      <StyledTRailPanel aria-labelledby="tshift-title">
        <StyledTRailPanelTitle id="tshift-title">
          {t('therapist.shift.title')}
        </StyledTRailPanelTitle>
        <StyledMicroStats aria-label={t('therapist.shift.title')}>
          <StyledMicroStatItem>
            <StyledMicroStatValue>{stats.citasTotal}</StyledMicroStatValue>
            <StyledMicroStatLabel>{t('therapist.shift.citas')}</StyledMicroStatLabel>
          </StyledMicroStatItem>
          <StyledMicroStatItem>
            <StyledMicroStatValue>{formatHorasEnSala(stats.horasEnSala)}</StyledMicroStatValue>
            <StyledMicroStatLabel>{t('therapist.shift.sala')}</StyledMicroStatLabel>
          </StyledMicroStatItem>
          <StyledMicroStatItem>
            <StyledMicroStatValue>{weekMasajesCount}</StyledMicroStatValue>
            <StyledMicroStatLabel>{t('therapist.shift.masajesSemana')}</StyledMicroStatLabel>
          </StyledMicroStatItem>
          <StyledMicroStatItem>
            <StyledMicroStatValue>{masajeMasRealizado}</StyledMicroStatValue>
            <StyledMicroStatLabel>{t('therapist.shift.masajeMasRealizado')}</StyledMicroStatLabel>
          </StyledMicroStatItem>
        </StyledMicroStats>
      </StyledTRailPanel>

      {notes !== null && (
        <StyledTRailPanel aria-labelledby="notes-title">
          <StyledTRailPanelTitle id="notes-title">
            {t('therapist.notesTitle')}
          </StyledTRailPanelTitle>
          <StyledNoteBlock>
            {notes.body}
            <StyledNoteMeta>
              {notes.author} · {notes.time}
            </StyledNoteMeta>
          </StyledNoteBlock>
        </StyledTRailPanel>
      )}

      {reviews.length > 0 && (
        <StyledTRailPanel aria-labelledby="reviews-title">
          <StyledTRailPanelTitle id="reviews-title">
            {t('therapist.reviewsTitle')}
          </StyledTRailPanelTitle>
          {reviews.map((review) => (
            <StyledReview key={review.id}>
              <StyledReviewStars aria-label={`${review.stars} de 5 estrellas`}>
                {renderStars(review.stars)}
              </StyledReviewStars>
              <StyledReviewBody>{review.body}</StyledReviewBody>
              <StyledReviewMeta>
                {review.fromClient} · {review.date}
              </StyledReviewMeta>
            </StyledReview>
          ))}
        </StyledTRailPanel>
      )}
    </StyledTRail>
  );
};
