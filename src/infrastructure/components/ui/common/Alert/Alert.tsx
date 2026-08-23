import type { ReactNode, Ref } from 'react';
import {
  StyledAlert,
  StyledAlertBody,
  StyledAlertContent,
  StyledAlertDismiss,
  StyledAlertIcon,
  StyledAlertTitle,
  variantToGlyph,
  variantToRole,
  type TAlertVariant,
} from './Alert.styles';
import { VisuallyHidden } from '@infra/components/ui/shared/VisuallyHidden';

export interface IAlertProps {
  readonly variant?: TAlertVariant;
  readonly title?: string;
  readonly children: ReactNode;
  readonly onDismiss?: () => void;
  readonly dismissLabel?: string;
  readonly ref?: Ref<HTMLDivElement>;
  readonly id?: string;
}

export const Alert = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  dismissLabel = 'Descartar',
  ref,
  id,
}: IAlertProps) => {
  const role = variantToRole[variant];
  return (
    <StyledAlert
      ref={ref}
      id={id}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      tabIndex={-1}
      $variant={variant}
    >
      <StyledAlertIcon $variant={variant} aria-hidden="true">
        {variantToGlyph(variant)}
      </StyledAlertIcon>
      <StyledAlertContent>
        {title ? <StyledAlertTitle>{title}</StyledAlertTitle> : null}
        <StyledAlertBody>{children}</StyledAlertBody>
      </StyledAlertContent>
      {onDismiss ? (
        <StyledAlertDismiss type="button" onClick={onDismiss}>
          <span aria-hidden="true">×</span>
          <VisuallyHidden>{dismissLabel}</VisuallyHidden>
        </StyledAlertDismiss>
      ) : null}
    </StyledAlert>
  );
};
