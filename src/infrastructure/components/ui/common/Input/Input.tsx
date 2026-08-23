import type { ReactNode, Ref, InputHTMLAttributes } from 'react';
import {
  StyledInput,
  StyledInputWrapper,
  StyledLeadingSlot,
  StyledTrailingSlot,
  type TInputSize,
} from './Input.styles';

export interface IInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly id: string;
  readonly inputSize?: TInputSize;
  readonly hasError?: boolean;
  readonly leadingSlot?: ReactNode;
  readonly trailingSlot?: ReactNode;
  readonly ref?: Ref<HTMLInputElement>;
}

export const Input = ({
  id,
  inputSize = 'md',
  hasError = false,
  leadingSlot,
  trailingSlot,
  ref,
  ...rest
}: IInputProps) => (
  <StyledInputWrapper>
    {leadingSlot ? <StyledLeadingSlot aria-hidden="true">{leadingSlot}</StyledLeadingSlot> : null}
    <StyledInput
      ref={ref}
      id={id}
      $size={inputSize}
      $hasError={hasError}
      $hasLeadingSlot={Boolean(leadingSlot)}
      $hasTrailingSlot={Boolean(trailingSlot)}
      aria-invalid={hasError || undefined}
      {...rest}
    />
    {trailingSlot ? <StyledTrailingSlot>{trailingSlot}</StyledTrailingSlot> : null}
  </StyledInputWrapper>
);
