import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaWeekBalance } from '@domain/models/agenda.models';
import { formatHorasEnSala } from '@infra/utils/agenda.utils';
import {
  StyledWeekBannerWrapper,
  StyledWeekBannerTitle,
  StyledWeekBannerSub,
  StyledWeekBannerStats,
  StyledWeekBannerStat,
  StyledWeekBannerStatValue,
  StyledWeekBannerStatLabel,
} from './TherapistWeekBanner.styles';

interface ITherapistWeekBannerProps {
  readonly therapistName: string;
  readonly balance: IAgendaWeekBalance;
}

export const TherapistWeekBanner = ({
  therapistName,
  balance,
}: ITherapistWeekBannerProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  return (
    <StyledWeekBannerWrapper>
      <div>
        <StyledWeekBannerTitle>
          {t('therapist.week.banner', { name: therapistName })}
        </StyledWeekBannerTitle>
        <StyledWeekBannerSub>{balance.weekLabel}</StyledWeekBannerSub>
      </div>

      <StyledWeekBannerStats>
        <StyledWeekBannerStat>
          <StyledWeekBannerStatValue>{balance.citasTotal}</StyledWeekBannerStatValue>
          <StyledWeekBannerStatLabel>{t('therapist.week.statCitas')}</StyledWeekBannerStatLabel>
        </StyledWeekBannerStat>

        <StyledWeekBannerStat>
          <StyledWeekBannerStatValue>
            {formatHorasEnSala(balance.horasEnSala)}
          </StyledWeekBannerStatValue>
          <StyledWeekBannerStatLabel>{t('therapist.week.statHoras')}</StyledWeekBannerStatLabel>
        </StyledWeekBannerStat>

        {balance.valoracionMedia > 0 && (
          <StyledWeekBannerStat>
            <StyledWeekBannerStatValue>
              {balance.valoracionMedia.toFixed(1)}
            </StyledWeekBannerStatValue>
            <StyledWeekBannerStatLabel>
              {t('therapist.week.statValoracion')}
            </StyledWeekBannerStatLabel>
          </StyledWeekBannerStat>
        )}
      </StyledWeekBannerStats>
    </StyledWeekBannerWrapper>
  );
};
