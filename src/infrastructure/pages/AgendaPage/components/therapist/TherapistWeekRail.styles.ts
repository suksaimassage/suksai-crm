import styled from 'styled-components';

export const StyledTherWeekRail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StyledTherWeekRailCard = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  border-radius: 14px;
  overflow: hidden;
`;

export const StyledTherWeekRailCardHeader = styled.div`
  padding: 12px 16px;
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
`;

export const StyledTherWeekRailCardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => (theme.isDark ? theme.color.brand.ink[500] : theme.color.brand.ink[900])};
  margin: 0;
`;

export const StyledTherWeekRailCardBody = styled.div`
  padding: 14px 16px;
`;

// ── Balance stats ─────────────────────────────────────────────────────────────

export const StyledTherWeekBalanceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const StyledTherWeekBalanceStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const StyledTherWeekBalanceStatValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: 300;
  line-height: 1;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[900]};
`;

export const StyledTherWeekBalanceStatLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
`;

// ── Upcoming appointment rows ─────────────────────────────────────────────────

export const StyledTherWeekUpcomingItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutralWarm[200]};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

export const StyledTherWeekUpcomingDate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32px;
  flex-shrink: 0;
`;

export const StyledTherWeekUpcomingDateDay = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[500]};
`;

export const StyledTherWeekUpcomingDateNum = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[900]};
`;

export const StyledTherWeekUpcomingMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StyledTherWeekUpcomingTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[900]};
  display: block;
`;

export const StyledTherWeekUpcomingService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  margin-top: 2px;
`;

export const StyledTherWeekEmpty = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  color: ${({ theme }) => theme.color.brand.ink[500]};
  margin: 0;
  padding: 4px 0;
`;
