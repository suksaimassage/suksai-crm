import styled from 'styled-components';

export const StyledComplementosSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

export const StyledSectionDivider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.border.color.neutral.subtle};
  }
`;

export const StyledSectionTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
  flex-shrink: 0;
`;
