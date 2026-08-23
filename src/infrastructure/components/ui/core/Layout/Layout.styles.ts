/**
 * Layout — Styled Components
 *
 * Estilos de todos los componentes semánticos de layout.
 * Mobile First: estilos base para móvil, media queries para desktop.
 *
 * Principios:
 * - DRY: todos los valores (spacing, colors, breakpoints) vienen del theme.
 * - Sin magic numbers: cada valor tiene un token semántico.
 * - Open/Closed: extensible via props transientes ($prefix).
 */
import type { CSSProperties } from 'react';
import styled, { css, type DefaultTheme } from 'styled-components';
import type { TContainerSize, TDividerOrientation, TDividerVariant } from './Layout.types';
import { getSpacingValue } from '@infra/components/ui/core/Spacing/Spacing.utils';
import type { TSpacingValue } from '@infra/components/ui/core/Spacing/Spacing.types';
import { resolveSpacing } from '@infra/components/ui/core/Grid/Grid.styles';

// ─── Max-width map ─────────────────────────────────────────────────────────

const CONTAINER_MAX_WIDTH: Record<TContainerSize, string> = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  full: '100%',
};

// ─── Container ─────────────────────────────────────────────────────────────

const resolveGutter = ({ theme, gutter }: { theme: DefaultTheme; gutter?: TSpacingValue }) => {
  // Custom gutter
  if (gutter !== undefined) {
    const v = getSpacingValue(gutter);
    return css`
      padding-left: ${v};
      padding-right: ${v};
    `;
  }

  // Default responsive gutter
  return resolveSpacing(
    ['padding-left', 'padding-right'],
    { xs: 'md', md: 'xl', xl: '2xl' },
    theme,
  );
};

export const StyledContainer = styled.div<{
  $size: TContainerSize;
  $center?: boolean;
  $gutter?: TSpacingValue;
}>`
  ${({ theme, $size, $center, $gutter }) => css`
    width: 100%;
    max-width: ${CONTAINER_MAX_WIDTH[$size]};

    /* Center */
    ${$center &&
    css`
      margin-left: auto;
      margin-right: auto;
    `}

    /* Gutter */
    ${resolveGutter({ theme: theme, gutter: $gutter })}

    scrollbar-width: thin;
    scrollbar-color: ${theme.color.neutral[300]} transparent;

    &::-webkit-scrollbar {
      width: 3px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: ${theme.color.neutral[300]};
      border-radius: 4px;

      &:hover {
        background: ${theme.color.neutral[200]};
      }
    }
  `}
`;

// ─── PageLayout ────────────────────────────────────────────────────────────

export const StyledPageLayout = styled.main<{
  $py?: TSpacingValue;
  $background?: CSSProperties['background'];
}>`
  width: 100%;
  min-height: 100dvh;
  background: ${({ $background, theme }) => $background ?? theme.color.background.light};

  ${({ $py }) => {
    const v = getSpacingValue($py);
    return (
      v &&
      css`
        padding-top: ${v};
        padding-bottom: ${v};
      `
    );
  }}

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.color.neutral[300]} transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.color.neutral[300]};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) => theme.color.neutral[200]};
    }
  }
`;

// ─── Section ───────────────────────────────────────────────────────────────

export const StyledSection = styled.section<{
  $py?: TSpacingValue;
  $px?: TSpacingValue;
  $background?: CSSProperties['background'];
  $align?: 'left' | 'center' | 'right';
  $minHeight?: string;
}>`
  width: 100%;
  position: relative;
  background: ${({ $background }) => $background ?? 'transparent'};

  ${({ $minHeight }) =>
    $minHeight &&
    css`
      min-height: ${$minHeight};
    `}

  ${({ $align }) =>
    $align === 'center' &&
    css`
      display: flex;
      flex-direction: column;
      align-items: center;
    `}

  ${({ $align }) =>
    $align === 'right' &&
    css`
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    `}

  ${({ $px }) => {
    const v = getSpacingValue($px);
    return (
      v &&
      css`
        padding-left: ${v};
        padding-right: ${v};
      `
    );
  }}

  ${({ $py, theme }) => {
    if ($py !== undefined) {
      const v = getSpacingValue($py);
      return css`
        padding-top: ${v};
        padding-bottom: ${v};
      `;
    }
    return css`
      padding-top: ${theme.spacing['2xl']};
      padding-bottom: ${theme.spacing['2xl']};

      @media (min-width: ${theme.breakpoint.md}) {
        padding-top: ${theme.spacing['3xl']};
        padding-bottom: ${theme.spacing['3xl']};
      }

      @media (min-width: ${theme.breakpoint.lg}) {
        padding-top: ${theme.spacing['4xl']};
        padding-bottom: ${theme.spacing['4xl']};
      }
    `;
  }}
`;

// ─── Article ───────────────────────────────────────────────────────────────

export const StyledArticle = styled.article<{
  $p?: TSpacingValue;
  $maxWidth?: string;
  $prose?: boolean;
  $elevated?: boolean;
}>`
  ${({ $maxWidth }) =>
    $maxWidth &&
    css`
      max-width: ${$maxWidth};
    `}

  ${({ $p, theme }) => {
    if ($p !== undefined) {
      const v = getSpacingValue($p);
      return css`
        padding: ${v};
      `;
    }
    return css`
      padding: ${theme.spacing.lg};
      @media (min-width: ${theme.breakpoint.md}) {
        padding: ${theme.spacing['2xl']};
      }
    `;
  }}

  ${({ $elevated, theme }) =>
    $elevated &&
    css`
      background: ${theme.color.background.light};
      border: 1px solid ${theme.color.neutral[200]};
      border-radius: ${theme.border.radius.xl};
      box-shadow: ${theme.effect.shadow.outer.md};
    `}

  ${({ $prose, theme }) =>
    $prose &&
    css`
      font-family: ${theme.typography.font.body};
      font-size: ${theme.typography.size.md};
      line-height: 1.75;
      color: ${theme.color.text.primary};

      & > * + * {
        margin-top: ${theme.spacing.md};
      }

      & > h1,
      & > h2,
      & > h3,
      & > h4,
      & > h5,
      & > h6 {
        font-family: ${theme.typography.font.display};
        color: ${theme.color.text.primary};
        line-height: 1.25;
        margin-top: ${theme.spacing['2xl']};
        margin-bottom: ${theme.spacing.sm};
        &:first-child {
          margin-top: 0;
        }
      }

      & > p {
        color: ${theme.color.text.secondary};
        line-height: 1.75;
      }

      & > ul,
      & > ol {
        padding-left: ${theme.spacing.lg};
        color: ${theme.color.text.secondary};
        & > li + li {
          margin-top: ${theme.spacing.xs};
        }
      }

      & > blockquote {
        border-left: 3px solid ${theme.color.primary[500]};
        padding-left: ${theme.spacing.lg};
        margin-left: 0;
        color: ${theme.color.text.tertiary};
        font-style: italic;
      }

      & > pre {
        font-family: ${theme.typography.font.mono};
        font-size: ${theme.typography.size.sm};
        background: ${theme.color.neutral[100]};
        border-radius: ${theme.border.radius.md};
        padding: ${theme.spacing.md};
        overflow-x: auto;
      }

      & > code {
        font-family: ${theme.typography.font.mono};
        font-size: ${theme.typography.size.sm};
        background: ${theme.color.neutral[100]};
        border-radius: ${theme.border.radius.xs};
        padding: 2px 6px;
      }
    `}
`;

// ─── Aside ─────────────────────────────────────────────────────────────────

export const StyledAside = styled.aside<{
  $p?: TSpacingValue;
  $width?: string;
  $border?: 'start' | 'end' | 'none';
}>`
  ${({ $width }) =>
    $width &&
    css`
      width: ${$width};
      flex-shrink: 0;
    `}

  ${({ $p, theme }) => {
    const v = getSpacingValue($p ?? 'lg');
    return css`
      padding: ${v ?? theme.spacing.lg};
    `;
  }}

  ${({ $border, theme }) => {
    if ($border === 'start')
      return css`
        border-left: 1px solid ${theme.color.neutral[200]};
      `;
    if ($border === 'end')
      return css`
        border-right: 1px solid ${theme.color.neutral[200]};
      `;
    return '';
  }}
`;

// ─── SectionHeader ─────────────────────────────────────────────────────────

export const StyledSectionHeader = styled.header<{
  $py?: TSpacingValue;
  $px?: TSpacingValue;
  $bordered?: boolean;
}>`
  width: 100%;

  ${({ $py, theme }) => {
    const v = getSpacingValue($py ?? 'lg');
    return css`
      padding-top: ${v ?? theme.spacing.lg};
      padding-bottom: ${v ?? theme.spacing.lg};
    `;
  }}

  ${({ $px }) => {
    const v = getSpacingValue($px);
    return (
      v &&
      css`
        padding-left: ${v};
        padding-right: ${v};
      `
    );
  }}

  ${({ $bordered, theme }) =>
    $bordered &&
    css`
      border-bottom: 1px solid ${theme.color.neutral[200]};
      margin-bottom: ${theme.spacing.lg};
    `}
`;

// ─── SectionFooter ─────────────────────────────────────────────────────────

export const StyledSectionFooter = styled.footer<{
  $py?: TSpacingValue;
  $bordered?: boolean;
  $align?: 'left' | 'center' | 'right' | 'between';
}>`
  width: 100%;

  ${({ $py, theme }) => {
    const v = getSpacingValue($py ?? 'lg');
    return css`
      padding-top: ${v ?? theme.spacing.lg};
      padding-bottom: ${v ?? theme.spacing.lg};
    `;
  }}

  ${({ $bordered, theme }) =>
    $bordered &&
    css`
      border-top: 1px solid ${theme.color.neutral[200]};
      margin-top: ${theme.spacing.lg};
    `}

  ${({ $align }) => {
    const map: Record<string, string> = {
      center: 'center',
      right: 'flex-end',
      between: 'space-between',
    };
    const justify = $align ? map[$align] : undefined;
    return justify
      ? css`
          display: flex;
          align-items: center;
          justify-content: ${justify};
          gap: 12px;
        `
      : '';
  }}
`;

// ─── Divider ───────────────────────────────────────────────────────────────

export const StyledDivider = styled.hr<{
  $orientation: TDividerOrientation;
  $variant: TDividerVariant;
  $spacing?: TSpacingValue;
  $color?: string;
  $hasLabel?: boolean;
}>`
  border: none;
  outline: none;

  ${({ $orientation, $variant, $spacing, $color, $hasLabel, theme }) => {
    const margin = getSpacingValue($spacing) ?? theme.spacing.lg;
    const lineColor = $color ?? theme.color.neutral[200];
    const border = `1px ${$variant} ${lineColor}`;

    if ($orientation === 'vertical') {
      return css`
        display: inline-block;
        width: 0;
        height: 100%;
        border-left: ${border};
        margin-left: ${margin};
        margin-right: ${margin};
        align-self: stretch;
      `;
    }

    if ($hasLabel) {
      return css`
        margin-top: ${margin};
        margin-bottom: ${margin};
        text-align: center;
        line-height: 1em;
        position: relative;

        &::before {
          content: '';
          background-color: ${lineColor};
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
        }

        &::after {
          content: attr(data-content);
          position: relative;
          display: inline-block;
          color: ${({ theme }) => theme.color.text.primary};

          padding: 0 0.5em;
          line-height: 1.5em;
          // this is really the only tricky part, you need to specify the background color of the container element...
          background-color: ${({ theme }) => theme.color.background.light};
        }
      `;
    }

    return css`
      display: block;
      width: 100%;
      border-top: ${border};
      margin-top: ${margin};
      margin-bottom: ${margin};
    `;
  }}
`;

export const DividerLabel = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.tertiary};
  white-space: nowrap;
  user-select: none;
`;

const HEADER_HEIGHT = '65px';

export const StyledDashbordLayout = styled.div<{ $collapsed?: boolean }>`
  display: grid;
  /* Cover the viewport and GROW with content — scroll lives on the body, not
     trapped inside the grid (100dvh handles the mobile URL-bar collapse). */
  min-height: 100dvh;

  /* Mobile First - Stack vertical (sin sidebar en grid) */
  grid-template-areas:
    'header'
    'content'
    'footer';
  grid-template-rows: ${HEADER_HEIGHT} 1fr auto;
  grid-template-columns: 1fr;

  /* Desktop - Sidebar en grid — solo desde lg; mobile y tablet usan overlay drawer */
  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: ${({ $collapsed }) =>
      $collapsed ? '80px minmax(0, 1fr)' : '260px minmax(0, 1fr)'};
    grid-template-rows: ${HEADER_HEIGHT} 1fr auto;
    grid-template-areas:
      'sidebar header'
      'sidebar content'
      'sidebar footer';
    /* DINÁMICO: Cambia según estado collapsed */
    transition: grid-template-columns 0.3s ease;
  }
`;
