import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaShiftStats, IAgendaDayNotes } from '@domain/models/agenda.models';
import { formatHorasEnSala } from '@infra/utils/agenda.utils';
import {
  StyledTherHero,
  StyledHeroText,
  StyledHeroEyebrow,
  StyledHeroTitle,
  StyledHeroParagraph,
  StyledHeroStats,
  StyledHeroStatItem,
  StyledHeroStatValue,
  StyledHeroStatLabel,
  StyledHeroLotus,
} from '../../views/TherapistAgendaView.styles';

interface ITherapistHeroBannerProps {
  readonly therapistName: string;
  readonly sala: string;
  readonly date: string;
  readonly stats: IAgendaShiftStats;
  readonly notes: IAgendaDayNotes | null;
  readonly weekMasajesCount: number;
  readonly masajeMasRealizado: string;
}

const LotusOrnamentSvg = (): React.ReactElement => (
  <svg
    width="220"
    height="220"
    viewBox="0 0 220 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="110" cy="110" r="108" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="110" cy="110" rx="28" ry="70" stroke="currentColor" strokeWidth="1.5" />
    <ellipse
      cx="110"
      cy="110"
      rx="28"
      ry="70"
      stroke="currentColor"
      strokeWidth="1.5"
      transform="rotate(45 110 110)"
    />
    <ellipse
      cx="110"
      cy="110"
      rx="28"
      ry="70"
      stroke="currentColor"
      strokeWidth="1.5"
      transform="rotate(90 110 110)"
    />
    <ellipse
      cx="110"
      cy="110"
      rx="28"
      ry="70"
      stroke="currentColor"
      strokeWidth="1.5"
      transform="rotate(135 110 110)"
    />
    <circle cx="110" cy="110" r="12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function formatHeroDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

export const TherapistHeroBanner = ({
  therapistName,
  sala,
  date,
  stats,
  weekMasajesCount,
  masajeMasRealizado,
}: ITherapistHeroBannerProps): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const firstName = therapistName.split(' ')[0] ?? therapistName;
  const remaining = stats.citasTotal - stats.citasCompletadas;

  return (
    <StyledTherHero aria-labelledby="therapist-hero-title">
      <StyledHeroText>
        <StyledHeroEyebrow>{t('therapist.heroEyebrow', { sala })}</StyledHeroEyebrow>
        <StyledHeroTitle id="therapist-hero-title">
          {t('therapist.greeting', { name: firstName })}
        </StyledHeroTitle>
        <StyledHeroParagraph>
          {formatHeroDate(date)} · {t('therapist.heroParagraph', { count: remaining, nextIn: 30 })}
        </StyledHeroParagraph>
      </StyledHeroText>

      <StyledHeroStats aria-label={t('therapist.shift.statsAriaLabel')}>
        <StyledHeroStatItem>
          <StyledHeroStatValue>
            {stats.citasCompletadas}/{stats.citasTotal}
          </StyledHeroStatValue>
          <StyledHeroStatLabel>{t('therapist.stat.citas')}</StyledHeroStatLabel>
        </StyledHeroStatItem>
        <StyledHeroStatItem>
          <StyledHeroStatValue>{formatHorasEnSala(stats.horasEnSala)}</StyledHeroStatValue>
          <StyledHeroStatLabel>{t('therapist.stat.horasSala')}</StyledHeroStatLabel>
        </StyledHeroStatItem>
        <StyledHeroStatItem>
          <StyledHeroStatValue>{weekMasajesCount}</StyledHeroStatValue>
          <StyledHeroStatLabel>{t('therapist.stat.masajesSemana')}</StyledHeroStatLabel>
        </StyledHeroStatItem>
        <StyledHeroStatItem>
          <StyledHeroStatValue>{masajeMasRealizado}</StyledHeroStatValue>
          <StyledHeroStatLabel>{t('therapist.stat.masajeMasRealizado')}</StyledHeroStatLabel>
        </StyledHeroStatItem>
      </StyledHeroStats>

      <StyledHeroLotus aria-hidden="true">
        <LotusOrnamentSvg />
      </StyledHeroLotus>
    </StyledTherHero>
  );
};
