/**
 * SegmentoBadge — Visual indicator for a client's lifecycle segment.
 *
 * Accessibility: the badge is presentational text — no additional ARIA
 * attributes are needed because the label is readable as text.
 */

import { useTranslation } from 'react-i18next';
import type { TClienteSegmento } from '@infra/pages/ClientesPage/Clientes.types';
import * as S from './SegmentoBadge.styles';

interface ISegmentoBadgeProps {
  readonly segment: TClienteSegmento;
  readonly size?: 'sm' | 'md';
}

const SEGMENT_CONFIG: Record<TClienteSegmento, { glyph: string; i18nKey: string }> = {
  vip: { glyph: '☆', i18nKey: 'segmento.vip' },
  activo: { glyph: '●', i18nKey: 'segmento.activo' },
  nuevo: { glyph: '◈', i18nKey: 'segmento.nuevo' },
  en_riesgo: { glyph: '△', i18nKey: 'segmento.en_riesgo' },
  inactivo: { glyph: '—', i18nKey: 'segmento.inactivo' },
} as const;

export const SegmentoBadge = ({ segment, size = 'md' }: ISegmentoBadgeProps) => {
  const { t } = useTranslation('clientes');
  const config = SEGMENT_CONFIG[segment];
  return (
    <S.StyledSegmentoBadge $segment={segment} $size={size}>
      <S.StyledSegmentoGlyph aria-hidden="true">{config.glyph}</S.StyledSegmentoGlyph>
      {t(config.i18nKey)}
    </S.StyledSegmentoBadge>
  );
};
