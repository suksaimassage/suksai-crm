import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@infra/components/ui/common/Avatar';
import type {
  IAgendaAppointment,
  IAgendaAlert,
  IAgendaLegendItem,
  IAgendaTherapist,
} from '@domain/models/agenda.models';
import type { TCitaId } from '@domain/types';
import {
  StyledRail,
  StyledRailPanel,
  StyledRailPanelTitle,
  StyledPendingItem,
  StyledPendingHead,
  StyledPendingClientName,
  StyledPendingMeta,
  StyledPendingMetaLine,
  StyledPendingActions,
  StyledPendingBtn,
  StyledAlertItem,
  StyledAlertDot,
  StyledAlertGlyph,
  StyledAlertContent,
  StyledAlertTitle,
  StyledAlertMessage,
  StyledLegendItem,
  StyledLegendDot,
  StyledLegendLabel,
} from './AgendaAdminRail.styles';

interface IAgendaAdminRailProps {
  readonly pendingAppointments: readonly IAgendaAppointment[];
  readonly alerts: readonly IAgendaAlert[];
  readonly legendItems: readonly IAgendaLegendItem[];
  readonly therapists: readonly IAgendaTherapist[];
  /** True when the user may mutate citas — hides Confirmar/Reasignar otherwise. */
  readonly canManage: boolean;
  /** Cita being optimistically confirmed — dims its row. */
  readonly optimisticId: TCitaId | null;
  readonly onConfirm: (id: TCitaId) => void;
  readonly onReassign: (id: TCitaId) => void;
}

/** Maps alert type → non-color glyph paired with the coloured dot. */
const ALERT_GLYPH: Record<string, string> = {
  double_booking: '⚠',
  cancellation: '✕',
  warning: 'ℹ',
  missing_schedule: '📅',
};

const DOW_SHORT: Record<number, string> = {
  0: 'DOM',
  1: 'LUN',
  2: 'MAR',
  3: 'MIÉ',
  4: 'JUE',
  5: 'VIE',
  6: 'SÁB',
};

export const AgendaAdminRail = ({
  pendingAppointments,
  alerts,
  legendItems,
  therapists,
  canManage,
  optimisticId,
  onConfirm,
  onReassign,
}: IAgendaAdminRailProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const therapistsById = new Map(therapists.map((th) => [th.id, th]));
  const todayDow = DOW_SHORT[new Date().getDay()] ?? '';

  return (
    <StyledRail>
      {/* aria-live region announces count changes to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {t('rail.pendingCount', { n: pendingAppointments.length })}
      </div>

      <StyledRailPanel aria-labelledby="rail-pending-title">
        <StyledRailPanelTitle id="rail-pending-title">
          {t('rail.pendingTitle')}
          {pendingAppointments.length > 0 && (
            <> · {t('rail.pendingCount', { n: pendingAppointments.length })}</>
          )}
        </StyledRailPanelTitle>

        {pendingAppointments.length === 0 ? (
          <StyledPendingMeta>{t('rail.noPending')}</StyledPendingMeta>
        ) : (
          pendingAppointments.map((appt) => {
            const therapist =
              appt.therapistId !== null ? therapistsById.get(appt.therapistId) : undefined;
            const therapistName = therapist
              ? `${therapist.nombre}${therapist.apellidos ? ' ' + therapist.apellidos : ''}`
              : '—';
            const isUrgent = appt.timelineState === 'now';
            return (
              <StyledPendingItem key={appt.id} $optimistic={optimisticId === appt.id}>
                <StyledPendingHead>
                  <Avatar name={appt.clientName ?? t('rail.sinCliente')} size="sm" />
                  <StyledPendingClientName>
                    {appt.clientName ?? t('rail.sinCliente')}
                  </StyledPendingClientName>
                </StyledPendingHead>
                <StyledPendingMeta>
                  {appt.serviceName} · {appt.durationMin} min
                </StyledPendingMeta>
                <StyledPendingMetaLine $urgent={isUrgent}>
                  {isUrgent
                    ? t('rail.metaUrgent', {
                        day: todayDow,
                        time: appt.startTime,
                        therapist: therapistName,
                      })
                    : t('rail.meta', {
                        day: todayDow,
                        time: appt.startTime,
                        therapist: therapistName,
                      })}
                </StyledPendingMetaLine>
                {canManage && (
                  <StyledPendingActions>
                    <StyledPendingBtn
                      $primary
                      onClick={() => {
                        onConfirm(appt.id);
                      }}
                      aria-label={`${t('rail.confirm')} ${appt.clientName ?? t('rail.sinCliente')}`}
                    >
                      {t('rail.confirm')}
                    </StyledPendingBtn>
                    <StyledPendingBtn
                      onClick={() => {
                        onReassign(appt.id);
                      }}
                      aria-label={`${t('rail.reassign')} ${appt.clientName ?? t('rail.sinCliente')}`}
                    >
                      {t('rail.reassign')}
                    </StyledPendingBtn>
                  </StyledPendingActions>
                )}
              </StyledPendingItem>
            );
          })
        )}
      </StyledRailPanel>

      {alerts.length > 0 && (
        <StyledRailPanel aria-labelledby="rail-alerts-title">
          <StyledRailPanelTitle id="rail-alerts-title">
            {t('rail.alertsTitle')}
          </StyledRailPanelTitle>
          {alerts.map((alert) => (
            <StyledAlertItem key={alert.id} $type={alert.type} role="alert">
              {/* dot + glyph communicate type without relying on color alone (WCAG 1.4.1) */}
              <StyledAlertDot
                $type={alert.type}
                role="img"
                aria-label={t(`rail.alertType.${alert.type}`)}
              />
              <StyledAlertGlyph aria-hidden="true">
                {ALERT_GLYPH[alert.type] ?? 'ℹ'}
              </StyledAlertGlyph>
              <StyledAlertContent>
                <StyledAlertTitle>{alert.title}</StyledAlertTitle>
                <StyledAlertMessage>{alert.message}</StyledAlertMessage>
              </StyledAlertContent>
            </StyledAlertItem>
          ))}
        </StyledRailPanel>
      )}

      <StyledRailPanel aria-labelledby="rail-legend-title">
        <StyledRailPanelTitle id="rail-legend-title">{t('rail.legendTitle')}</StyledRailPanelTitle>
        {legendItems.map((item) => (
          <StyledLegendItem key={item.variant}>
            <StyledLegendDot $variant={item.variant} aria-hidden="true" />
            <StyledLegendLabel>{item.label}</StyledLegendLabel>
          </StyledLegendItem>
        ))}
      </StyledRailPanel>
    </StyledRail>
  );
};
