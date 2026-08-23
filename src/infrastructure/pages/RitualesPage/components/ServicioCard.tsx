import { useTranslation } from 'react-i18next';
import { Tag } from '@infra/components/ui/common/Tag';
import type { IServicio } from '@domain/models';
import type { TServicioId } from '@domain/types';
import { getServiceIcon } from './rituales.utils';
import type { TTone } from './ServicioCard.styles';
import {
  StyledServicioCard,
  StyledCardHero,
  StyledCardGlyph,
  StyledStatusPill,
  StyledPricePill,
  StyledCardBody,
  StyledCardCode,
  StyledCardName,
  StyledCardDesc,
  StyledCardFooter,
  StyledDurationPill,
} from './ServicioCard.styles';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(price: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

function deriveServiceCode(tipoNombre: string, serviceId: TServicioId): string {
  const prefix = tipoNombre.slice(0, 2).toUpperCase();
  return `${prefix} · ${String(serviceId).padStart(2, '0')}`;
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface IServicioCardProps {
  readonly servicio: IServicio;
  readonly tipoNombre: string;
  readonly tone: TTone;
  readonly locale: string;
  readonly onEdit: (servicio: IServicio) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const ServicioCard = ({
  servicio,
  tipoNombre,
  tone,
  locale,
  onEdit,
}: IServicioCardProps) => {
  const { t } = useTranslation(['rituales']);
  const iconNode = getServiceIcon(tipoNombre, 32);
  const code = deriveServiceCode(tipoNombre, servicio.id);
  const formattedPrice = formatPrice(servicio.precioBase, locale);

  const statusColor =
    servicio.estado === 'activo'
      ? 'success'
      : servicio.estado === 'inactivo'
        ? 'warning'
        : 'neutral';

  const statusLabel =
    servicio.estado === 'activo'
      ? t('rituales:card.activo')
      : servicio.estado === 'inactivo'
        ? t('rituales:card.inactivo')
        : t('rituales:card.archivado');

  return (
    <StyledServicioCard
      $tone={tone}
      tabIndex={0}
      aria-label={t('rituales:card.editAriaLabel', { nombre: servicio.nombre })}
      onClick={() => {
        onEdit(servicio);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(servicio);
        }
      }}
    >
      <StyledCardHero $tone={tone}>
        <StyledCardGlyph $tone={tone} aria-hidden="true">
          {iconNode}
        </StyledCardGlyph>
        <StyledStatusPill>
          <Tag color={statusColor}>{statusLabel}</Tag>
        </StyledStatusPill>
        <StyledPricePill aria-hidden="true">{formattedPrice}</StyledPricePill>
      </StyledCardHero>

      <StyledCardBody>
        <div>
          <StyledCardCode>{code}</StyledCardCode>
          <StyledCardName>{servicio.nombre}</StyledCardName>
        </div>

        {servicio.descripcion !== null && <StyledCardDesc>{servicio.descripcion}</StyledCardDesc>}

        <StyledCardFooter>
          <StyledDurationPill>
            <i className="ph-light ph-clock" aria-hidden="true" />
            {servicio.duracionMinutos} min
          </StyledDurationPill>

          {servicio.tieneDescuento && servicio.porcentajeDescuento > 0 && (
            <Tag color="info">
              {t('rituales:card.descuento', { pct: servicio.porcentajeDescuento })}
            </Tag>
          )}

          {servicio.esBono && <Tag color="secondary">{t('rituales:card.bono')}</Tag>}
        </StyledCardFooter>
      </StyledCardBody>
    </StyledServicioCard>
  );
};
