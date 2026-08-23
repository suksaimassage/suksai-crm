/**
 * FrequencyIndicator.styles.ts
 */

import styled from 'styled-components';

export const StyledFrequencyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const StyledDotsRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 3px;
`;

export const StyledDot = styled.span<{ $filled: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $filled, theme }) =>
    $filled
      ? theme.color.intent.primary
      : 'oklch(0.82 0.02 67)'}; /* [TOKEN GAP] empty dot neutral, no exact token */
`;

export const StyledFrequencyLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-family: ${({ theme }) => theme.typography.font.body};
  color: ${({ theme }) => theme.color.text.secondary};
  white-space: nowrap;
`;
