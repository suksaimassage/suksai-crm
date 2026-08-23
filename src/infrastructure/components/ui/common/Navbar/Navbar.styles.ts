/**
 * Navbar — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css, type DefaultTheme } from 'styled-components';
import type { IVariantTokens, TNavbarVariant, TNavLinksAlign } from './Navbar.types';
import {
  ALPHAS,
  colorMixAlpha,
  getColor,
  getContrastText,
} from '@infra/styles/themes/theme.helpers';

// ─── Variant tokens ───────────────────────────────────────────────────────────

const getTokens = (variant: TNavbarVariant, theme: DefaultTheme): IVariantTokens => {
  const map: Record<TNavbarVariant, IVariantTokens> = {
    default: {
      background: theme.color.background.light || '',
      border: `1px solid ` + theme.border.color.neutral.light,
      logoColor: theme.color.text.primary,
      linkColor: theme.color.text.secondary,
      linkHoverColor: theme.color.text.primary,
      linkActiveBg: theme.isDark
        ? colorMixAlpha(getColor(theme, 'primary', 900), ALPHAS[96])
        : getColor(theme, 'primary', 100),
      linkActiveColor: theme.isDark
        ? getContrastText(theme, 'primary', 900)
        : getColor(theme, 'primary', 600),
      actionColor: theme.color.text.secondary,
      actionHoverBg: theme.isDark
        ? (theme.border.color.neutral.subtle ?? theme.border.color.neutral.light)
        : theme.color.neutral[100],
      mobileMenuBg: theme.color.background.light || '',
      mobileLinkBorder: theme.isDark
        ? (theme.border.color.neutral.subtle ?? theme.border.color.neutral.light)
        : theme.color.neutral[100],
    },
    filled: {
      background: theme.isDark ? getColor(theme, 'primary', 800) : getColor(theme, 'primary', 600),
      border: 'none',
      logoColor: theme.color.text.inverse,
      linkColor: 'oklch(1 0 0 / 0.75)',
      linkHoverColor: theme.color.text.inverse,
      linkActiveBg: 'oklch(1 0 0 / 0.15)',
      linkActiveColor: theme.color.text.inverse,
      actionColor: 'oklch(1 0 0 / 0.80)',
      actionHoverBg: 'oklch(1 0 0 / 0.12)',
      mobileMenuBg: theme.color.primary[700],
      mobileLinkBorder: 'oklch(1 0 0 / 0.10)',
    },
    glass: {
      background: theme.isDark ? 'oklch(0.16 0.03 204 / 0.25)' : 'oklch(1 0 0 / 0.25)',
      border: `1px solid ` + (theme.isDark ? 'oklch(1 0 0 / 0.10)' : 'oklch(1 0 0 / 0.30)'),
      logoColor: theme.color.text.primary,
      linkColor: theme.color.text.secondary,
      linkHoverColor: theme.color.text.primary,
      linkActiveBg: theme.isDark
        ? colorMixAlpha(getColor(theme, 'primary', 900), ALPHAS[96])
        : getColor(theme, 'primary', 600),
      linkActiveColor: theme.isDark
        ? getContrastText(theme, 'primary', 900)
        : getContrastText(theme, 'primary', 600) || getColor(theme, 'primary', 600),
      actionColor: theme.color.text.secondary,
      actionHoverBg: theme.isDark
        ? (theme.border.color.neutral.subtle ?? theme.border.color.neutral.light)
        : theme.color.neutral[100],
      mobileMenuBg: theme.color.background.card,
      mobileLinkBorder: theme.isDark
        ? (theme.border.color.neutral.subtle ?? theme.border.color.neutral.light)
        : theme.color.neutral[100],
    },
    dark: {
      background: theme.color.background.dark,
      border: '1px solid oklch(1 0 0 / 0.07)',
      logoColor: theme.color.text.inverse,
      linkColor: 'oklch(1 0 0 / 0.55)',
      linkHoverColor: theme.color.text.inverse,
      linkActiveBg: theme.color.overlay.primary,
      linkActiveColor: theme.color.primary[300],
      actionColor: 'oklch(1 0 0 / 0.55)',
      actionHoverBg: 'oklch(1 0 0 / 0.08)',
      mobileMenuBg: theme.color.background.dark,
      mobileLinkBorder: 'oklch(1 0 0 / 0.06)',
    },
    /* Warm-sand glassmorphism — concept header: rgba(250,247,242,0.82) + blur(20px) */
    suksai: {
      background: theme.isDark ? 'oklch(0.14 0.03 204 / 0.85)' : 'oklch(0.98 0.01 67 / 0.82)',
      border:
        `1px solid ` + (theme.isDark ? 'oklch(0.97 0.01 67 / 0.06)' : 'oklch(0.12 0.01 67 / 0.06)'),
      logoColor: theme.isDark ? theme.color.text.primary : 'oklch(0.12 0.01 67)',
      linkColor: theme.isDark ? theme.color.text.muted : 'oklch(0.54 0.03 67)',
      linkHoverColor: theme.isDark ? theme.color.text.primary : 'oklch(0.12 0.01 67)',
      linkActiveBg: theme.isDark ? 'oklch(0.74 0.10 75 / 0.18)' : 'oklch(0.74 0.10 75 / 0.10)',
      linkActiveColor: theme.isDark ? theme.color.intent.primary : 'oklch(0.52 0.09 75)',
      actionColor: theme.isDark ? theme.color.text.secondary : 'oklch(0.33 0.02 67)',
      actionHoverBg: theme.isDark ? 'oklch(0.23 0.04 204)' : 'oklch(0.95 0.02 67)',
      mobileMenuBg: theme.isDark ? 'oklch(0.16 0.03 204)' : 'oklch(0.98 0.01 67)',
      mobileLinkBorder: theme.isDark ? 'oklch(0.23 0.04 204)' : 'oklch(0.82 0.03 67)',
    },
  };
  return map[variant];
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export const NavRoot = styled.header<{
  $variant: TNavbarVariant;
  $height: number;
  $sticky: boolean;
}>`
  ${({ theme, $variant, $sticky }) => {
    const tokens = getTokens($variant, theme);
    return css`
      width: 100%;
      background: ${tokens.background};
      border-bottom: ${tokens.border};

      ${$sticky &&
      css`
        position: sticky;
        top: 0;
        z-index: ${theme.zIndex.sticky};
      `}

      ${$variant === 'glass' &&
      css`
        backdrop-filter: blur(${theme.effect.blur.lg});
        -webkit-backdrop-filter: blur(${theme.effect.blur.lg});
      `}

      ${$variant === 'suksai' &&
      css`
        backdrop-filter: blur(20px) saturate(140%);
        -webkit-backdrop-filter: blur(20px) saturate(140%);
      `}

      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    `;
  }}
`;

// ─── Inner ────────────────────────────────────────────────────────────────────

export const NavInner = styled.div<{
  $variant: TNavbarVariant;
  $height: number;
}>`
  ${({ theme, $variant, $height }) => {
    const tokens = getTokens($variant, theme);
    return css`
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 ${theme.spacing.lg};
      display: flex;
      align-items: center;
      height: ${$height}px;
      gap: ${theme.spacing.md};
      background: ${tokens.background};

      @media (min-width: ${theme.breakpoint.md}) {
        padding: 0 ${theme.spacing['2xl']};
        gap: ${theme.spacing.xl};
      }
    `;
  }}
`;

// ─── Logo ─────────────────────────────────────────────────────────────────────

export const LogoWrap = styled.button<{ $variant: TNavbarVariant }>`
  ${({ theme, $variant }) => {
    const tokens = getTokens($variant, theme);
    return css`
      padding: ${theme.spacing.xs};
      margin: ${theme.spacing.xs};
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: ${theme.spacing.sm};
      background: none;
      border: none;
      border-radius: ${theme.border.radius.md};
      cursor: pointer;
      color: ${tokens.logoColor};
      text-decoration: none;

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }
    `;
  }}
`;

export const LogoIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  svg {
    width: 100%;
    height: 100%;
  }
`;

export const LogoText = styled.span`
  ${({ theme }) => {
    return css`
      font-family: ${theme.typography.type.largeTitle.fontFamily};
      font-size: ${theme.typography.type.body.fontSize.md};
      font-weight: ${theme.typography.type.largeTitle.fontWeight};
      letter-spacing: -0.03em;
      white-space: nowrap;
      color: inherit;
    `;
  }}
`;

// ─── Links (desktop) ─────────────────────────────────────────────────────────

export const NavLinks = styled.nav<{
  $align: TNavLinksAlign;
  $variant: TNavbarVariant;
}>`
  ${({ theme, $align }) => {
    return css`
      display: none;

      @media (min-width: ${theme.breakpoint.md}) {
        display: flex;
        align-items: center;
        gap: ${theme.spacing.xs};
        flex: 1;
        justify-content: ${{
          left: 'flex-start',
          center: 'center',
          right: 'flex-end',
        }[$align]};
      }
    `;
  }}
`;

export const NavLinkItem = styled.a<{
  $variant: TNavbarVariant;
  $isActive: boolean;
}>`
  ${({ theme, $isActive, $variant }) => {
    const { spacing, border, typography } = theme;
    const t = getTokens($variant, theme);

    const fontWeight = $isActive ? typography.weight.semibold : typography.weight.medium;

    const color = $isActive ? t.linkActiveColor : t.linkColor;
    const background = $isActive ? t.linkActiveBg : 'transparent';

    return css`
      display: flex;
      align-items: center;
      gap: ${spacing.xs};
      padding: ${spacing.xs} ${spacing.sm};
      border-radius: ${border.radius.md};

      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      font-weight: ${fontWeight};

      color: ${color};
      background: ${background};

      text-decoration: none;
      white-space: nowrap;
      transition:
        background 0.15s ease,
        color 0.15s ease;
      cursor: pointer;

      &:hover:not([aria-current]) {
        color: ${t.linkHoverColor};
        background: ${t.actionHoverBg};
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }

      svg {
        width: 15px;
        height: 15px;
        opacity: 0.7;
      }
    `;
  }}
`;

// ─── Actions (right side) ─────────────────────────────────────────────────────

export const ActionsWrap = styled.div`
  ${({ theme }) => {
    return css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      margin-left: auto;
      flex-shrink: 0;
    `;
  }}
`;

export const ActionIconBtn = styled.button<{ $variant: TNavbarVariant }>`
  ${({ theme, $variant }) => {
    const t = getTokens($variant, theme);
    return css`
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: none;
      border: none;
      border-radius: ${theme.border.radius.md};
      cursor: pointer;
      color: ${t.actionColor};
      transition:
        background 0.15s ease,
        color 0.15s ease;

      &:hover {
        background: ${t.actionHoverBg};
        color: ${t.linkHoverColor};
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }

      svg {
        width: 18px;
        height: 18px;
      }
    `;
  }}
`;

const baseActionBtnStyles = (theme: DefaultTheme) => {
  const { spacing, border, typography } = theme;

  return css`
    gap: ${spacing.xs};
    padding: ${spacing.xs} ${spacing.md};
    border-radius: ${border.radius.md};

    font-family: ${typography.font.body};
    font-size: ${typography.size.sm};
    font-weight: ${typography.weight.medium};

    cursor: pointer;
    white-space: nowrap;

    transition:
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  `;
};

export const ActionBtn = styled.button<{
  $variant: TNavbarVariant;
  $primary: boolean;
}>`
  ${({ theme, $primary, $variant }) => {
    const t = getTokens($variant, theme);

    return css`
      display: flex;
      align-items: center;
      ${baseActionBtnStyles(theme)}

      svg {
        width: 15px;
        height: 15px;
      }

      &:focus-visible {
        outline: 1px solid
          ${theme.isDark
            ? colorMixAlpha(getColor(theme, 'primary', 900), ALPHAS[96])
            : getColor(theme, 'primary', 300)};
        outline-offset: 2px;
      }

      ${$primary
        ? css`
            background: ${theme.isDark
              ? getColor(theme, 'primary', 500)
              : getColor(theme, 'primary', 600)};
            color: ${theme.isDark
              ? getContrastText(theme, 'primary', 600)
              : getContrastText(theme, 'primary', 500)};
            border: 1px solid ${theme.color.primary[500]};
            &:hover {
              background: ${theme.color.primary[600]};
              border-color: ${theme.color.primary[600]};
              box-shadow: 0 0 0 2px
                ${theme.isDark
                  ? colorMixAlpha(getColor(theme, 'primary', 800), ALPHAS[96])
                  : getColor(theme, 'primary', 300)};
            }
          `
        : css`
            background: transparent;
            color: ${t.actionColor};
            border: 1px solid ${t.mobileLinkBorder};
            &:hover {
              background: ${t.actionHoverBg};
              color: ${t.linkHoverColor};
            }
          `}
    `;
  }}
`;

export const AvatarBtn = styled.button<{ $variant: TNavbarVariant }>`
  ${({ theme }) => {
    return css`
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: ${theme.isDark
        ? colorMixAlpha(getColor(theme, 'primary', 900), ALPHAS[96])
        : getColor(theme, 'primary', 100)};
      border: 2px solid transparent;
      border-radius: ${theme.border.radius.full};
      cursor: pointer;
      overflow: hidden;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;

      &:hover {
        border-color: ${theme.isDark
          ? colorMixAlpha(getColor(theme, 'primary', 800), ALPHAS[96])
          : getColor(theme, 'primary', 100)};
        box-shadow: 0 0 0 3px ${theme.effect.elevation.raised};
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `;
  }}
`;

export const AvatarInitials = styled.span`
  ${({ theme }) => {
    return css`
      font-family: ${theme.typography.type.body.fontFamily};
      font-size: ${theme.typography.type.body.fontSize.xs};
      font-weight: ${theme.typography.type.body.fontWeight};
      color: ${theme.color.text.primary};
      text-transform: uppercase;
      letter-spacing: 0.03em;
      line-height: 1;
    `;
  }}
`;

// ─── Divider (entre grupos de acciones) ──────────────────────────────────────

export const ActionDivider = styled.div<{ $variant: TNavbarVariant }>`
  ${({ theme, $variant }) => {
    const t = getTokens($variant, theme);

    return css`
      width: 1px;
      height: 20px;
      margin: 0 4px;
      background: ${t.mobileLinkBorder};
      flex-shrink: 0;
    `;
  }}
`;

// ─── Mobile hamburger ─────────────────────────────────────────────────────────

export const HamburgerBtn = styled.button<{ $variant: TNavbarVariant }>`
  ${({ theme, $variant }) => {
    const t = getTokens($variant, theme);

    return css`
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: none;
      border-radius: ${theme.border.radius.md};
      background: none;
      cursor: pointer;
      color: ${t.actionColor};

      svg {
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: ${t.actionHoverBg};
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }

      @media (min-width: ${theme.breakpoint.md}) {
        display: none;
      }
    `;
  }}
`;

// ─── Mobile menu drawer ───────────────────────────────────────────────────────

export const MobileMenu = styled.div<{
  $open: boolean;
  $variant: TNavbarVariant;
  $height: number;
}>`
  ${({ theme, $variant, $height, $open }) => {
    const { zIndex } = theme;
    const t = getTokens($variant, theme);

    const top = $height ? `${$height}px` : '0px';
    const maxHeight = $open ? '100dvh' : '0';
    const opacity = $open ? 1 : 0;

    return css`
      position: fixed;
      top: ${top};
      left: 0;
      right: 0;

      background: ${t.mobileMenuBg};
      border-bottom: ${t.border};

      max-height: ${maxHeight};
      opacity: ${opacity};

      transition:
        max-height 0.25s ease,
        opacity 0.2s ease;

      ${$variant === 'glass' &&
      css`
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      `}

      z-index: ${zIndex.sticky};
      overflow: hidden;

      @media (min-width: ${theme.breakpoint.md}) {
        display: none;
      }
    `;
  }}
`;

export const MobileMenuInner = styled.div`
  ${({ theme }) => {
    return css`
      padding: ${theme.spacing.sm} ${theme.spacing.lg};
      padding-bottom: ${theme.spacing.lg};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.xs};
    `;
  }}
`;

export const MobileLinkItem = styled.a<{
  $variant: TNavbarVariant;
  $isActive: boolean;
}>`
  ${({ theme, $variant, $isActive }) => {
    const { spacing, border, typography } = theme;
    const t = getTokens($variant, theme);

    const fontWeight = $isActive ? typography.weight.semibold : typography.weight.medium;

    const color = $isActive ? t.linkActiveColor : t.linkColor;
    const background = $isActive ? t.linkActiveBg : 'transparent';

    return css`
      display: flex;
      align-items: center;
      gap: ${spacing.sm};
      padding: ${spacing.sm} ${spacing.md};
      border-radius: ${border.radius.md};

      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      font-weight: ${fontWeight};

      color: ${color};
      background: ${background};

      text-decoration: none;
      cursor: pointer;

      transition:
        background 0.15s ease,
        color 0.15s ease;

      &:hover {
        background: ${t.actionHoverBg};
        color: ${t.linkHoverColor};
      }
      svg {
        width: 18px;
        height: 18px;
        opacity: 0.7;
      }
    `;
  }}
`;

export const MobileDivider = styled.div<{ $variant: TNavbarVariant }>`
  ${({ theme, $variant }) => {
    const t = getTokens($variant, theme);

    return css`
      height: 1px;
      margin: ${theme.spacing.xs} 0;
      background: ${t.mobileLinkBorder};
    `;
  }}
`;
