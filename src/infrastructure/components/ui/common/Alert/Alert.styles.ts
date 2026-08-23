import styled from 'styled-components';

export type TAlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface IStyledAlertProps {
  readonly $variant: TAlertVariant;
}

const zoneKey: Record<TAlertVariant, 'errorZone' | 'successZone' | 'warningZone' | 'infoZone'> = {
  error: 'errorZone',
  success: 'successZone',
  warning: 'warningZone',
  info: 'infoZone',
};

export const StyledAlert = styled.div<IStyledAlertProps>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $variant }) => theme.color.intent[zoneKey[$variant]]};
  border: ${({ theme }) => theme.border.width.xs} solid
    ${({ theme, $variant }) =>
      `color-mix(in oklch, ${theme.color.intent[$variant]} 35%, transparent)`};
  border-radius: ${({ theme }) => theme.border.radius.md};
  animation: fadeIn 200ms ${({ theme }) => theme.transition.timing.easeOut};

  &:focus-visible {
    outline: 2px solid ${({ theme, $variant }) => theme.color.intent[$variant]};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StyledAlertIcon = styled.span<IStyledAlertProps>`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  font-size: ${({ theme }) => theme.typography.size.lg};
  color: ${({ theme, $variant }) => theme.color.intent[$variant]};
`;

export const StyledAlertContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const StyledAlertTitle = styled.div`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.md};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.3;
`;

export const StyledAlertBody = styled.div`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1.5;
`;

export const StyledAlertDismiss = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color.text.muted};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.typography.size.lg};
  line-height: 1;

  &:hover {
    background: ${({ theme }) => theme.color.background.neutral};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const variantToRole: Record<TAlertVariant, 'alert' | 'status'> = {
  error: 'alert',
  warning: 'alert',
  success: 'status',
  info: 'status',
};

export const variantToGlyph = (variant: TAlertVariant): string => {
  if (variant === 'success') return '✓';
  if (variant === 'info') return 'i';
  return '!';
};
