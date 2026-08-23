import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaTherapistWeekDay, IAgendaWeekBalance } from '@domain/models/agenda.models';
import { formatHorasEnSala } from '@infra/utils/agenda.utils';
import {
  StyledTherWeekRail,
  StyledTherWeekRailCard,
  StyledTherWeekRailCardHeader,
  StyledTherWeekRailCardTitle,
  StyledTherWeekRailCardBody,
  StyledTherWeekBalanceGrid,
  StyledTherWeekBalanceStat,
  StyledTherWeekBalanceStatValue,
  StyledTherWeekBalanceStatLabel,
  StyledTherWeekUpcomingItem,
  StyledTherWeekUpcomingDate,
  StyledTherWeekUpcomingDateDay,
  StyledTherWeekUpcomingDateNum,
  StyledTherWeekUpcomingMeta,
  StyledTherWeekUpcomingTime,
  StyledTherWeekUpcomingService,
  StyledTherWeekEmpty,
} from './TherapistWeekRail.styles';

interface ITherapistWeekRailProps {
  readonly weekDays: readonly IAgendaTherapistWeekDay[];
  readonly balance: IAgendaWeekBalance;
}

export const TherapistWeekRail = ({
  weekDays,
  balance,
}: ITherapistWeekRailProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  // Upcoming = appointments from today onwards (not past)
  const upcomingAppts = weekDays
    .filter((d) => !d.isPast || d.isToday)
    .flatMap((d) =>
      d.appointments
        .filter((a) => a.timelineState === 'pending' || a.timelineState === 'now')
        .map((a) => ({ ...a, dateStr: d.dateStr, dayLabel: d.label, dayNumber: d.dateNumber })),
    )
    .slice(0, 5);

  return (
    <StyledTherWeekRail aria-label={t('therapist.myWeek')}>
      {/* Balance card */}
      <StyledTherWeekRailCard>
        <StyledTherWeekRailCardHeader>
          <StyledTherWeekRailCardTitle>
            {t('therapist.week.railBalance')}
          </StyledTherWeekRailCardTitle>
        </StyledTherWeekRailCardHeader>
        <StyledTherWeekRailCardBody>
          <StyledTherWeekBalanceGrid>
            <StyledTherWeekBalanceStat>
              <StyledTherWeekBalanceStatValue>{balance.citasTotal}</StyledTherWeekBalanceStatValue>
              <StyledTherWeekBalanceStatLabel>
                {t('therapist.week.statCitas')}
              </StyledTherWeekBalanceStatLabel>
            </StyledTherWeekBalanceStat>
            <StyledTherWeekBalanceStat>
              <StyledTherWeekBalanceStatValue>
                {balance.citasCompletadas}
              </StyledTherWeekBalanceStatValue>
              <StyledTherWeekBalanceStatLabel>
                {t('therapist.week.statCompletadas')}
              </StyledTherWeekBalanceStatLabel>
            </StyledTherWeekBalanceStat>
            <StyledTherWeekBalanceStat>
              <StyledTherWeekBalanceStatValue>
                {formatHorasEnSala(balance.horasEnSala)}
              </StyledTherWeekBalanceStatValue>
              <StyledTherWeekBalanceStatLabel>
                {t('therapist.week.statHoras')}
              </StyledTherWeekBalanceStatLabel>
            </StyledTherWeekBalanceStat>
            {balance.valoracionMedia > 0 && (
              <StyledTherWeekBalanceStat>
                <StyledTherWeekBalanceStatValue>
                  {balance.valoracionMedia.toFixed(1)}
                </StyledTherWeekBalanceStatValue>
                <StyledTherWeekBalanceStatLabel>
                  {t('therapist.week.statValoracion')}
                </StyledTherWeekBalanceStatLabel>
              </StyledTherWeekBalanceStat>
            )}
          </StyledTherWeekBalanceGrid>
        </StyledTherWeekRailCardBody>
      </StyledTherWeekRailCard>

      {/* Upcoming card */}
      <StyledTherWeekRailCard>
        <StyledTherWeekRailCardHeader>
          <StyledTherWeekRailCardTitle>
            {t('therapist.week.railUpcoming')}
          </StyledTherWeekRailCardTitle>
        </StyledTherWeekRailCardHeader>
        <StyledTherWeekRailCardBody>
          {upcomingAppts.length === 0 ? (
            <StyledTherWeekEmpty>{t('therapist.week.noAppointments')}</StyledTherWeekEmpty>
          ) : (
            upcomingAppts.map((appt) => (
              <StyledTherWeekUpcomingItem key={`${appt.dateStr}-${appt.id}`}>
                <StyledTherWeekUpcomingDate>
                  <StyledTherWeekUpcomingDateDay>{appt.dayLabel}</StyledTherWeekUpcomingDateDay>
                  <StyledTherWeekUpcomingDateNum>{appt.dayNumber}</StyledTherWeekUpcomingDateNum>
                </StyledTherWeekUpcomingDate>
                <StyledTherWeekUpcomingMeta>
                  <StyledTherWeekUpcomingTime>
                    {appt.startTime}–{appt.endTime}
                  </StyledTherWeekUpcomingTime>
                  <StyledTherWeekUpcomingService>{appt.serviceName}</StyledTherWeekUpcomingService>
                </StyledTherWeekUpcomingMeta>
              </StyledTherWeekUpcomingItem>
            ))
          )}
        </StyledTherWeekRailCardBody>
      </StyledTherWeekRailCard>

      {/* This week summary card */}
      <StyledTherWeekRailCard>
        <StyledTherWeekRailCardHeader>
          <StyledTherWeekRailCardTitle>
            {t('therapist.week.railThisWeek')}
          </StyledTherWeekRailCardTitle>
        </StyledTherWeekRailCardHeader>
        <StyledTherWeekRailCardBody>
          <StyledTherWeekBalanceGrid>
            {weekDays.map((d) => (
              <StyledTherWeekBalanceStat key={d.dateStr}>
                <StyledTherWeekBalanceStatValue>{d.citaCount}</StyledTherWeekBalanceStatValue>
                <StyledTherWeekBalanceStatLabel>
                  {d.label} {d.dateNumber}
                </StyledTherWeekBalanceStatLabel>
              </StyledTherWeekBalanceStat>
            ))}
          </StyledTherWeekBalanceGrid>
        </StyledTherWeekRailCardBody>
      </StyledTherWeekRailCard>
    </StyledTherWeekRail>
  );
};
