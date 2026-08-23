/**
 * EntityModal.styles.ts — Shared styled primitives for all entity CRUD modals.
 */
import styled from 'styled-components';

export const StyledFormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledErrorBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.intent.errorZone};
  border: 1px solid ${({ theme }) => theme.color.intent.errorSubtle};
`;

export const StyledErrorBannerText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.intent.error};
  margin: 0;
`;

export const StyledFooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledContextBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) => theme.color.background.neutral};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledContextBadgeLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledContextBadgeValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledConditionalField = styled.div<{ readonly $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`;

export const StyledFieldError = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.intent.error};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const StyledFormRowAsymmetric = styled.div`
  display: grid;
  grid-template-columns: minmax(80px, 1fr) 2fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledModalDividerSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border.color.neutral.subtle};
  padding-top: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const StyledCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;

  &:hover {
    background: ${({ theme }) => theme.color.background.neutral};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.94);
    transition: transform 100ms ease-out;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

export const StyledFormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const StyledFooterLeft = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledOptionalHint = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.muted};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

export const StyledReadOnlyHint = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  margin-top: ${({ theme }) => theme.spacing.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
