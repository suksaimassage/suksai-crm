import styled from 'styled-components';

export const StyledToolbar = styled.div`
  display: flex;
  /* Mobile: tabs arriba, acciones abajo */
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
`;

export const StyledToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: auto;
    flex: 1 1 auto;
  }
`;

export const StyledTabStrip = styled.div`
  /* Mobile: full-width para que los pills envuelvan DENTRO del strip */
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px;
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  padding: 4px;
  border-radius: ${({ theme }) => theme.border.radius.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: inline-flex;
    flex-wrap: nowrap;
    width: auto;
    border-radius: ${({ theme }) => theme.border.radius.full};
  }
`;

export const StyledTab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: ${({ theme, $active }) =>
    $active
      ? theme.isDark
        ? theme.border.color.neutral.light
        : theme.color.background.card
      : 'transparent'};
  box-shadow: ${({ theme, $active }) => ($active ? theme.effect.elevation.raised : 'none')};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.md};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: 600;
  color: ${({ theme, $active }) =>
    $active ? theme.color.text.primary : theme.color.text.secondary};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease},
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: 8px 14px; /* [TOKEN GAP] */
    font-size: 12.5px; /* [TOKEN GAP] */
    border-radius: ${({ theme }) => theme.border.radius.full};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledTabCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledSearchWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  height: 38px;
  padding: 0 14px;
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  /* Mobile: full-width debajo del strip */
  width: 100%;
  min-width: 0;
  transition: border-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: auto;
    min-width: 260px;
  }

  &:focus-within {
    border-color: ${({ theme }) => theme.color.intent.primary};
  }
`;

export const StyledSearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  color: ${({ theme }) => theme.color.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.placeholder};
  }
`;

export const StyledSearchIcon = styled.i`
  flex-shrink: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.color.text.secondary};
`;
