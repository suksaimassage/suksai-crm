import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Spinner } from '@infra/components/ui/common/Spinner';
import { Heading } from '@infra/components/ui/shared/Heading';

const StyledSplash = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.color.background.neutral};
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const BootstrapSplash = () => {
  const { t } = useTranslation('common');

  return (
    <StyledSplash role="status" aria-live="polite" aria-busy="true" aria-label={t('loading')}>
      <Heading level={1} visualSize="headline" tone="muted" align="center" aria-hidden="true">
        Suksai Thai Massage
      </Heading>
      <Spinner size="lg" tone="primary" />
    </StyledSplash>
  );
};
