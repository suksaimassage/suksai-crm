import styled from 'styled-components';

export const StyledTherapistSelectorWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  max-width: 320px;
`;

/** Accessible-name label for the Select, visually hidden (Designer §1.9 sr-only). */
export const StyledHiddenLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const StyledSelectorHint = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  margin: 0;
`;
