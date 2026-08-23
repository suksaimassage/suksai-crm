/**
 * FrequencyIndicator — Dot-scale visual showing a client's visit frequency.
 *
 * Accessibility: rendered as role="img" with a computed aria-label so the
 * dots are not read out individually by screen readers.
 */

import { useTranslation } from 'react-i18next';
import * as S from './FrequencyIndicator.styles';

interface IFrequencyIndicatorProps {
  readonly visitsPerMonth: number;
}

const MAX_DOTS = 5;

interface IFrequencyConfig {
  dots: number;
  labelKey: string;
}

function getFrequencyConfig(vpm: number): IFrequencyConfig {
  if (vpm >= 4) return { dots: 5, labelKey: 'frecuencia.semanal' };
  if (vpm >= 3) return { dots: 4, labelKey: 'frecuencia.frecuente' };
  if (vpm >= 2) return { dots: 3, labelKey: 'frecuencia.regular' };
  if (vpm >= 1) return { dots: 2, labelKey: 'frecuencia.mensual' };
  if (vpm > 0) return { dots: 1, labelKey: 'frecuencia.ocasional' };
  return { dots: 0, labelKey: 'frecuencia.sinDatos' };
}

export const FrequencyIndicator = ({ visitsPerMonth }: IFrequencyIndicatorProps) => {
  const { t } = useTranslation('clientes');
  const { dots, labelKey } = getFrequencyConfig(visitsPerMonth);
  const label = t(labelKey);

  return (
    <S.StyledFrequencyWrapper role="img" aria-label={`${t('filter.frecuencia')}: ${label}`}>
      <S.StyledDotsRow aria-hidden="true">
        {Array.from({ length: MAX_DOTS }).map((_, i) => (
          <S.StyledDot key={i} $filled={i < dots} />
        ))}
      </S.StyledDotsRow>
      <S.StyledFrequencyLabel>{label}</S.StyledFrequencyLabel>
    </S.StyledFrequencyWrapper>
  );
};
