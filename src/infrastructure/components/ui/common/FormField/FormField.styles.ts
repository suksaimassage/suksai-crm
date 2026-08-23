import styled from 'styled-components';

export const StyledFormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
`;

export const StyledLabel = styled.label`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledRequiredMark = styled.span`
  color: ${({ theme }) => theme.color.intent.error};
  margin-left: ${({ theme }) => theme.spacing.xxs};
`;

export const StyledMessageSlot = styled.div`
  min-height: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: flex-start;
`;

export const StyledHelperText = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  line-height: 1.4;
`;

export const StyledErrorText = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.error};
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
  animation: fadeIn 150ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StyledErrorIcon = styled.span`
  font-weight: ${({ theme }) => theme.typography.weight.bold};
`;
