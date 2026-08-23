import styled from 'styled-components';

export const StyledWeekBannerWrapper = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 28px 32px;
  min-height: 148px;
  background: ${({ theme }) =>
    `radial-gradient(ellipse at 15% 50%, ${theme.color.brand.gold.bgHero}, transparent 50%),
     linear-gradient(135deg, ${theme.color.brand.jungle[900]} 0%, ${theme.color.brand.jungle[700]} 100%)`};
  border-radius: 18px;
  overflow: hidden;
`;

export const StyledWeekBannerTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: 300;
  color: ${({ theme }) => theme.color.brand.gold[50]};
  margin: 0;
  line-height: 1.15;
`;

export const StyledWeekBannerSub = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  color: ${({ theme }) => theme.color.brand.gold[300]};
  margin: 4px 0 0;
  letter-spacing: 0.02em;
`;

export const StyledWeekBannerStats = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
`;

export const StyledWeekBannerStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

export const StyledWeekBannerStatValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: 300;
  line-height: 1;
  color: ${({ theme }) => theme.color.brand.gold[50]};
`;

export const StyledWeekBannerStatLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.brand.gold[300]};
`;
