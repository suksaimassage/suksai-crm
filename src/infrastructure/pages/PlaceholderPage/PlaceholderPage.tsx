import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface IPlaceholderPageProps {
  /** Pre-resolved label literal. Prefer `labelKey` for language-reactive labels. */
  readonly label?: string;
  /**
   * Key under `dashboard:breadcrumbs.*` (e.g. 'ajustes'). When provided, the label
   * is resolved with `t()` inside the component and takes precedence over `label`.
   */
  readonly labelKey?: string;
}

const StyledPlaceholder = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 480px;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StyledHeading = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: 300;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.md};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
`;

export function PlaceholderPage({ label, labelKey }: IPlaceholderPageProps) {
  const { t } = useTranslation('common');
  // Resolve inside the component so the label reacts to language switches.
  // `labelKey` (a dashboard breadcrumb key) wins; otherwise use a literal `label`,
  // falling back to the generic "coming soon" copy.
  const displayLabel = labelKey
    ? t(`dashboard:breadcrumbs.${labelKey}`)
    : (label ?? t('comingSoon'));

  return (
    <StyledPlaceholder>
      <StyledHeading>{displayLabel}</StyledHeading>
      <StyledSubtitle>{t('comingSoonSub')}</StyledSubtitle>
    </StyledPlaceholder>
  );
}
