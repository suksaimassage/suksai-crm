import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

export const StyledDialogBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  text-align: center;
`;

export const StyledDialogIconZone = styled.div<{ $state: 'safe' | 'warning' }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $state, theme }) =>
    $state === 'warning'
      ? `color-mix(in oklch, ${theme.color.intent.error} 10%, transparent)`
      : `color-mix(in oklch, ${theme.color.intent.warning} 10%, transparent)`};
  color: ${({ $state, theme }) =>
    $state === 'warning' ? theme.color.intent.error : theme.color.intent.warning};
`;

export const StyledDialogBodyText = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1.6;
  max-width: 65ch;
`;

export const StyledCountBold = styled.strong`
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.intent.error};
`;

export const StyledInlineErrorBanner = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.color.intent.errorZone};
  border: 1px solid ${({ theme }) => theme.color.intent.errorSubtle};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  color: ${({ theme }) => theme.color.intent.error};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  text-align: left;
`;

export const StyledDialogLiveRegion = styled.div`
  display: contents;
`;

export const StyledSkeletonBlock = styled.div<{ $w?: string; $h?: string; $circle?: boolean }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  border-radius: ${({ $circle, theme }) => ($circle === true ? '50%' : theme.border.radius.sm)};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.background.neutral} 25%,
    ${({ theme }) => theme.color.background.card} 50%,
    ${({ theme }) => theme.color.background.neutral} 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
`;
