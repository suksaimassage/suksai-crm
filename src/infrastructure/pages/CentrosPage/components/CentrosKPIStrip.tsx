// Uses the DS KPIStrip compound component — no local styled primitives needed.
// Decision: DS KPIStrip.Cell API (icon, label, value) fully covers the local
// CentrosKPIStrip (icon + label + value). The DS cell padding differs slightly
// (lg/xl vs local 20px/22px) but is visually equivalent at the token scale.
// pattern from mem-search: CentrosPage redesign — KPI strip connected-card pattern

import { useTranslation } from 'react-i18next';
import { KPIStrip } from '@infra/components/ui/common/KPI';
import { IcoBuilding, IcoDoor, IcoActivity, IcoWrench } from './centros.icons';

interface ICentrosKPIStripProps {
  readonly centrosActivos: number;
  readonly salasTotales: number;
  readonly ocupacionHoyPct: number;
  readonly enMantenimiento: number;
  readonly isLoading: boolean;
}

export const CentrosKPIStrip = ({
  centrosActivos,
  salasTotales,
  ocupacionHoyPct,
  enMantenimiento,
  isLoading,
}: ICentrosKPIStripProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <KPIStrip aria-label={t('dashboard:centros.kpi.ariaLabel', 'Network KPIs')}>
      <KPIStrip.Cell
        icon={<IcoBuilding />}
        label={t('dashboard:centros.kpi.centrosActivos')}
        value={isLoading ? '–' : String(centrosActivos)}
      />
      <KPIStrip.Cell
        icon={<IcoDoor />}
        label={t('dashboard:centros.kpi.salasTotales')}
        value={isLoading ? '–' : String(salasTotales)}
      />
      <KPIStrip.Cell
        icon={<IcoActivity />}
        label={t('dashboard:centros.kpi.ocupacionHoy')}
        value={isLoading ? '–' : `${ocupacionHoyPct}%`}
      />
      <KPIStrip.Cell
        icon={<IcoWrench />}
        label={t('dashboard:centros.kpi.enMantenimiento')}
        value={isLoading ? '–' : String(enMantenimiento)}
      />
    </KPIStrip>
  );
};
