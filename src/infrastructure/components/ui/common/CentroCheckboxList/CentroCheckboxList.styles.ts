import styled, { keyframes } from 'styled-components';

export const StyledCentroCheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledListLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledHelpText = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
`;

// Row that pairs a centro's checkbox (left) with its "principal" radio (right).
export const StyledCentroRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

// Trailing "Principal" radio slot — dims itself when the centro is unchecked.
export const StyledPrincipalSlot = styled.div<{ readonly $disabled: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: opacity ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};
`;

export const StyledScrollBox = styled.div`
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing.xs};
  scrollbar-width: thin;
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const StyledEmptyText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
  margin: 0;
`;

const shimmer = keyframes`
  0%   { opacity: 0.6; }
  50%  { opacity: 1;   }
  100% { opacity: 0.6; }
`;

export const StyledSkeletonRow = styled.div`
  height: 28px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) => theme.color.background.neutral};
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;
