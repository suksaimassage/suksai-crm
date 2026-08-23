import styled from 'styled-components';

export const StyledAgendaMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  min-height: 0;
  padding: 28px 32px 40px;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg}
      ${({ theme }) => theme.spacing.xl};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.md}
      ${({ theme }) => theme.spacing.lg};
  }
`;

export const StyledPageHead = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

export const StyledPageHeadTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const StyledPageEyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.tertiary : theme.color.brand.ink[500])};
`;

export const StyledPageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: 300;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.ink[900])};
  margin: 0;
  line-height: 1.2;

  em {
    font-style: italic;
    color: ${({ theme }) =>
      theme.isDark ? theme.color.brand.gold[400] : theme.color.brand.gold[700]};
  }
`;

export const StyledRoleToggle = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px;
  gap: 2px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  background: ${({ theme }) => theme.color.background.card};
  box-shadow: ${({ theme }) => theme.effect.shadow.outer.xs};
`;

export const StyledRoleToggleTab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px 9px 14px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  min-height: 44px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 500;
  transition:
    background 200ms,
    color 200ms;

  background: ${({ $active, theme }) => ($active ? theme.color.brand.jungle[900] : 'transparent')};
  color: ${({ $active, theme }) =>
    $active
      ? theme.color.brand.gold[400]
      : theme.isDark
        ? theme.color.text.secondary
        : theme.color.brand.ink[500]};

  &:hover:not([data-active='true']) {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.neutral : theme.color.neutralWarm[100]};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledRoleToggleBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  margin-left: 2px;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.neutral : theme.color.neutralWarm[100]};
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[500])};
`;
