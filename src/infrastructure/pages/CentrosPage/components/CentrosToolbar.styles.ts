import styled from 'styled-components';

export const StyledToolbar = styled.div`
  display: flex;
  /* Mobile: pila tabs arriba, acciones abajo */
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
  /* Hereda el ancho completo cuando el padre es column en mobile */
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: auto;
    flex-wrap: wrap;
  }
`;

export const StyledToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

export const StyledPillTabStrip = styled.div`
  /* Mobile: full-width + wrap para que los pills no salgan del contenedor */
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px; /* [TOKEN GAP] no 4px spacing token */
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

export const StyledPillTab = styled.button<{ readonly $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px; /* [TOKEN GAP] no 6px spacing token */
  border: none;
  background: ${({ theme, $active }) =>
    $active
      ? theme.isDark
        ? theme.border.color.neutral.light
        : theme.color.background.card
      : 'transparent'};
  box-shadow: ${({ theme, $active }) => ($active ? theme.effect.elevation.raised : 'none')};
  /* Mobile: padding compacto */
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

export const StyledTabCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px; /* [TOKEN GAP] no 18px size token */
  height: 18px;
  padding: 0 5px; /* [TOKEN GAP] no 5px spacing token */
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-size: 10px; /* [TOKEN GAP] no 10px typography token */
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledToolbarSearchWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  height: 38px; /* [TOKEN GAP] no 38px size token */
  padding: 0 14px; /* [TOKEN GAP] no 14px spacing token */
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  min-width: 260px; /* [TOKEN GAP] no layout.searchWidth token */
  transition: border-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};

  &:focus-within {
    border-color: ${({ theme }) => theme.color.intent.primary};
  }
`;

export const StyledToolbarSearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px; /* [TOKEN GAP] no 13px typography token */
  color: ${({ theme }) => theme.color.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.placeholder};
  }
`;
