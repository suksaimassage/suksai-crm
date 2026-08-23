import styled from 'styled-components';

// ─────────────────────────────────────────────────────────────
// CHART WRAPPER — constrains SVG and positions tooltip
// ─────────────────────────────────────────────────────────────

export const ChartRoot = styled.div`
  position: relative;
  width: 100%;
  /* SVG fills this div */
  & > svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
`;

// ─────────────────────────────────────────────────────────────
// LEGEND — sits below the SVG
// ─────────────────────────────────────────────────────────────

export const ChartLegend = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const ChartLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.secondary};
  user-select: none;
`;

export const ChartLegendSwatch = styled.span<{ $color: string }>`
  flex-shrink: 0;
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
`;
