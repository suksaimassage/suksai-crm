import styled from 'styled-components';

export const StyledCenterListCard = styled.div`
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.card : theme.color.neutralWarm[50]};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
`;

export const StyledSidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledSidebarTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledSidebarTitleAccent = styled.em`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledSidebarCount = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
`;

export const StyledCenterListItem = styled.button<{
  readonly $selected: boolean;
  readonly $inactive: boolean;
}>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background: ${({ theme, $selected }) =>
    $selected
      ? theme.isDark
        ? theme.border.color.neutral.light
        : theme.border.color.neutral.subtle
      : theme.color.intent.primary + '0d'};
  border: none;
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  box-shadow: ${({ theme, $selected }) =>
    $selected ? `inset 3px 0 0 ${theme.color.accent.secondary}` : 'none'};
  text-align: left;
  cursor: pointer;
  transition: background 150ms ease; /* [TOKEN GAP] inline duration */
  opacity: ${({ $inactive }) => ($inactive ? 0.55 : 1)};

  &:last-child {
    border-bottom: none;
  }

  &:hover:not([aria-pressed='true']) {
    background: ${({ theme, $inactive }) =>
      $inactive ? 'transparent' : theme.color.background.neutral};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: -2px;
  }
`;

export const StyledCenterAvatarSquare = styled.div<{ readonly $colorIndex: number }>`
  width: 40px; /* [TOKEN GAP] no 40px size token */
  height: 40px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.border.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: 700;
  /* [TOKEN GAP] no avatar color palette in theme — cycling available semantic colors */
  background: ${({ $colorIndex, theme }) => {
    const palette = [
      theme.color.accent.secondary,
      theme.color.background.dark,
      theme.color.background.dark,
      theme.color.background.dark,
      theme.color.text.tertiary,
    ];
    return palette[$colorIndex % 5];
  }};
  color: ${({ $colorIndex, theme }) =>
    $colorIndex % 5 === 0 ? theme.color.text.primary : theme.color.text.inverse};
`;

export const StyledCenterItemBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px; /* [TOKEN GAP] */
`;

export const StyledCenterItemName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
`;

export const StyledCenterItemNameAccent = styled.em`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledCenterItemMeta = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.secondary};
  display: block;
`;

export const StyledCenterItemStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: 2px; /* [TOKEN GAP] */
`;

export const StyledCenterItemStatText = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledCenterItemStatIcon = styled.span`
  color: ${({ theme }) => theme.color.text.tertiary};
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

export const StyledCenterItemRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px; /* [TOKEN GAP] */
  flex-shrink: 0;
`;

export const StyledCenterOccupancy = styled.span<{ readonly $hasIncident: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 700;
  color: ${({ theme, $hasIncident }) =>
    $hasIncident ? theme.color.intent.warning : theme.color.text.primary};
`;

export const StyledCenterTodayLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  color: ${({ theme }) => theme.color.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const StyledSidebarFooter = styled.div`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
`;

export const StyledInactiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  line-height: 1;
  background: ${({ theme }) => theme.color.background.neutral};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.medium};
  border-radius: ${({ theme }) => theme.border.radius.full};
  color: ${({ theme }) => theme.color.text.disabled};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  padding: ${({ theme }) => `${theme.spacing.xxs} ${theme.spacing.xs}`};
`;

export const StyledEmptyList = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.color.text.disabled};
  min-height: 120px;
`;
