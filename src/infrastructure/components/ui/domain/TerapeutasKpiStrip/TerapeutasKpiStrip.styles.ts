/**
 * TerapeutasKpiStrip.styles.ts
 *
 * 4-cell KPI strip at the top of the Terapeutas page.
 * Visual language replicated from RitualesPage: one bordered card surface with
 * internal hairline dividers, icon-box LEFT + text column (label above value).
 * All values from theme tokens — no hardcoded colors.
 */

import styled from 'styled-components';
import { shimmerAnim } from '../TerapeutaCard/TerapeutaCard.styles';

export const StyledKpiStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
  /* Bottom rhythm so the strip never sits flush against the toolbar — matches
     StyledPageHeader / StyledToolbar (spacing.xl). The strip lives INSIDE the
     Directorio tab panel; Tabs "enclosed" inset padding handles the bar→strip
     gap, so only this bottom margin (strip→toolbar) is applied here. */
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledKpiCell = styled.div`
  padding: 20px 22px;
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
  }
`;

export const StyledKpiIco = styled.div`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledKpiText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const StyledKpiLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1;
`;

export const StyledKpiValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 30px;
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
`;

export const StyledKpiValueFraction = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1rem;
  color: ${({ theme }) => theme.color.text.muted};
  margin-left: 4px;
`;

export const StyledKpiNd = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
  font-style: italic;
`;

export const StyledKpiSkeleton = styled.div`
  height: 24px;
  width: 60%;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.color.background.neutral} 25%, ${theme.color.background.card} 50%, ${theme.color.background.neutral} 75%)`};
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.4s linear infinite;
`;
