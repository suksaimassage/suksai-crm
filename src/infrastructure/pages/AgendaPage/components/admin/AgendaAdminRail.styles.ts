import styled from 'styled-components';
import type { TTheme } from '@infra/styles/themes/light.theme';

export const StyledRail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StyledRailPanel = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  padding: 18px 18px 16px;
`;

export const StyledRailPanelTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: 400;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.ink[900])};
  margin: 0 0 12px;
  line-height: 1.3;

  em {
    font-style: italic;
    color: ${({ theme }) =>
      theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
  }
`;

export const StyledPendingItem = styled.div<{ $optimistic?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.border.color.neutral.light};
  opacity: ${({ $optimistic }) => ($optimistic ? 0.6 : 1)};
  transition: opacity 200ms ${({ theme }) => theme.transition.timing.easeOut};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Avatar + name row at the top of a pending item. */
export const StyledPendingHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledPendingClientName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.ink[900])};
`;

/** "JUE 14:30 · CON SOM · VENCE EN 1 H" caption (§1.10). */
export const StyledPendingMetaLine = styled.span<{ $urgent?: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ $urgent, theme }) =>
    $urgent
      ? theme.color.brand.clay[600]
      : theme.isDark
        ? theme.color.text.muted
        : theme.color.brand.ink[500]};
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

export const StyledPendingMeta = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
`;

export const StyledPendingActions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 4px;
`;

export const StyledPendingBtn = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 6px 10px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms;
  border: 1px solid
    ${({ $primary, theme }) =>
      $primary ? theme.color.brand.gold[300] : theme.border.color.neutral.light};
  background: ${({ $primary, theme }) =>
    $primary ? theme.color.brand.gold[50] : theme.color.background.card};
  color: ${({ $primary, theme }) =>
    $primary
      ? theme.isDark
        ? theme.color.brand.gold[300]
        : theme.color.brand.gold[700]
      : theme.isDark
        ? theme.color.text.muted
        : theme.color.brand.ink[500]};

  &:hover {
    background: ${({ $primary, theme }) =>
      $primary
        ? theme.color.brand.gold[100]
        : theme.isDark
          ? theme.color.background.elevated
          : theme.color.neutralWarm[100]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledAlertItem = styled.div<{ $type: string }>`
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.border.color.neutral.light};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

function alertDotColor($type: string, theme: TTheme): string {
  switch ($type) {
    case 'double_booking':
      return theme.color.error[500];
    case 'cancellation':
      return theme.color.warning[400];
    default:
      return theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500];
  }
}

export const StyledAlertDot = styled.span<{ $type: string }>`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 4px;
  background: ${({ $type, theme }) => alertDotColor($type, theme)};
`;

/** Non-color glyph paired with the alert dot (WCAG 1.4.1). */
export const StyledAlertGlyph = styled.span`
  font-size: 12px;
  line-height: 1;
  margin-top: 1px;
  flex-shrink: 0;
`;

export const StyledAlertContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledAlertTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.ink[900])};
`;

export const StyledAlertMessage = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  line-height: 1.4;
`;

export const StyledLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
`;

function legendDotBg($variant: string, theme: TTheme): string {
  switch ($variant) {
    case 'gold':
      return theme.color.brand.gold.bg;
    case 'jungle':
      return theme.color.brand.jungle.bg;
    case 'clay':
      return theme.color.brand.clay.bg;
    case 'lotus':
      return theme.color.brand.lotus.bg;
    case 'pending':
      return theme.color.background.light;
    case 'break':
      return 'transparent';
    default:
      return theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[100];
  }
}

function legendDotBorderColor($variant: string, theme: TTheme): string {
  switch ($variant) {
    case 'gold':
      return theme.color.brand.gold.border;
    case 'jungle':
      return theme.color.brand.jungle.border;
    case 'clay':
      return theme.color.brand.clay.border;
    case 'lotus':
      return theme.color.brand.lotus.border;
    case 'pending':
      return theme.color.brand.gold.pendingBorder;
    default:
      return theme.border.color.neutral.medium;
  }
}

export const StyledLegendDot = styled.span<{ $variant: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid;
  background: ${({ $variant, theme }) => legendDotBg($variant, theme)};
  border-color: ${({ $variant, theme }) => legendDotBorderColor($variant, theme)};
`;

export const StyledLegendLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[700])};
`;
