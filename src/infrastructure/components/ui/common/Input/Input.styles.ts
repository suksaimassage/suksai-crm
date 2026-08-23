import styled, { css } from 'styled-components';

export type TInputSize = 'sm' | 'md' | 'lg';

export interface IStyledInputProps {
  readonly $size: TInputSize;
  readonly $hasError: boolean;
  readonly $hasLeadingSlot: boolean;
  readonly $hasTrailingSlot: boolean;
}

const sizeMap: Record<TInputSize, { height: string; paddingX: string; fontSize: string }> = {
  sm: { height: '36px', paddingX: '12px', fontSize: '0.875rem' },
  md: { height: '44px', paddingX: '14px', fontSize: '1rem' },
  lg: { height: '52px', paddingX: '16px', fontSize: '1.125rem' },
};

const SLOT_WIDTH = '40px';

export const StyledInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const StyledLeadingSlot = styled.span`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${SLOT_WIDTH};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.text.muted};
  pointer-events: none;
`;

export const StyledTrailingSlot = styled.span`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: ${SLOT_WIDTH};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledInput = styled.input<IStyledInputProps>`
  width: 100%;
  height: ${({ $size }) => sizeMap[$size].height};
  padding-left: ${({ $size, $hasLeadingSlot }) =>
    $hasLeadingSlot ? SLOT_WIDTH : sizeMap[$size].paddingX};
  padding-right: ${({ $size, $hasTrailingSlot }) =>
    $hasTrailingSlot ? SLOT_WIDTH : sizeMap[$size].paddingX};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ $size }) => sizeMap[$size].fontSize};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.text.primary};
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} solid
    ${({ theme, $hasError }) =>
      $hasError ? theme.color.intent.error : theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  caret-color: ${({ theme }) => theme.color.intent.primary};
  outline: none;
  transition:
    border-color 200ms ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow 200ms ${({ theme }) => theme.transition.timing.easeOut},
    background-color 200ms ${({ theme }) => theme.transition.timing.easeOut};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.placeholder};
    opacity: 1;
  }

  &::selection {
    background: ${({ theme }) => theme.color.intent.primary};
    color: ${({ theme }) => theme.color.text.inverse};
  }

  &:hover:not(:disabled):not(:read-only) {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.color.intent.error : theme.border.color.neutral.medium};
  }

  &:focus-visible {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.color.intent.error : theme.color.intent.primary};
    box-shadow: inset 0 0 0 1px
      ${({ theme, $hasError }) =>
        $hasError ? theme.color.intent.error : theme.color.intent.primary};
    outline: none;
  }

  &:disabled {
    background: ${({ theme }) => theme.color.background.neutral};
    color: ${({ theme }) => theme.color.text.disabled};
    cursor: not-allowed;
  }

  &:read-only {
    background: ${({ theme }) => theme.color.background.neutral};
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: ${({ theme }) => theme.color.text.primary};
    -webkit-box-shadow: 0 0 0 1000px ${({ theme }) => theme.color.background.card} inset;
    transition: background-color 9999s ease-in-out 0s;
  }

  ${({ $size }) =>
    ($size === 'sm' || $size === 'md') &&
    css`
      @media (max-width: 767px) {
        font-size: 16px;
      }
    `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
