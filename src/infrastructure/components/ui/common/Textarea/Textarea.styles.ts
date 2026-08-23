import styled from 'styled-components';

export const StyledTextareaWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const StyledTextarea = styled.textarea<{ $hasError?: boolean; $disabled?: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.md};
  color: ${({ theme }) => theme.color.text.primary};
  background: ${({ $disabled, theme }) =>
    $disabled === true ? theme.color.background.neutral : theme.color.background.card};
  border: 1px solid
    ${({ $hasError, theme }) =>
      $hasError === true ? theme.color.intent.error : theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  caret-color: ${({ theme }) => theme.color.intent.primary};
  resize: vertical;
  min-height: 72px;
  width: 100%;
  outline: none;
  line-height: 1.5;
  cursor: ${({ $disabled }) => ($disabled === true ? 'not-allowed' : 'text')};
  opacity: ${({ $disabled }) => ($disabled === true ? 0.65 : 1)};
  transition:
    border-color 200ms ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow 200ms ${({ theme }) => theme.transition.timing.easeOut},
    background-color 200ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled) {
      border-color: ${({ $hasError, theme }) =>
        $hasError === true ? theme.color.intent.error : theme.border.color.neutral.medium};
    }
  }

  &:focus-visible:not(:disabled) {
    border-color: ${({ $hasError, theme }) =>
      $hasError === true ? theme.color.intent.error : theme.color.intent.primary};
    box-shadow: inset 0 0 0 1px
      ${({ $hasError, theme }) =>
        $hasError === true ? theme.color.intent.error : theme.color.intent.primary};
  }

  &:disabled {
    background: ${({ theme }) => theme.color.background.neutral};
    color: ${({ theme }) => theme.color.text.disabled};
    cursor: not-allowed;
  }
`;

export const StyledCharCounter = styled.span<{ $atLimit?: boolean }>`
  display: block;
  text-align: right;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  margin-top: ${({ theme }) => theme.spacing.xxs};
  color: ${({ $atLimit, theme }) =>
    $atLimit === true ? theme.color.intent.error : theme.color.text.tertiary};
  transition: color 150ms ${({ theme }) => theme.transition.timing.easeOut};
`;
