/**
 * Sidebar — Styled Components
 *
 * Mobile First: estilos base para mobile, media queries para desktop.
 * Variantes: dark | light | ghost
 *
 * Layout visual:
 *  ┌─────────────────────┐
 *  │  [Logo]  [Collapse] │  ← SidebarHeader (sticky top)
 *  ├─────────────────────┤
 *  │  [Search]           │  ← SearchWrapper (opcional)
 *  ├─────────────────────┤
 *  │  ── SECCIÓN A ──    │  ← GroupLabel
 *  │  ▸ [icon] Item      │  ← NavItemButton (active: indicador lateral)
 *  │       ↳ Sub-item    │  ← SubItemButton
 *  │  ─────────────────  │  ← ItemDivider
 *  │  [icon] Item        │
 *  ├─────────────────────┤
 *  │  [Footer slot]      │  ← SidebarFooter (sticky bottom)
 *  └─────────────────────┘
 */

import styled, { css, keyframes } from 'styled-components';
import type { TSidebarVariant, TSidebarPlacement } from './Sidebar.types';
import type { DefaultTheme } from 'styled-components';
import { safeArea } from '@infra/styles/safeArea';

// ─── Variant token map ─────────────────────────────────────────────────────

interface IVariantTokens {
  background: string;
  bgSubtle: string;
  border: string;
  logoColor: string;
  groupLabelColor: string;
  itemColor: string;
  itemHoverBg: string;
  itemHoverColor: string;
  itemActiveBg: string;
  itemActiveColor: string;
  itemActiveIndicator: string;
  collapseButtonBg: string;
  collapseButtonColor: string;
  collapseButtonHoverBg: string;
  footerBorder: string;
  badgeBg: string;
  badgeColor: string;
  scrollbarThumb: string;
  dividerColor: string;
  searchBg: string;
  searchBorder: string;
  searchBorderFocus: string;
  searchText: string;
  searchPlaceholder: string;
  tooltipBg: string;
  tooltipColor: string;
  ornamentColor: string;
  headerSeparator: string;
  activeItemBorderRadius: string;
  focusRingColor: string;
}

const getVariantTokens = (variant: TSidebarVariant, theme: DefaultTheme): IVariantTokens => {
  const map: Record<TSidebarVariant, IVariantTokens> = {
    dark: {
      background: theme.color.background.dark,
      bgSubtle: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      logoColor: theme.color.text.primary,
      groupLabelColor: 'rgba(255,255,255,0.3)',
      itemColor: 'rgba(255,255,255,0.55)',
      itemHoverBg: 'rgba(255,255,255,0.07)',
      itemHoverColor: 'rgba(255,255,255,0.9)',
      itemActiveBg: 'rgba(115,91,254,0.18)',
      itemActiveColor: theme.color.primary[300],
      itemActiveIndicator: theme.color.primary[400],
      collapseButtonBg: 'rgba(255,255,255,0.06)',
      collapseButtonColor: 'rgba(255,255,255,0.35)',
      collapseButtonHoverBg: 'rgba(255,255,255,0.12)',
      footerBorder: 'rgba(255,255,255,0.07)',
      badgeBg: theme.color.primary[500],
      badgeColor: theme.color.text.inverse || '',
      scrollbarThumb: 'rgba(255,255,255,0.1)',
      dividerColor: 'rgba(255,255,255,0.07)',
      searchBg: 'rgba(255,255,255,0.06)',
      searchBorder: 'rgba(255,255,255,0.1)',
      searchBorderFocus: theme.color.primary[400],
      searchText: theme.color.text.inverse || '',
      searchPlaceholder: 'rgba(255,255,255,0.3)',
      tooltipBg: theme.color.neutral[800],
      tooltipColor: theme.color.text.inverse || '',
      ornamentColor: 'transparent',
      headerSeparator: `1px solid rgba(255,255,255,0.07)`,
      activeItemBorderRadius: theme.border.radius.md,
      focusRingColor: theme.color.primary[400],
    },
    light: {
      background: theme.color.background.light || '',
      bgSubtle: theme.isDark ? theme.color.background.neutral : theme.color.neutral[50] || '',
      border: `1px solid ${theme.color.neutral[200]}`,
      logoColor: theme.color.text.primary,
      groupLabelColor: theme.color.text.tertiary,
      itemColor: theme.color.text.primary,
      itemHoverBg: theme.isDark
        ? (theme.border.color.neutral.subtle ?? '')
        : theme.color.neutral[100],
      itemHoverColor: theme.color.text.primary,
      itemActiveBg: theme.isDark ? 'oklch(0.74 0.10 75 / 0.15)' : theme.color.primary[50] || '',
      itemActiveColor: theme.color.primary[600],
      itemActiveIndicator: theme.color.primary[500],
      collapseButtonBg: theme.isDark
        ? (theme.border.color.neutral.subtle ?? '')
        : theme.color.neutral[100],
      collapseButtonColor: theme.color.text.tertiary,
      collapseButtonHoverBg: theme.color.neutral[200],
      footerBorder: theme.color.neutral[200],
      badgeBg: theme.color.primary[500],
      badgeColor: theme.color.text.inverse || '',
      scrollbarThumb: theme.color.neutral[300],
      dividerColor: theme.color.neutral[200],
      searchBg: theme.isDark ? (theme.border.color.neutral.subtle ?? '') : theme.color.neutral[100],
      searchBorder: theme.color.neutral[200],
      searchBorderFocus: theme.color.primary[400],
      searchText: theme.color.text.primary,
      searchPlaceholder: theme.color.text.disabled,
      tooltipBg: theme.color.neutral[800],
      tooltipColor: theme.color.text.inverse || '',
      ornamentColor: 'transparent',
      headerSeparator: `1px solid ${theme.color.neutral[200]}`,
      activeItemBorderRadius: theme.border.radius.md,
      focusRingColor: theme.color.primary[400],
    },
    suksai: theme.isDark
      ? {
          // ── Dark mode (jungle-900 surface, gold-400 accent) ──────────────
          background: 'oklch(0.15 0.022 143)',
          bgSubtle: 'oklch(0.98 0.01 67 / 0.04)',
          border: '1px solid oklch(0.98 0.01 67 / 0.08)',
          logoColor: 'oklch(0.98 0.01 67)',
          groupLabelColor: 'oklch(0.98 0.01 67 / 0.40)',
          itemColor: 'oklch(0.98 0.01 67 / 0.78)',
          itemHoverBg: 'oklch(0.98 0.01 67 / 0.06)',
          itemHoverColor: 'oklch(0.98 0.01 67)',
          itemActiveBg: 'oklch(0.74 0.10 75 / 0.18)',
          itemActiveColor: 'oklch(0.74 0.10 75)',
          itemActiveIndicator: 'oklch(0.74 0.10 75)',
          collapseButtonBg: 'oklch(0.98 0.01 67 / 0.06)',
          collapseButtonColor: 'oklch(0.98 0.01 67 / 0.35)',
          collapseButtonHoverBg: 'oklch(0.98 0.01 67 / 0.12)',
          footerBorder: 'oklch(0.98 0.01 67 / 0.10)',
          badgeBg: 'oklch(0.74 0.10 75)',
          badgeColor: 'oklch(0.15 0.022 143)',
          scrollbarThumb: 'oklch(0.98 0.01 67 / 0.10)',
          dividerColor: 'oklch(0.98 0.01 67 / 0.07)',
          searchBg: 'oklch(0.98 0.01 67 / 0.06)',
          searchBorder: 'oklch(0.98 0.01 67 / 0.10)',
          searchBorderFocus: 'oklch(0.74 0.10 75)',
          searchText: 'oklch(0.98 0.01 67)',
          searchPlaceholder: 'oklch(0.98 0.01 67 / 0.30)',
          tooltipBg: 'oklch(0.25 0.030 143)',
          tooltipColor: 'oklch(0.98 0.01 67)',
          ornamentColor: 'oklch(0.98 0.01 67 / 0.07)',
          headerSeparator: '0px solid oklch(0.98 0.01 67 / 0.08)',
          activeItemBorderRadius: '10px',
          focusRingColor: 'oklch(0.74 0.10 75)',
        }
      : {
          // ── Light mode (sand-50 surface, gold-400/600 accent) ─────────────
          background: 'oklch(0.97 0.01 67)',
          bgSubtle: 'oklch(0.94 0.015 67)',
          border: `1px solid ${theme.color.secondary[800]}`,
          logoColor: 'oklch(0.22 0.01 67)',
          groupLabelColor: theme.color.text.disabled,
          itemColor: theme.color.text.inverse,
          itemHoverBg: 'oklch(0.74 0.10 75 / 0.08)',
          itemHoverColor: theme.color.text.inverse,
          itemActiveBg: 'oklch(0.74 0.10 75 / 0.14)',
          itemActiveColor: theme.color.secondary[400],
          itemActiveIndicator: 'oklch(0.54 0.09 75)',
          collapseButtonBg: 'oklch(0.15 0.022 143 / 0.06)',
          collapseButtonColor: theme.color.text.inverse,
          collapseButtonHoverBg: 'oklch(0.15 0.022 143 / 0.10)',
          footerBorder: theme.color.secondary[900],
          badgeBg: 'oklch(0.74 0.10 75)',
          badgeColor: 'oklch(0.22 0.01 67)',
          scrollbarThumb: 'oklch(0.15 0.022 143 / 0.12)',
          dividerColor: theme.color.primary[800],
          searchBg: 'oklch(0.15 0.022 143 / 0.04)',
          searchBorder: theme.color.primary[800],
          searchBorderFocus: 'oklch(0.74 0.10 75)',
          searchText: 'oklch(0.22 0.01 67)',
          searchPlaceholder: 'oklch(0.22 0.01 67 / 0.35)',
          tooltipBg: 'oklch(0.22 0.01 67)',
          tooltipColor: 'oklch(0.98 0.01 67)',
          ornamentColor: 'oklch(0.15 0.022 143 / 0.06)',
          headerSeparator: `0px solid ${theme.color.primary[400]}`,
          activeItemBorderRadius: '10px',
          focusRingColor: 'oklch(0.54 0.09 75)',
        },
    ghost: {
      background: 'transparent',
      bgSubtle: 'rgba(0,0,0,0.02)',
      border: 'none',
      logoColor: theme.color.text.primary,
      groupLabelColor: theme.color.text.tertiary,
      itemColor: theme.color.text.primary,
      itemHoverBg: theme.isDark
        ? (theme.border.color.neutral.subtle ?? '')
        : theme.color.neutral[100],
      itemHoverColor: theme.color.text.primary,
      itemActiveBg: theme.isDark ? 'oklch(0.74 0.10 75 / 0.15)' : theme.color.primary[50] || '',
      itemActiveColor: theme.color.primary[600],
      itemActiveIndicator: theme.color.primary[500],
      collapseButtonBg: theme.isDark
        ? (theme.border.color.neutral.subtle ?? '')
        : theme.color.neutral[100],
      collapseButtonColor: theme.color.text.tertiary,
      collapseButtonHoverBg: theme.color.neutral[200],
      footerBorder: theme.color.neutral[200],
      badgeBg: theme.color.primary[500],
      badgeColor: theme.color.text.inverse || '',
      scrollbarThumb: theme.color.neutral[300],
      dividerColor: theme.color.neutral[200],
      searchBg: theme.isDark ? (theme.border.color.neutral.subtle ?? '') : theme.color.neutral[100],
      searchBorder: theme.color.neutral[200],
      searchBorderFocus: theme.color.primary[400],
      searchText: theme.color.text.primary,
      searchPlaceholder: theme.color.text.disabled,
      tooltipBg: theme.color.neutral[800],
      tooltipColor: theme.color.text.inverse || '',
      ornamentColor: 'transparent',
      headerSeparator: `1px solid ${theme.color.neutral[200]}`,
      activeItemBorderRadius: theme.border.radius.md,
      focusRingColor: theme.color.primary[400],
    },
  };
  return map[variant];
};

// ─── Animations ────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const fadeInRight = keyframes`
  from { opacity: 0; transform: translateX(4px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: translateY(-2px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// ─── Backdrop ──────────────────────────────────────────────────────────────

export const Backdrop = styled.div<{ $isOpen: boolean }>`
  display: none;

  /* Visible en mobile y tablet (< lg = 1024px) */
  @media (max-width: 1023px) {
    display: block;
    position: fixed;
    inset: 0;
    ${({ theme, $isOpen }) => {
      const { color, zIndex, transition } = theme;
      const opacity = $isOpen ? 1 : 0;
      const pointerEvents = $isOpen ? 'auto' : 'none';

      return css`
        background: ${color.overlay.dark};
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        pointer-events: ${pointerEvents};
        opacity: ${opacity};
        transition: opacity ${transition.duration.slow} ${transition.timing.easeInOut};
        z-index: ${zIndex.overlay};
      `;
    }}
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;

// ─── Root nav ──────────────────────────────────────────────────────────────

export const SidebarRoot = styled.nav<{
  $variant: TSidebarVariant;
  $placement: TSidebarPlacement;
  $collapsed: boolean;
  $mobileOpen: boolean;
  $width: string;
  $height?: string;
  $collapsedWidth: string;
}>`
  ${({
    theme,
    $variant,
    $placement,
    $mobileOpen,
    $height,
    $width,
    $collapsed,
    $collapsedWidth,
  }) => {
    const { zIndex, transition, effect, breakpoint } = theme;
    const t = getVariantTokens($variant, theme);
    const isLeft = $placement === 'left';
    const height = $height ?? '100%';
    const transform = $mobileOpen
      ? 'translateX(0)'
      : isLeft
        ? 'translateX(-100%)'
        : 'translateX(100%)';
    const border = isLeft ? `border-right: ${t.border};` : `border-left: ${t.border};`;
    const width = $collapsed ? $collapsedWidth : $width;
    const transitionTransform = `${transition.duration.slow} ${transition.timing.easeInOut}`;

    return css`
      display: flex;
      flex-direction: column;
      /* Base: ocupa el alto del contenedor padre (showcase embebido, etc.) */
      height: 100%;
      min-height: 0;
      max-height: 100vh;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;

      background: ${t.background};
      ${border}

      /* Botanical ornament — concentric arc watermark */
      ${$variant === 'suksai' &&
      css`
        background:
          /* 1. Reflejo suave (simula el pulido mate del grafito) */
          radial-gradient(
            ellipse at 20% 15%,
            ${({ theme }) => theme.color.neutral[700]} 0%,
            /* oklch(0.42 0.02 67) - Gris cálido medio */ transparent 55%
          ),
          /* 2. Sombra profunda para dar volumen */
          radial-gradient(
              ellipse at 85% 90%,
              ${({ theme }) => theme.color.neutral[900]} 0%,
              /* oklch(0.22 0.01 67) - Grafito casi negro */ transparent 65%
            ),
          /* 3. Base sólida de carbón/grafito */
          linear-gradient(
              145deg,
              ${({ theme }) => theme.color.neutral[800]} 0%,
              /* oklch(0.32 0.02 67) - Grafito oscuro */ ${({ theme }) => theme.color.neutral[900]}
                100%
            );
      `}

      /* Mobile y tablet (< lg = 1024px): drawer overlay a 50 % de pantalla */
      @media (max-width: 1023px) {
        position: fixed;
        top: 0;
        bottom: 0;
        height: ${height};
        ${isLeft ? 'left: 0;' : 'right: 0;'}
        width: min(280px, calc(100vw - 48px));
        max-width: none;
        transform: ${transform};
        transition: transform ${transitionTransform};
        box-shadow: ${$mobileOpen ? effect.shadow.outer.xl : 'none'};
        z-index: ${zIndex.modal};
        /* Safe area insets — clear notch (top) and home indicator (bottom) */
        padding-top: ${safeArea.top};
        padding-bottom: ${safeArea.bottom};

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      }

      /* Desktop (≥ lg = 1024px): sidebar sticky en el grid */
      @media (min-width: ${breakpoint.lg}) {
        position: sticky;
        top: 0;
        height: ${height};
        width: ${width};
        transition: width ${transitionTransform};
        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      }
    `;
  }}
`;

// ─── Header ────────────────────────────────────────────────────────────────

export const SidebarHeader = styled.div<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
}>`
  ${({ theme, $collapsed, $variant }) => {
    const { spacing, transition } = theme;
    const t = getVariantTokens($variant, theme);
    const isCollapsed = $collapsed;
    const justifyContent = isCollapsed ? 'center' : 'space-between';
    const padding = isCollapsed ? `${spacing.md} ${spacing.sm}` : `${spacing.md} ${spacing.md}`;
    const slow = `${transition.duration.slow} ${transition.timing.easeInOut}`;

    return css`
      padding: ${padding};
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: ${justifyContent};
      flex-shrink: 0;
      gap: ${spacing.sm};
      overflow: hidden;
      border-bottom: ${t.headerSeparator};
      transition:
        padding ${slow},
        justify-content ${slow};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Footer ────────────────────────────────────────────────────────────────

export const SidebarFooter = styled.div<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
}>`
  ${({ theme, $variant, $collapsed }) => {
    const { spacing, transition } = theme;
    const t = getVariantTokens($variant, theme);

    const justifyContent = $collapsed ? 'center' : 'flex-start';
    const slow = `${transition.duration.slow} ${transition.timing.easeInOut}`;

    return css`
      padding: ${spacing.md};
      border-top: 1px solid ${t.footerBorder};
      display: flex;
      align-items: center;
      justify-content: ${justifyContent};
      flex-shrink: 0;
      overflow: hidden;
      transition: padding ${slow};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const LogoWrapper = styled.button`
  ${({ theme }) => {
    const { spacing, border, color } = theme;

    return css`
      display: flex;
      align-items: center;
      gap: ${spacing.sm};
      background: none;
      border: none;
      padding: ${spacing.xs};
      margin: -${spacing.xs};
      cursor: pointer;
      min-width: 0;
      flex: 1;
      border-radius: ${border.radius.md};
      &:focus-visible {
        outline: 2px solid ${color.primary[400]};
        outline-offset: 2px;
      }
    `;
  }}
`;

export const LogoIconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* SVG-only logos default to 32 × 32; compound brand components size themselves */
  > svg {
    width: 48px;
    height: 48px;
  }
`;

export const LogoTitle = styled.span<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
}>`
  ${({ theme, $variant, $collapsed }) => {
    const { typography, transition } = theme;
    const tokens = getVariantTokens($variant, theme);

    const isCollapsed = $collapsed;

    const opacity = isCollapsed ? 0 : 1;
    const maxWidth = isCollapsed ? '0' : '180px';

    const base = css`
      ${transition.duration.base} ${transition.timing.easeInOut}
    `;
    const slow = css`
      ${transition.duration.slow} ${transition.timing.easeInOut}
    `;

    return css`
      max-width: ${maxWidth};
      font-family: ${typography.font.display};
      font-size: ${typography.size.sm};
      font-weight: ${typography.weight.semibold};
      color: ${tokens.logoColor};
      white-space: nowrap;
      letter-spacing: -0.025em;
      opacity: ${opacity};
      transition:
        opacity ${base},
        max-width ${slow};
      overflow: hidden;
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Collapse button ───────────────────────────────────────────────────────

export const CollapseButton = styled.button<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
  $placement: TSidebarPlacement;
}>`
  display: none;

  /* Botón de colapso solo en desktop (sidebar en grid) */
  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    ${({ theme, $variant, $collapsed, $placement }) => {
      const { border, transition } = theme;
      const t = getVariantTokens($variant, theme);

      const isRight = $placement === 'right';
      const isCollapsed = $collapsed;

      const rotation = isRight
        ? isCollapsed
          ? '0deg'
          : '180deg'
        : isCollapsed
          ? '180deg'
          : '0deg';

      const base = `${transition.duration.base} ${transition.timing.easeOut}`;
      const slow = `${transition.duration.slow} ${transition.timing.easeInOut}`;

      return css`
        background: ${t.collapseButtonBg};
        color: ${t.collapseButtonColor};
        border: ${t.border};
        border-radius: ${border.radius.full};
        cursor: pointer;
        transform: rotate(${rotation});
        transition:
          background ${base},
          color ${base},
          transform ${slow};

        &:hover {
          background: ${t.collapseButtonHoverBg};
          color: ${t.itemHoverColor};
        }

        &:focus-visible {
          outline: 2px solid ${t.focusRingColor};
          outline-offset: 2px;
        }
      `;
    }}

    svg {
      width: 12px;
      height: 12px;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;

// ─── Nav body ──────────────────────────────────────────────────────────────

export const NavBody = styled.div<{ $variant: TSidebarVariant }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  ${({ theme, $variant }) => {
    const { spacing } = theme;
    const t = getVariantTokens($variant, theme);

    return css`
      padding: ${spacing.sm} 0;
      max-height: calc(100vh - 64px);
      scrollbar-width: thin;
      scrollbar-color: ${t.scrollbarThumb} transparent;

      &::-webkit-scrollbar {
        width: 3px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: ${t.scrollbarThumb};
        border-radius: 4px;

        &:hover {
          background: ${t.collapseButtonHoverBg};
        }
      }
    `;
  }}
`;

// ─── Group ─────────────────────────────────────────────────────────────────

export const NavGroup = styled.div`
  & + & {
    margin-top: ${({ theme }) => theme.spacing.xs};
    padding-top: ${({ theme }) => theme.spacing.xs};
  }
`;

export const GroupLabel = styled.span<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
}>`
  display: block;
  ${({ theme, $variant, $collapsed }) => {
    const { typography, spacing, transition } = theme;
    const t = getVariantTokens($variant, theme);

    const isCollapsed = $collapsed;

    const opacity = isCollapsed ? 0 : 1;
    const maxHeight = isCollapsed ? '0' : '40px';

    const paddingTop = isCollapsed ? '0' : spacing.md;
    const paddingBottom = isCollapsed ? '0' : spacing.xs;
    const paddingX = $variant === 'suksai' ? `calc(${spacing.md} + 4px)` : spacing.xl;

    const base = `${transition.duration.base} ${transition.timing.easeInOut}`;
    const slow = `${transition.duration.slow} ${transition.timing.easeInOut}`;

    return css`
      font-family: ${typography.font.body};
      font-size: 10px;
      font-weight: ${typography.weight.semibold};
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${t.groupLabelColor};
      padding: ${paddingTop} ${paddingX} ${paddingBottom};
      white-space: nowrap;
      overflow: hidden;
      opacity: ${opacity};
      max-height: ${maxHeight};
      transition:
        opacity ${base},
        max-height ${slow},
        padding-top ${slow},
        padding-bottom ${slow};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Nav item ──────────────────────────────────────────────────────────────

export const NavItemWrapper = styled.div`
  position: relative;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  a {
    text-decoration: none;
    color: inherit;
  }
`;

export const NavItemButton = styled.button<{
  $variant: TSidebarVariant;
  $isActive: boolean;
  $collapsed: boolean;
  $disabled: boolean;
}>`
  appearance: none;
  background: none;
  border: none;
  text-align: left;
  ${({ theme, $variant, $isActive, $collapsed, $disabled }) => {
    const { spacing, typography, color, transition } = theme;
    const t = getVariantTokens($variant, theme);

    const isCollapsed = $collapsed;
    const isActive = $isActive;
    const isDisabled = $disabled;
    const cursor = isDisabled ? 'not-allowed' : 'pointer';
    const opacity = isDisabled ? 0.45 : 1;

    const fontWeight = isActive ? typography.weight.semibold : typography.weight.medium;

    const baseColor = isDisabled ? color.text.disabled : isActive ? t.itemActiveColor : t.itemColor;

    const background = isActive ? t.itemActiveBg : 'transparent';
    const hoverBg = isActive ? t.itemActiveBg : t.itemHoverBg;
    const hoverColor = isActive ? t.itemActiveColor : t.itemHoverColor;
    const indicatorScale = isActive ? 1 : 0;
    const base = `${$variant === 'suksai' ? transition.duration.fast : transition.duration.base} ${transition.timing.easeOut}`;
    const fast = transition.duration.fast;

    return css`
      cursor: ${cursor};
      display: flex;
      align-items: center;
      ${isCollapsed
        ? css`
            justify-content: center;
          `
        : ''}
      gap: ${spacing.sm};
      width: 100%;
      min-height: 48px;
      padding: ${spacing.sm} ${spacing.md};
      border-radius: ${t.activeItemBorderRadius};
      position: relative;
      overflow: hidden;
      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      font-weight: ${fontWeight};
      letter-spacing: 0.01em;
      color: ${baseColor};
      background: ${background};
      opacity: ${opacity};

      /* Indicador lateral */
      &::before {
        content: '';
        position: absolute;
        left: -${spacing.sm};
        top: 50%;
        transform: translateY(-50%) scaleY(${indicatorScale});
        width: 3px;
        height: 60%;
        border-radius: 0 2px 2px 0;
        background: ${t.itemActiveIndicator};
        transition: transform ${base};
      }

      /* Suppress lateral indicator for suksai — active state uses bg highlight only */
      ${$variant === 'suksai' &&
      css`
        &::before {
          display: none;
        }
      `}

      &:not(:disabled):hover {
        background: ${hoverBg};
        color: ${hoverColor};
      }

      &:focus-visible {
        outline: 2px solid ${t.focusRingColor};
        outline-offset: -2px;
      }

      transition:
        background ${base},
        color ${base},
        font-weight ${fast};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &::before {
      transition: none;
    }
  }
`;

export const NavItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: inherit;
  transition: transform
    ${({ theme }) => theme.transition.duration.base + ' ' + theme.transition.timing.easeOut};

  ${NavItemButton}:not(:disabled):hover > & {
    transform: translateX(1px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const NavItemLabel = styled.span<{ $collapsed: boolean }>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${({ theme, $collapsed }) => {
    const { transition } = theme;

    const isCollapsed = $collapsed;
    const opacity = isCollapsed ? 0 : 1;
    const maxWidth = isCollapsed ? '0' : '180px';
    const base = `${transition.duration.base} ${transition.timing.easeInOut}`;
    const slow = `${transition.duration.slow} ${transition.timing.easeInOut}`;

    return css`
      opacity: ${opacity};
      max-width: ${maxWidth};
      transition:
        opacity ${base},
        max-width ${slow};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Badge ─────────────────────────────────────────────────────────────────

export const Badge = styled.span<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  line-height: 1;
  flex-shrink: 0;
  font-size: 10px;
  ${({ theme, $variant, $collapsed }) => {
    const { border, typography, transition } = theme;
    const t = getVariantTokens($variant, theme);

    const isCollapsed = $collapsed;
    const opacity = isCollapsed ? 0 : 1;
    const scale = isCollapsed ? 0.5 : 1;
    const base = `${transition.duration.base} ${transition.timing.easeInOut}`;

    return css`
      border-radius: ${border.radius.full};
      font-family: ${typography.font.body};
      font-weight: ${typography.weight.bold};
      background: ${t.badgeBg};
      color: ${t.badgeColor};
      opacity: ${opacity};
      transform: scale(${scale});
      transition:
        opacity ${transition.duration.base},
        transform ${base};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Chevron ───────────────────────────────────────────────────────────────

export const Chevron = styled.span<{ $expanded: boolean; $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: inherit;
  ${({ theme, $collapsed, $expanded }) => {
    const { transition } = theme;
    const isCollapsed = $collapsed;
    const isExpanded = $expanded;
    const opacity = isCollapsed ? 0 : 0.5;
    const rotation = isExpanded ? '90deg' : '0deg';
    const base = `${transition.duration.base} ${transition.timing.easeInOut}`;

    return css`
      opacity: ${opacity};
      transform: rotate(${rotation});
      transition:
        transform ${base},
        opacity ${base};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Sub-items ─────────────────────────────────────────────────────────────

export const SubItemsContainer = styled.div<{
  $expanded: boolean;
  $collapsed: boolean;
  $itemCount: number;
}>`
  overflow: hidden;
  ${({ theme, $expanded, $collapsed, $itemCount }) => {
    const { transition } = theme;
    const isOpen = $expanded && !$collapsed;
    const ITEM_HEIGHT = 34;
    const EXTRA_SPACE = 8;
    const maxHeight = isOpen ? `${$itemCount * ITEM_HEIGHT + EXTRA_SPACE}px` : '0';
    const slow = `${transition.duration.slow} ${transition.timing.easeInOut}`;

    return css`
      max-height: ${maxHeight};
      transition: max-height ${slow};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const SubItemButton = styled.button<{
  $variant: TSidebarVariant;
  $isActive: boolean;
  $disabled: boolean;
}>`
  appearance: none;
  background: none;
  border: none;
  text-align: left;
  width: 100%;
  min-height: 32px;
  ${({ theme, $variant, $isActive, $disabled }) => {
    const { spacing, border, typography, color, transition } = theme;
    const t = getVariantTokens($variant, theme);

    const isActive = $isActive;
    const isDisabled = $disabled;

    const cursor = isDisabled ? 'not-allowed' : 'pointer';
    const opacity = isDisabled ? 0.45 : 1;

    const fontWeight = isActive ? typography.weight.medium : typography.weight.regular;

    const baseColor = isDisabled ? color.text.disabled : isActive ? t.itemActiveColor : t.itemColor;

    const background = isActive ? t.itemActiveBg : 'transparent';
    const hoverBg = t.itemHoverBg;
    const hoverColor = t.itemHoverColor;
    const indicatorColor = isActive ? t.itemActiveIndicator : t.itemColor;
    const indicatorOpacity = isActive ? 0.9 : 0.35;
    const base = `${transition.duration.base} ${transition.timing.easeOut}`;

    const INDENT = 26;
    const DOT_OFFSET = 8;

    return css`
      cursor: ${cursor};
      display: flex;
      align-items: center;

      padding: 6px ${spacing.md};
      padding-left: calc(${spacing.md} + ${INDENT}px);
      border-radius: ${border.radius.md};
      font-family: ${typography.font.body};
      font-size: ${typography.size.xs};
      font-weight: ${fontWeight};
      color: ${baseColor};
      background: ${background};
      opacity: ${opacity};
      position: relative;
      /* Indicador */
      &::before {
        content: '';
        position: absolute;
        left: calc(${spacing.md} + ${DOT_OFFSET}px);
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: ${indicatorColor};
        opacity: ${indicatorOpacity};
        transition: opacity ${transition.duration.base};
      }

      &:not(:disabled):hover {
        background: ${hoverBg};
        color: ${hoverColor};

        &::before {
          opacity: 0.7;
        }
      }

      &:focus-visible {
        outline: 2px solid ${t.focusRingColor};
        outline-offset: -2px;
      }

      transition:
        background ${base},
        color ${base};
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Item divider ──────────────────────────────────────────────────────────

export const ItemDivider = styled.div<{ $variant: TSidebarVariant }>`
  height: 1px;
  background: ${({ $variant, theme }) => getVariantTokens($variant, theme).dividerColor};
  margin: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
`;

// ─── Tooltip wrapper (collapsed mode) ─────────────────────────────────────

export const TooltipWrapper = styled.div<{
  $collapsed: boolean;
  $placement: TSidebarPlacement;
}>`
  position: relative;

  ${({ $collapsed, $placement, theme }) =>
    $collapsed &&
    css`
      &:hover::after {
        content: attr(data-label);
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        ${$placement === 'left' ? 'left: calc(100% + 10px);' : 'right: calc(100% + 10px);'}
        z-index: ${theme.zIndex.tooltip};
        background: ${theme.color.neutral[800]};
        color: ${theme.color.text.inverse};
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        border-radius: ${theme.border.radius.sm};
        font-family: ${theme.typography.font.body};
        font-size: ${theme.typography.size.xs};
        font-weight: ${theme.typography.weight.medium};
        white-space: nowrap;
        pointer-events: none;
        box-shadow: ${theme.effect.shadow.outer.lg};
        animation: ${$placement === 'left' ? fadeIn : fadeInRight} 120ms ease both;
      }

      &:hover::before {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        ${$placement === 'left' ? 'left: calc(100% + 4px);' : 'right: calc(100% + 4px);'}
        z-index: ${theme.zIndex.tooltip};
        border: 5px solid transparent;
        ${$placement === 'left'
          ? `border-right-color: ${theme.color.neutral[800]};`
          : `border-left-color: ${theme.color.neutral[800]};`}
        pointer-events: none;
        animation: ${$placement === 'left' ? fadeIn : fadeInRight} 120ms ease both;
      }
    `}
`;

// ─── Mobile toggle (external) ─────────────────────────────────────────────

export const MobileToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  /* WCAG 2.5.5 — minimum touch target 44 × 44 px */
  width: 44px;
  height: 44px;
  background: none;
  cursor: pointer;
  ${({ theme }) => {
    const { color, border, transition } = theme;

    const baseTransition = `${transition.duration.base} ${transition.timing.easeOut}`;
    const borderColor = color.neutral[200];
    const hoverBorderColor = color.neutral[300];
    const textColor = color.text.secondary;
    const hoverTextColor = color.text.primary;
    const bgHover = color.neutral[100];

    return css`
      border: 1px solid ${borderColor};
      border-radius: ${border.radius.md};
      color: ${textColor};
      transition:
        background ${baseTransition},
        border-color ${baseTransition},
        color ${baseTransition};

      &:hover {
        background: ${bgHover};
        border-color: ${hoverBorderColor};
        color: ${hoverTextColor};
      }

      &:focus-visible {
        outline: 2px solid ${color.primary[400]};
        outline-offset: 2px;
      }
    `;
  }}

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: none;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ─── Search ────────────────────────────────────────────────────────────────

export const SearchWrapper = styled.div<{
  $variant: TSidebarVariant;
  $collapsed: boolean;
}>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  flex-shrink: 0;
  overflow: hidden;
  border-bottom: 1px solid
    ${({ $variant, theme }) => getVariantTokens($variant, theme).dividerColor};
`;

export const SearchInputRow = styled.div<{
  $variant: TSidebarVariant;
}>`
  display: flex;
  align-items: center;
  ${({ theme, $variant }) => {
    const { spacing, border, transition, color } = theme;
    const t = getVariantTokens($variant, theme);

    const baseTransition = `${transition.duration.base} ${transition.timing.easeOut}`;
    const paddingY = '6px';
    const paddingX = spacing.sm;
    const focusRing = $variant === 'dark' ? 'rgba(115,91,254,0.15)' : color.primary[100];

    return css`
      gap: ${spacing.xs};
      background: ${t.searchBg};
      border: 1px solid ${t.searchBorder};
      border-radius: ${border.radius.md};
      padding: ${paddingY} ${paddingX};

      transition:
        background ${baseTransition},
        border-color ${baseTransition},
        box-shadow ${baseTransition};

      &:focus-within {
        border-color: ${t.searchBorderFocus};
        box-shadow: 0 0 0 3px ${focusRing};
      }
    `;
  }}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const SearchIconWrapper = styled.span<{ $variant: TSidebarVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: ${({ $variant, theme }) => getVariantTokens($variant, theme).searchPlaceholder};
  transition: color ${({ theme }) => theme.transition.duration.base};

  ${SearchInputRow}:focus-within & {
    color: ${({ theme }) => theme.color.primary[400]};
  }
`;

export const SearchInput = styled.input<{ $variant: TSidebarVariant }>`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ $variant, theme }) => getVariantTokens($variant, theme).searchText};
  caret-color: ${({ theme }) => theme.color.primary[400]};

  &::placeholder {
    color: ${({ $variant, theme }) => getVariantTokens($variant, theme).searchPlaceholder};
  }
`;

export const SearchClearButton = styled.button<{
  $visible: boolean;
  $variant: TSidebarVariant;
}>`
  cursor: pointer;
  ${({ theme, $variant, $visible }) => {
    const { border, transition, color } = theme;
    const t = getVariantTokens($variant, theme);

    const isVisible = $visible;
    const fast = `${transition.duration.fast} ${transition.timing.easeOut}`;

    return css`
      display: ${isVisible ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      background: none;
      border: none;
      padding: 0;
      flex-shrink: 0;
      color: ${t.searchPlaceholder};
      border-radius: ${border.radius.full};
      opacity: ${isVisible ? 1 : 0};
      pointer-events: ${isVisible ? 'auto' : 'none'};
      transition:
        color ${fast},
        opacity ${fast};

      &:hover {
        color: ${color.text.primary};
      }

      &:focus-visible {
        outline: 2px solid ${t.focusRingColor};
        outline-offset: 2px;
      }
    `;
  }}
`;

export const SearchNoResults = styled.div<{ $variant: TSidebarVariant }>`
  ${({ theme, $variant }) => {
    const { spacing, typography, transition } = theme;
    const t = getVariantTokens($variant, theme);

    const baseAnimation = `${transition.duration.fast} ${transition.timing.easeOut}`;

    return css`
      padding: ${spacing.xl};
      text-align: center;
      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      color: ${t.groupLabelColor};
      animation: ${scaleIn} ${baseAnimation} both;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `;
  }}
`;

export const StyledBrandOrnament = styled.span`
  pointer-events: none;
  position: absolute;
  top: -140px;
  right: -140px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  border: 1px solid oklch(0.76 0.07 67 / 0.18);
  box-shadow: inset 0 0 0 80px oklch(0.76 0.07 67 / 0.05);

  @media (max-width: 600px) {
    display: none;
  }
`;
