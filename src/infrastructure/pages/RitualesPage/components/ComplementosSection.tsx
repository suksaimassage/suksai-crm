import { useTranslation } from 'react-i18next';
import { Typography } from '@infra/components/ui/core/Typography';
import type { IServicio, ITipoServicio } from '@domain/models';
import type { TTipoServicioId } from '@domain/types';
import { ServiceGridSection } from './ServiceGridSection';
import type { TTone } from './ServicioCard.styles';
import {
  StyledComplementosSection,
  StyledSectionDivider,
  StyledSectionTitle,
} from './ComplementosSection.styles';

// ── Props ──────────────────────────────────────────────────────────────────────

export interface IComplementosSectionProps {
  readonly complementos: readonly IServicio[];
  readonly tipoServicios: readonly ITipoServicio[];
  readonly categoryToneMap: ReadonlyMap<TTipoServicioId, TTone>;
  readonly searchQuery: string;
  readonly canAdd: boolean;
  readonly locale: string;
  readonly onAddNew: () => void;
  readonly onEdit: (servicio: IServicio) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const ComplementosSection = ({
  complementos,
  tipoServicios,
  categoryToneMap,
  searchQuery,
  canAdd,
  locale,
  onAddNew,
  onEdit,
}: IComplementosSectionProps) => {
  const { t } = useTranslation(['rituales']);

  return (
    <StyledComplementosSection aria-labelledby="complementos-heading">
      <StyledSectionDivider>
        <StyledSectionTitle id="complementos-heading">
          <Typography variant="headline" size="xl" as="h2">
            {t('rituales:complementos.title')} <em>{t('rituales:complementos.titleAccent')}</em>
          </Typography>
          <Typography variant="body" size="sm" color="secondary">
            {t('rituales:complementos.subtitle')}
          </Typography>
        </StyledSectionTitle>
      </StyledSectionDivider>

      <ServiceGridSection
        servicios={complementos}
        tipoServicios={tipoServicios}
        categoryToneMap={categoryToneMap}
        searchQuery={searchQuery}
        canAdd={canAdd}
        locale={locale}
        onAddNew={onAddNew}
        onEdit={onEdit}
      />
    </StyledComplementosSection>
  );
};
