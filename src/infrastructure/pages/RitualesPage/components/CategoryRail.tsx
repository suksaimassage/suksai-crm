import { useTranslation } from 'react-i18next';
import { Typography } from '@infra/components/ui/core/Typography';
import type { ITipoServicio } from '@domain/models';
import type { TTipoServicioId } from '@domain/types';
import { IcoCatAll } from './RitualesIcons';
import { getServiceIcon } from './rituales.utils';
import {
  StyledCategoryRail,
  StyledRailHeader,
  StyledCategoryRow,
  StyledCategoryIco,
  StyledCategoryLabel,
  StyledCategoryCount,
  StyledRailFooter,
  StyledRailSummaryRow,
  StyledRailSummaryLabel,
  StyledRailSummaryValue,
} from './CategoryRail.styles';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(price: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface ICategoryRailProps {
  readonly tipoServicios: readonly ITipoServicio[];
  readonly selectedCategoryId: TTipoServicioId | null;
  readonly onSelectCategory: (id: TTipoServicioId | null) => void;
  readonly categoryCounts: ReadonlyMap<TTipoServicioId, number>;
  readonly totalCount: number;
  readonly avgPrice: number;
  readonly locale: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const CategoryRail = ({
  tipoServicios,
  selectedCategoryId,
  onSelectCategory,
  categoryCounts,
  totalCount,
  avgPrice,
  locale,
}: ICategoryRailProps) => {
  const { t } = useTranslation(['rituales']);
  const allSelected = selectedCategoryId === null;

  return (
    <StyledCategoryRail
      role="listbox"
      aria-label={t('rituales:rail.ariaLabel')}
      aria-orientation="vertical"
    >
      <StyledRailHeader>
        <Typography variant="label" size="xs" weight="bold" color="secondary">
          {t('rituales:rail.title')}
        </Typography>
      </StyledRailHeader>

      {/* "All" row */}
      <StyledCategoryRow
        $selected={allSelected}
        role="option"
        aria-selected={allSelected}
        tabIndex={0}
        onClick={() => {
          onSelectCategory(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectCategory(null);
          }
        }}
      >
        <StyledCategoryIco aria-hidden="true">
          <IcoCatAll size={16} />
        </StyledCategoryIco>
        <StyledCategoryLabel $selected={allSelected}>{t('rituales:rail.all')}</StyledCategoryLabel>
        <StyledCategoryCount>{totalCount}</StyledCategoryCount>
      </StyledCategoryRow>

      {/* Per-category rows */}
      {tipoServicios.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const count = categoryCounts.get(cat.id) ?? 0;
        const iconNode = getServiceIcon(cat.nombre, 16);

        return (
          <StyledCategoryRow
            key={cat.id}
            $selected={isSelected}
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={() => {
              onSelectCategory(cat.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCategory(cat.id);
              }
            }}
          >
            <StyledCategoryIco aria-hidden="true">{iconNode}</StyledCategoryIco>
            <StyledCategoryLabel $selected={isSelected}>{cat.nombre}</StyledCategoryLabel>
            <StyledCategoryCount>{count}</StyledCategoryCount>
          </StyledCategoryRow>
        );
      })}

      <StyledRailFooter>
        <Typography variant="label" size="xs" weight="bold" color="secondary">
          {t('rituales:rail.summary.title')}
        </Typography>
        <StyledRailSummaryRow>
          <StyledRailSummaryLabel>{t('rituales:rail.summary.total')}</StyledRailSummaryLabel>
          <StyledRailSummaryValue>{totalCount}</StyledRailSummaryValue>
        </StyledRailSummaryRow>
        <StyledRailSummaryRow>
          <StyledRailSummaryLabel>{t('rituales:rail.summary.precioMedio')}</StyledRailSummaryLabel>
          <StyledRailSummaryValue>{formatPrice(avgPrice, locale)}</StyledRailSummaryValue>
        </StyledRailSummaryRow>
      </StyledRailFooter>
    </StyledCategoryRail>
  );
};
