import { useTranslation } from 'react-i18next';
import {
  StyledSpinnerVisual,
  StyledSpinnerWrapper,
  type TSpinnerSize,
  type TSpinnerTone,
} from './Spinner.styles';

export interface ISpinnerProps {
  readonly size?: TSpinnerSize;
  readonly tone?: TSpinnerTone;
  readonly label?: string;
}

export const Spinner = ({ size = 'md', tone = 'inherit', label }: ISpinnerProps) => {
  const { t } = useTranslation('common');
  const ariaLabel = label ?? t('loading');
  return (
    <StyledSpinnerWrapper role="status" aria-label={ariaLabel}>
      <StyledSpinnerVisual $size={size} $tone={tone} aria-hidden="true" />
    </StyledSpinnerWrapper>
  );
};
