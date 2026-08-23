/**
 * RitualesKPIStrip.styles.ts
 *
 * Local styled primitives for the Rituales KPI strip.
 *
 * WHY NOT DS KPIStrip?
 * The DS KPIStrip.Cell only accepts `value: string | number`. The
 * "Bookings / month" cell needs a custom N/A node (<StyledKPINd>) with a
 * distinct aria-label for accessibility (WCAG 1.4.3 / 4.1.2). Adding that
 * slot would require modifying the shared DS component — which is read-only.
 * The local styles are visually identical to the DS internals (same tokens,
 * same geometry) so users see no difference.
 */

import styled from 'styled-components';

export const StyledRitualesKPIStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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

export const StyledRitualesKPICell = styled.div`
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
`;

export const StyledRitualesKPIIco = styled.div`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledRitualesKPIText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledRitualesKPILabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1;
`;

export const StyledRitualesKPIValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 30px;
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
`;

export const StyledRitualesKPINd = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.tertiary};
  font-style: italic;
`;

// ── Skeleton variants ──────────────────────────────────────────────────────────

export const StyledRitualesSkeletonKPICell = styled.div`
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};

  &:last-child {
    border-right: none;
  }
`;
