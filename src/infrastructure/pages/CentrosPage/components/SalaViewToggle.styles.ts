import styled from 'styled-components';

export const StyledViewToggle = styled.div`
  display: inline-flex;
  gap: 2px; /* [TOKEN GAP] */
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  padding: 3px; /* [TOKEN GAP] */
  border-radius: ${({ theme }) => theme.border.radius.full};
`;

export const StyledViewToggleButton = styled.button<{
  readonly $active: boolean;
  readonly $disabled: boolean;
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px; /* [TOKEN GAP] */
  padding: 6px 12px; /* [TOKEN GAP] */
  border-radius: ${({ theme }) => theme.border.radius.full};
  border: none;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px; /* [TOKEN GAP] */
  font-weight: 600;
  background: ${({ theme, $active }) => ($active ? theme.color.background.card : 'transparent')};
  box-shadow: ${({ theme, $active }) => ($active ? theme.effect.elevation.raised : 'none')};
  color: ${({ theme, $active }) =>
    $active ? theme.color.text.primary : theme.color.text.secondary};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition:
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease},
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;
