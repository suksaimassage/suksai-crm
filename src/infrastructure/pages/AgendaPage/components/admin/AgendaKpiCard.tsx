import React from 'react';
import type { IAgendaKpi } from '@domain/models/agenda.models';
import {
  StyledKpiMiniCard,
  StyledKpiMiniLabel,
  StyledKpiMiniValue,
  StyledKpiMiniSub,
} from '../../views/AdminAgendaView.styles';

interface IAgendaKpiCardProps {
  readonly kpi: IAgendaKpi;
}

export const AgendaKpiCard = ({ kpi }: IAgendaKpiCardProps): React.ReactElement => {
  const valueDisplay =
    kpi.denominator !== null ? (
      <>
        {kpi.value}
        <em>/{kpi.denominator}</em>
      </>
    ) : kpi.unit !== null ? (
      <>
        {kpi.value.toLocaleString('es-ES')}
        <em> {kpi.unit}</em>
      </>
    ) : (
      <>{kpi.value}</>
    );

  return (
    <StyledKpiMiniCard $accent={kpi.isAccent} aria-label={kpi.label}>
      <StyledKpiMiniLabel $accent={kpi.isAccent}>{kpi.label}</StyledKpiMiniLabel>
      <StyledKpiMiniValue $accent={kpi.isAccent}>{valueDisplay}</StyledKpiMiniValue>
      {kpi.subtext !== null && (
        <StyledKpiMiniSub $accent={kpi.isAccent}>{kpi.subtext}</StyledKpiMiniSub>
      )}
    </StyledKpiMiniCard>
  );
};
