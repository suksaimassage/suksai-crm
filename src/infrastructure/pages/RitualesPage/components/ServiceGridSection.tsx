import { useTranslation } from 'react-i18next';
import { Typography } from '@infra/components/ui/core/Typography';
import type { IServicio, ITipoServicio } from '@domain/models';
import type { TTipoServicioId } from '@domain/types';
import { ServicioCard } from './ServicioCard';
import type { TTone } from './ServicioCard.styles';
import {
  StyledServiceGrid,
  StyledAddCard,
  StyledAddCardInner,
  StyledAddCardIcon,
  StyledGridEmpty,
  StyledGridEmptyIcon,
  StyledGridEmptyTitle,
  StyledGridEmptyDesc,
  StyledSkeletonCard,
  StyledSkeletonHero,
  StyledSkeletonBody,
} from './ServicioCard.styles';
import { StyledSkeletonRect } from '../RitualesPage.styles';

// ── Skeleton ───────────────────────────────────────────────────────────────────

interface ISkeletonGridProps {
  readonly label: string;
}

export const SkeletonGrid = ({ label }: ISkeletonGridProps) => (
  <StyledServiceGrid aria-busy="true" aria-label={label}>
    {[0, 1, 2, 3].map((i) => (
      <StyledSkeletonCard key={i}>
        <StyledSkeletonHero />
        <StyledSkeletonBody>
          <StyledSkeletonRect $width="60px" $height="10px" />
          <StyledSkeletonRect $width="80%" $height="18px" />
          <StyledSkeletonRect $width="100%" $height="12px" />
          <StyledSkeletonRect $width="90%" $height="12px" />
          <StyledSkeletonRect $width="50px" $height="26px" />
        </StyledSkeletonBody>
      </StyledSkeletonCard>
    ))}
  </StyledServiceGrid>
);

// ── Coming-soon ────────────────────────────────────────────────────────────────

interface IComingSoonGridProps {
  readonly message: string;
}

export const ComingSoonGrid = ({ message }: IComingSoonGridProps) => (
  <StyledServiceGrid>
    <StyledGridEmpty>
      <StyledGridEmptyIcon className="ph-light ph-clock-countdown" aria-hidden="true" />
      <StyledGridEmptyTitle>{message}</StyledGridEmptyTitle>
    </StyledGridEmpty>
  </StyledServiceGrid>
);

// ── ServiceGridSection ────────────────────────────────────────────────────────

export interface IServiceGridSectionProps {
  readonly servicios: readonly IServicio[];
  readonly tipoServicios: readonly ITipoServicio[];
  readonly categoryToneMap: ReadonlyMap<TTipoServicioId, TTone>;
  readonly searchQuery: string;
  readonly canAdd: boolean;
  readonly locale: string;
  readonly onAddNew: () => void;
  readonly onEdit: (servicio: IServicio) => void;
}

export const ServiceGridSection = ({
  servicios,
  tipoServicios,
  categoryToneMap,
  searchQuery,
  canAdd,
  locale,
  onAddNew,
  onEdit,
}: IServiceGridSectionProps) => {
  const { t } = useTranslation(['rituales']);

  const tipoMap = new Map<TTipoServicioId, ITipoServicio>(
    tipoServicios.map((cat) => [cat.id, cat]),
  );

  if (servicios.length === 0 && searchQuery.trim() !== '') {
    return (
      <StyledServiceGrid
        id="rituales-grid"
        role="tabpanel"
        aria-label={t('rituales:grid.ariaLabel')}
      >
        <StyledGridEmpty>
          <StyledGridEmptyIcon className="ph-light ph-magnifying-glass" aria-hidden="true" />
          <StyledGridEmptyTitle>
            {t('rituales:empty.noResults', { query: searchQuery })}
          </StyledGridEmptyTitle>
          <StyledGridEmptyDesc>{t('rituales:empty.noResultsDesc')}</StyledGridEmptyDesc>
        </StyledGridEmpty>
      </StyledServiceGrid>
    );
  }

  if (servicios.length === 0) {
    return (
      <StyledServiceGrid
        id="rituales-grid"
        role="tabpanel"
        aria-label={t('rituales:grid.ariaLabel')}
      >
        <StyledGridEmpty>
          <StyledGridEmptyIcon className="ph-light ph-leaf" aria-hidden="true" />
          <StyledGridEmptyTitle>{t('rituales:empty.noData')}</StyledGridEmptyTitle>
          <StyledGridEmptyDesc>{t('rituales:empty.noDataDesc')}</StyledGridEmptyDesc>
        </StyledGridEmpty>
      </StyledServiceGrid>
    );
  }

  return (
    <StyledServiceGrid id="rituales-grid" role="tabpanel" aria-label={t('rituales:grid.ariaLabel')}>
      {servicios.map((servicio) => {
        const tipo = tipoMap.get(servicio.tipoServicioId);
        const tipoNombre = tipo?.nombre ?? '';
        const tone = categoryToneMap.get(servicio.tipoServicioId) ?? 'default';

        return (
          <ServicioCard
            key={servicio.id}
            servicio={servicio}
            tipoNombre={tipoNombre}
            tone={tone}
            locale={locale}
            onEdit={onEdit}
          />
        );
      })}

      {canAdd && (
        <StyledAddCard
          type="button"
          aria-label={t('rituales:grid.addNew')}
          title={t('rituales:page.comingSoon')}
          onClick={onAddNew}
        >
          <StyledAddCardInner>
            <StyledAddCardIcon className="ph-light ph-plus-circle" aria-hidden="true" />
            <Typography variant="label" size="sm" weight="bold">
              {t('rituales:grid.addNew')}
            </Typography>
            <Typography variant="body" size="xs" color="secondary">
              {t('rituales:grid.addNewDesc')}
            </Typography>
          </StyledAddCardInner>
        </StyledAddCard>
      )}
    </StyledServiceGrid>
  );
};
