import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaKpi } from '@domain/models/agenda.models';
import { StyledAdminKpis } from '../../views/AdminAgendaView.styles';
import { AgendaKpiCard } from './AgendaKpiCard';

interface IAgendaKpiStripProps {
  readonly kpis: readonly IAgendaKpi[];
}

export const AgendaKpiStrip = ({ kpis }: IAgendaKpiStripProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  return (
    <StyledAdminKpis role="list" aria-label={t('kpi.stripAriaLabel')}>
      {kpis.map((kpi) => (
        <AgendaKpiCard key={kpi.id} kpi={kpi} />
      ))}
    </StyledAdminKpis>
  );
};
