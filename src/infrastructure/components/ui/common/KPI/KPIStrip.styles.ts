import styled from 'styled-components';

// ─── KPIStrip ─────────────────────────────────────────────────────────────────
// Horizontal "connected card" strip of KPI cells separated by inner dividers.
// The number of columns is driven by the cell count (defaults to auto-fit).
// Responsive: 4 → 2 → 1 columns at the standard breakpoints.

export const StyledKPIStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

// ─── KPIStripCell ─────────────────────────────────────────────────────────────
// Individual cell: optional icon left + label/value text column.

export const StyledKPIStripCell = styled.div`
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};

  &:last-child {
    border-right: none;
  }

  @media (max-width: 900px) {
    border-bottom: ${({ theme }) => theme.border.width.xs}
      ${({ theme }) => theme.border.style.solid} ${({ theme }) => theme.border.color.neutral.subtle};

    &:nth-child(2),
    &:last-child {
      border-right: none;
    }
  }

  @media (max-width: 480px) {
    border-right: none;

    &:last-child {
      border-bottom: none;
    }
  }
`;

export const StyledKPIStripIcon = styled.div`
  width: 42px; /* [TOKEN GAP] no 42px size token */
  height: 42px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.border.radius.lg};
  display: grid;
  place-items: center;
  font-size: 22px; /* [TOKEN GAP] no 22px typography token */
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledKPIStripText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px; /* [TOKEN GAP] no 2px spacing token */
`;

export const StyledKPIStripLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px; /* [TOKEN GAP] no 10.5px typography token */
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1;
`;

export const StyledKPIStripValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 30px; /* [TOKEN GAP] no 30px typography token */
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
`;
