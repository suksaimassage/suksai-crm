import styled from 'styled-components';

export const StyledLegalToc = styled.nav`
  width: 100%;
`;

export const StyledLegalTocLabel = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const StyledLegalTocList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledLegalTocLink = styled.a`
  display: block;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.text.secondary};
  text-decoration: none;
  transition:
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
    background: ${({ theme }) => (theme.isDark ? 'oklch(0.23 0.04 204)' : 'oklch(0.95 0.02 67)')};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: -2px;
  }
`;
