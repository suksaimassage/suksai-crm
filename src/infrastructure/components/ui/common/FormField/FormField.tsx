import type { ReactNode } from 'react';
import {
  StyledErrorIcon,
  StyledErrorText,
  StyledFormField,
  StyledHelperText,
  StyledLabel,
  StyledMessageSlot,
  StyledRequiredMark,
} from './FormField.styles';
import { VisuallyHidden } from '@infra/components/ui/shared/VisuallyHidden';

export interface IFieldControlProps {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-required'?: boolean;
}

export interface IFormFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly required?: boolean;
  readonly requiredAriaSuffix?: string;
  readonly children: (controlProps: IFieldControlProps) => ReactNode;
}

export const FormField = ({
  id,
  label,
  helperText,
  errorText,
  required = false,
  requiredAriaSuffix = 'obligatorio',
  children,
}: IFormFieldProps) => {
  const hasError = Boolean(errorText);
  const helperId = helperText && !hasError ? `${id}-helper` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  const controlProps: IFieldControlProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': hasError || undefined,
    'aria-required': required || undefined,
  };

  return (
    <StyledFormField>
      <StyledLabel htmlFor={id}>
        {label}
        {required ? (
          <>
            <StyledRequiredMark aria-hidden="true">*</StyledRequiredMark>
            <VisuallyHidden> {requiredAriaSuffix}</VisuallyHidden>
          </>
        ) : null}
      </StyledLabel>
      {children(controlProps)}
      <StyledMessageSlot>
        {hasError ? (
          <StyledErrorText id={errorId} role="alert">
            <StyledErrorIcon aria-hidden="true">!</StyledErrorIcon>
            {errorText}
          </StyledErrorText>
        ) : helperText ? (
          <StyledHelperText id={helperId}>{helperText}</StyledHelperText>
        ) : null}
      </StyledMessageSlot>
    </StyledFormField>
  );
};
