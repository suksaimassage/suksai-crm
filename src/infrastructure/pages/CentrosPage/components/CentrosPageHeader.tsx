import { useTranslation } from 'react-i18next';
import { Button } from '@infra/components/ui/common/Button';
import { IcoPlusCircle } from './centros.icons';
import {
  StyledPageHeader,
  StyledPageMeta,
  StyledPageActions,
  StyledEyebrow,
  StyledH1,
  StyledH1Accent,
  StyledPageDescription,
} from './CentrosPageHeader.styles';

interface ICentrosPageHeaderProps {
  readonly centrosActivos: number;
  readonly salasTotales: number;
  readonly canAdd: boolean;
  readonly onAddCentro: () => void;
}

export const CentrosPageHeader = ({
  centrosActivos,
  salasTotales,
  canAdd,
  onAddCentro,
}: ICentrosPageHeaderProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <StyledPageHeader>
      <StyledPageMeta>
        <StyledEyebrow>
          {t('dashboard:centros.pageEyebrow', {
            centros: centrosActivos,
            salas: salasTotales,
          })}
        </StyledEyebrow>
        <StyledH1>
          {t('dashboard:centros.pageTitleBase')}{' '}
          <StyledH1Accent>{t('dashboard:centros.pageTitleAccent')}</StyledH1Accent>
        </StyledH1>
        <StyledPageDescription>{t('dashboard:centros.pageDescription')}</StyledPageDescription>
      </StyledPageMeta>
      <StyledPageActions>
        {canAdd && (
          <Button
            variant="solid"
            color="primary"
            onClick={onAddCentro}
            iconStart={<IcoPlusCircle />}
          >
            {t('dashboard:centros.actions.nuevo')}
          </Button>
        )}
      </StyledPageActions>
    </StyledPageHeader>
  );
};
