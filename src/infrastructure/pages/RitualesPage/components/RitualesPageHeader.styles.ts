import styled from 'styled-components';

export const StyledPageHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

export const StyledPageMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledPageActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`;

export const StyledEyebrow = styled.p`
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.intent.primary};
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.font.body};
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 10px;

  &::before {
    content: '';
    display: block;
    width: 24px;
    height: 1px;
    background: ${({ theme }) => theme.color.intent.primary};
    flex-shrink: 0;
  }
`;

export const StyledH1 = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: 400;
  font-size: 42px;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
`;

export const StyledH1Accent = styled.span`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledPageDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
  max-width: 480px;
`;
