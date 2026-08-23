import styled, { css, keyframes } from 'styled-components';
import type { TabsVariant, TabsSize, TabsAlign } from './Tabs.types';

// ─── Animations ───────────────────────────────────────────────────────────────

// Opacity-only — intentionally NO transform. A transform on the panel (even a
// settled translateY(0)) makes it the containing block for position:fixed
// descendants, trapping modals/drawers (e.g. WorkScheduleCalendar's detail
// panel) inside the tab instead of the viewport. See TabPanel below.
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE = {
  sm: { h: '32px', px: '12px', fs: '0.75rem', gap: '6px' },
  md: { h: '40px', px: '16px', fs: '0.875rem', gap: '8px' },
  lg: { h: '48px', px: '20px', fs: '1rem', gap: '10px' },
} satisfies Record<TabsSize, { h: string; px: string; fs: string; gap: string }>;

// ─── Root ─────────────────────────────────────────────────────────────────────

export const TabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

// ─── TabList ──────────────────────────────────────────────────────────────────

export const TabList = styled.div<{
  $variant: TabsVariant;
  $align: TabsAlign;
}>`
  ${({ theme, $align, $variant }) => {
    const { color, border, spacing } = theme;

    // Align
    const justifyContentMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    const justifyContent = justifyContentMap[$align];
    // Variants
    const variants = {
      line: css`
        border-bottom: 1px solid ${border.color.neutral.light};
      `,

      enclosed: css`
        border: 1px solid ${border.color.neutral.light};
        border-bottom: none;
        border-radius: ${border.radius.lg} ${border.radius.lg} 0 0;
        background: ${theme.isDark ? color.background.neutral : color.neutral[50]};
        padding: ${spacing.xs} ${spacing.xs} 0;
        gap: ${spacing.xs};
      `,

      pill: css`
        background: ${theme.isDark ? color.background.dark : color.neutral[100]};
        border-radius: ${border.radius.xl};
        padding: 4px;
        gap: 2px;
      `,

      card: css`
        gap: ${spacing.xs};
        border-bottom: 1px solid ${border.color.neutral.light};
      `,
    };

    return css`
      position: relative;
      display: flex;
      align-items: center;
      justify-content: ${justifyContent};
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      ${variants[$variant]}
    `;
  }}
`;

// ─── Tab trigger ──────────────────────────────────────────────────────────────

export const TabTrigger = styled.button<{
  $variant: TabsVariant;
  $active: boolean;
  $size: TabsSize;
  $stretch: boolean;
  $disabled: boolean;
}>`
  ${({ theme, $size, $variant, $active, $disabled, $stretch }) => {
    const { color, border, effect } = theme;

    const size = SIZE[$size];
    const isActive = $active;
    const isDisabled = $disabled;
    const cursor = isDisabled ? 'not-allowed' : 'pointer';
    const opacity = isDisabled ? 0.45 : 1;

    const base = css`
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: ${size.gap};
      height: ${size.h};
      padding: 0 ${size.px};
      cursor: ${cursor};
      opacity: ${opacity};
      border: none;
      background: none;
      transition:
        color 0.18s ease,
        background 0.18s ease,
        box-shadow 0.18s ease;

      ${$stretch ? 'flex: 1;' : ''}
    `;

    const variants = {
      line: css`
        color: ${isActive
          ? theme.isDark
            ? color.intent.primary
            : color.primary[600]
          : color.text.secondary};
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        border-radius: 0;

        ${isActive
          ? `border-bottom-color: ${theme.isDark ? color.intent.primary : color.primary[500]};`
          : ''}

        ${!isDisabled && !isActive
          ? css`
              &:hover {
                color: ${color.text.primary};
              }
            `
          : ''}
      `,

      pill: css`
        border-radius: ${border.radius.lg};
        color: ${isActive
          ? theme.isDark
            ? color.text.primary
            : color.primary[700]
          : color.text.secondary};
        background: ${isActive
          ? theme.isDark
            ? color.background.elevated
            : color.background.light
          : 'transparent'};
        box-shadow: ${isActive ? effect.shadow.outer.sm : 'none'};

        ${!isDisabled && !isActive
          ? css`
              &:hover {
                background: ${theme.isDark ? color.background.neutral : 'rgba(0, 0, 0, 0.04)'};
                color: ${color.text.primary};
              }
            `
          : ''}
      `,

      card: css`
        border-radius: ${border.radius.md} ${border.radius.md} 0 0;
        border: 1px solid ${isActive ? border.color.neutral.light : 'transparent'};
        border-bottom: none;
        color: ${isActive ? color.text.primary : color.text.secondary};
        background: ${isActive
          ? theme.isDark
            ? color.background.card
            : color.background.light
          : 'transparent'};
        margin-bottom: -1px;

        ${isActive
          ? css`
              &::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                right: 0;
                height: 1px;
                background: ${theme.isDark ? color.background.card : color.background.light};
              }
            `
          : ''}

        ${!isDisabled && !isActive
          ? css`
              &:hover {
                background: ${theme.isDark ? color.background.neutral : color.neutral[50]};
                color: ${color.text.primary};
              }
            `
          : ''}
      `,

      enclosed: css`
        border-radius: ${border.radius.md} ${border.radius.md} 0 0;
        color: ${isActive
          ? theme.isDark
            ? color.intent.primary
            : color.primary[600]
          : color.text.secondary};
        background: ${isActive
          ? theme.isDark
            ? color.background.card
            : color.background.light
          : 'transparent'};

        ${isActive
          ? css`
              box-shadow: inset 0 2px 0 ${theme.isDark ? color.intent.primary : color.primary[500]};
            `
          : ''}

        ${!isDisabled && !isActive
          ? css`
              &:hover {
                background: ${theme.isDark ? color.background.neutral : color.neutral[100]};
                color: ${color.text.primary};
              }
            `
          : ''}
      `,
    };

    return css`
      ${base}
      ${variants[$variant]}
    `;
  }}
`;

// ─── Tab icon / badge ─────────────────────────────────────────────────────────

export const TabIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  svg {
    width: 100%;
    height: 100%;
  }
`;

export const TabBadge = styled.span`
  ${({ theme }) => {
    const { color, typography } = theme;

    const background = theme.isDark ? color.primary[800] : color.primary[100];
    const textColor = theme.isDark ? color.primary[200] : color.primary[700];

    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: ${background};
      color: ${textColor};
      font-size: 0.6875rem;
      font-weight: ${typography.weight.semibold};
      line-height: 1;
    `;
  }}
`;

// ─── Panel / Content ──────────────────────────────────────────────────────────

export const TabPanels = styled.div<{ $variant: TabsVariant }>`
  ${({ theme, $variant }) => {
    const { color, border } = theme;

    const variantsWithContainer = ['card', 'enclosed'];
    const shouldApply = variantsWithContainer.includes($variant);

    if (!shouldApply) return '';

    return css`
      border: 1px solid ${border.color.neutral.light};
      border-top: none;
      border-radius: 0 0 ${border.radius.lg} ${border.radius.lg};
      background: ${theme.isDark ? color.background.light : color.background.light};
    `;
  }}
`;

export const TabPanel = styled.div<{ $active: boolean }>`
  ${({ $active, theme }) => {
    const { spacing } = theme;

    return css`
      padding: ${spacing.md} 0;
      display: ${$active ? 'block' : 'none'};
      opacity: ${$active ? 1 : 0};
      /* DO NOT add transform/translate/filter/will-change/perspective here. Any
         of them makes this panel the containing block for position:fixed
         descendants, which traps fixed modals/drawers (e.g. the
         WorkScheduleCalendar detail panel) inside the tab and breaks the page
         layout. Entrance is opacity-only by design. */
      pointer-events: ${$active ? 'auto' : 'none'};
      visibility: ${$active ? 'visible' : 'hidden'};
      transition:
        opacity 0.22s ease,
        visibility 0.22s ease;
      animation: ${fadeIn} 0.22s ease both;
      animation-play-state: ${$active ? 'running' : 'paused'};
    `;
  }}
`;

export const TabPanelInset = styled(TabPanel)`
  padding: ${({ theme }) => theme.spacing.lg};
`;
