import styled from 'styled-components';

export const StyledCategoryRail = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
  /* Mobile: estático para que el rail no se superponga al grid de servicios al hacer scroll */
  position: static;

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    position: sticky;
    top: calc(56px + 48px + 16px);
    align-self: start;
  }
`;

export const StyledRailHeader = styled.div`
  padding: 14px 18px;
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  background: ${({ theme }) => theme.color.background.light};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StyledCategoryRow = styled.div<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  padding: 12px 18px;
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  cursor: pointer;
  position: relative;
  transition: background ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};
  background: ${({ theme, $selected }) =>
    $selected ? theme.color.intent.primary + '0a' : 'transparent'};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: ${({ theme, $selected }) =>
      $selected ? theme.color.intent.primary : 'transparent'};
    transition: background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease};
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.color.background.neutral};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: -2px;
  }
`;

export const StyledCategoryIco = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.intent.primary};
  display: grid;
  place-items: center;
  font-size: 14px;
  flex-shrink: 0;
`;

export const StyledCategoryLabel = styled.span<{ $selected: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme, $selected }) =>
    $selected ? theme.color.intent.primary : theme.color.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledCategoryCount = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.text.secondary};
  flex-shrink: 0;
`;

export const StyledRailFooter = styled.div`
  padding: 16px 18px;
  border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  background: ${({ theme }) => theme.color.background.light};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledRailSummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StyledRailSummaryLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledRailSummaryValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-style: italic;
  color: ${({ theme }) => theme.color.text.primary};
`;
