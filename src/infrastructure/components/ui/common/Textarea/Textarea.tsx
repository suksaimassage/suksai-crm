import { useState } from 'react';
import { StyledTextareaWrapper, StyledTextarea, StyledCharCounter } from './Textarea.styles';

export interface ITextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id'
> {
  readonly id: string;
  readonly hasError?: boolean;
  readonly maxLength?: number;
  readonly showCounter?: boolean;
  readonly ref?: React.Ref<HTMLTextAreaElement>;
}

export const Textarea = ({
  id,
  hasError = false,
  maxLength,
  showCounter = false,
  defaultValue,
  value,
  onChange,
  disabled,
  ref,
  ...rest
}: ITextareaProps) => {
  const [internalLength, setInternalLength] = useState(() => {
    const initial = value ?? defaultValue;
    return typeof initial === 'string' ? initial.length : 0;
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalLength(e.target.value.length);
    onChange?.(e);
  };

  const showCount = showCounter || maxLength !== undefined;
  const atLimit = maxLength !== undefined && internalLength >= maxLength;
  const counterId = `${id}-counter`;

  return (
    <StyledTextareaWrapper>
      <StyledTextarea
        id={id}
        ref={ref}
        $hasError={hasError}
        $disabled={disabled}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-invalid={hasError || undefined}
        aria-describedby={showCount ? counterId : undefined}
        {...rest}
      />
      {showCount && (
        <StyledCharCounter id={counterId} $atLimit={atLimit} aria-live="polite">
          {internalLength} / {maxLength ?? '∞'}
        </StyledCharCounter>
      )}
    </StyledTextareaWrapper>
  );
};
