import { useTranslation } from 'react-i18next';
import { Button } from '@infra/components/ui/common/Button';
import {
  StyledPageHeader,
  StyledPageMeta,
  StyledPageActions,
  StyledEyebrow,
  StyledH1,
  StyledH1Accent,
  StyledPageDescription,
} from './RitualesPageHeader.styles';

// ── Props ──────────────────────────────────────────────────────────────────────

export interface IRitualesPageHeaderProps {
  readonly onNewRitual: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const RitualesPageHeader = ({ onNewRitual }: IRitualesPageHeaderProps) => {
  const { t } = useTranslation(['rituales']);

  return (
    <StyledPageHeader>
      <StyledPageMeta>
        <StyledEyebrow>{t('rituales:page.eyebrow')}</StyledEyebrow>
        <StyledH1>
          {t('rituales:page.title')}{' '}
          <StyledH1Accent>{t('rituales:page.titleAccent')}</StyledH1Accent>
        </StyledH1>
        <StyledPageDescription>{t('rituales:page.description')}</StyledPageDescription>
      </StyledPageMeta>

      <StyledPageActions>
        <Button variant="solid" color="primary" onClick={onNewRitual}>
          <i className="ph-light ph-plus" aria-hidden="true" />
          {t('rituales:page.newBtn')}
        </Button>
      </StyledPageActions>
    </StyledPageHeader>
  );
};
