import { useTranslation } from 'react-i18next';
import {
  StyledRitualesKPIStrip,
  StyledRitualesKPICell,
  StyledRitualesKPIIco,
  StyledRitualesKPIText,
  StyledRitualesKPILabel,
  StyledRitualesKPIValue,
  StyledRitualesKPINd,
  StyledRitualesSkeletonKPICell,
} from './RitualesKPIStrip.styles';
import { IcoKpiLotus, IcoKpiBamboo, IcoKpiPetals, IcoKpiCalendar } from './RitualesIcons';
import { StyledSkeletonRect } from '../RitualesPage.styles';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(price: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface IRitualesKPIStripProps {
  readonly kpiActivos: number;
  readonly kpiPrecioMedio: number;
  readonly kpiCategorias: number;
  readonly kpiReservasMes: number | null;
  readonly locale: string;
  readonly isLoading: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const RitualesKPIStrip = ({
  kpiActivos,
  kpiPrecioMedio,
  kpiCategorias,
  kpiReservasMes,
  locale,
  isLoading,
}: IRitualesKPIStripProps) => {
  const { t } = useTranslation(['rituales']);

  if (isLoading) {
    return (
      <StyledRitualesKPIStrip aria-busy="true" aria-label={t('rituales:loading.kpis')}>
        {[0, 1, 2, 3].map((i) => (
          <StyledRitualesSkeletonKPICell key={i}>
            <StyledSkeletonRect $width="42px" $height="42px" />
            <StyledRitualesKPIText>
              <StyledSkeletonRect $width="80px" $height="11px" />
              <StyledSkeletonRect $width="50px" $height="30px" />
            </StyledRitualesKPIText>
          </StyledRitualesSkeletonKPICell>
        ))}
      </StyledRitualesKPIStrip>
    );
  }

  return (
    <StyledRitualesKPIStrip>
      <StyledRitualesKPICell>
        <StyledRitualesKPIIco aria-hidden="true">
          <IcoKpiLotus />
        </StyledRitualesKPIIco>
        <StyledRitualesKPIText>
          <StyledRitualesKPILabel>{t('rituales:kpi.activos')}</StyledRitualesKPILabel>
          <StyledRitualesKPIValue>{kpiActivos}</StyledRitualesKPIValue>
        </StyledRitualesKPIText>
      </StyledRitualesKPICell>

      <StyledRitualesKPICell>
        <StyledRitualesKPIIco aria-hidden="true">
          <IcoKpiBamboo />
        </StyledRitualesKPIIco>
        <StyledRitualesKPIText>
          <StyledRitualesKPILabel>{t('rituales:kpi.precioMedio')}</StyledRitualesKPILabel>
          <StyledRitualesKPIValue>{formatPrice(kpiPrecioMedio, locale)}</StyledRitualesKPIValue>
        </StyledRitualesKPIText>
      </StyledRitualesKPICell>

      <StyledRitualesKPICell>
        <StyledRitualesKPIIco aria-hidden="true">
          <IcoKpiPetals />
        </StyledRitualesKPIIco>
        <StyledRitualesKPIText>
          <StyledRitualesKPILabel>{t('rituales:kpi.categorias')}</StyledRitualesKPILabel>
          <StyledRitualesKPIValue>{kpiCategorias}</StyledRitualesKPIValue>
        </StyledRitualesKPIText>
      </StyledRitualesKPICell>

      <StyledRitualesKPICell>
        <StyledRitualesKPIIco aria-hidden="true">
          <IcoKpiCalendar />
        </StyledRitualesKPIIco>
        <StyledRitualesKPIText>
          <StyledRitualesKPILabel>{t('rituales:kpi.reservasMes')}</StyledRitualesKPILabel>
          {kpiReservasMes !== null ? (
            <StyledRitualesKPIValue>{kpiReservasMes}</StyledRitualesKPIValue>
          ) : (
            <StyledRitualesKPINd
              title={t('rituales:kpi.ndDescription')}
              aria-label={t('rituales:kpi.ndDescription')}
            >
              {t('rituales:kpi.ndLabel')}
            </StyledRitualesKPINd>
          )}
        </StyledRitualesKPIText>
      </StyledRitualesKPICell>
    </StyledRitualesKPIStrip>
  );
};
