/**
 * Breadcrumb — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css } from 'styled-components';
import type { TBreadcrumbVariant } from './Breadcrumb.types';
import { ALPHAS, getColor, toRgba } from '@infra/styles/themes/theme.helpers';

// ─── Root ─────────────────────────────────────────────────────────────────────

export const BreadcrumbRoot = styled.nav<{ $variant: TBreadcrumbVariant }>`
  display: inline-flex;
  align-items: center;
  max-width: 100%;

  ${({ $variant, theme }) => {
    if ($variant === 'contained')
      return css`
        background: ${theme.color.neutral[50]};
        border: 1px solid ${theme.color.neutral[200]};
        border-radius: ${theme.border.radius.md};
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
      `;
    if ($variant === 'pills')
      return css`
        gap: 2px;
      `;
    return css``;
  }}
`;

// ─── Ordered list ─────────────────────────────────────────────────────────────

export const BreadcrumbList = styled.ol`
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  list-style: none;
`;

export const BreadcrumbLi = styled.li`
  display: flex;
  align-items: center;
  min-width: 0;
`;

// ─── Separator ────────────────────────────────────────────────────────────────

export const Separator = styled.span`
  ${({ theme }) => {
    return css`
      padding: 0 ${theme.spacing.xs};
      display: flex;
      align-items: center;
      flex-shrink: 0;
      color: ${theme.color.text.disabled};
      font-size: ${theme.typography.size.sm};
      user-select: none;
      line-height: 1;
    `;
  }}
`;

// ─── Item base styles ─────────────────────────────────────────────────────────

interface ItemProps {
  $variant: TBreadcrumbVariant;
  $isLast: boolean;
  // highlight o último ítem
  $isActive: boolean;
  $disabled: boolean;
}

const itemBase = css<ItemProps>`
  ${({ theme, $isLast, $isActive, $disabled }) => {
    const { transition } = theme;
    const cursor = $disabled ? 'not-allowed' : $isLast ? 'default' : 'pointer';
    const opacity = $disabled ? 0.45 : 1;

    return css`
      max-width: 200px;
      display: inline-flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      font-family: ${theme.typography.font.body};
      font-size: ${theme.typography.size.sm};
      line-height: 1;
      white-space: nowrap;
      text-overflow: ellipsis;
      border-radius: ${theme.border.radius.sm};
      /* Color base */
      color: ${$isActive || $isLast ? theme.color.text.primary : theme.color.text.secondary};

      font-weight: ${$isActive || $isLast
        ? theme.typography.weight.semibold
        : theme.typography.weight.medium};

      transition:
        color ${transition.duration.fast} ${transition.timing.ease},
        background ${transition.duration.fast} ${transition.timing.ease};
      cursor: ${cursor};
      opacity: ${opacity};

      overflow: hidden;

      svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: inherit;
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }
    `;
  }}
`;

// ─── Variant overrides ────────────────────────────────────────────────────────

const variantItem = css<ItemProps>`
  ${({ theme, $variant, $isLast, $isActive }) => {
    const { isDark } = theme;
    const isPills = $variant === 'pills';
    const isContained = $variant === 'contained';
    const isUnderline = $variant === 'underline';
    const isDefault = $variant === 'default';

    return css`
      /* pills */
      ${isPills &&
      css`
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        background: ${$isActive || $isLast
          ? isDark
            ? toRgba(getColor(theme, 'primary', 800), ALPHAS[32])
            : theme.color.primary[50]
          : 'transparent'};
        color: ${$isActive || $isLast
          ? isDark
            ? theme.color.primary[200]
            : theme.color.primary[600]
          : theme.color.text.secondary};
        &:not([aria-disabled]):hover {
          background: ${$isActive || $isLast
            ? isDark
              ? toRgba(getColor(theme, 'primary', 700), ALPHAS[32])
              : theme.color.primary[100]
            : theme.color.neutral[100]};
          color: ${$isActive || $isLast
            ? isDark
              ? theme.color.primary[200]
              : theme.color.primary[700]
            : theme.color.text.primary};
        }
      `}

      /* contained — mismo padding que pills pero sin hover en last */
      ${isContained &&
      css`
        padding: 2px ${theme.spacing.xs};
        color: ${
          $isActive || $isLast
            ? isDark
              ? theme.color.primary[200]
              : theme.color.primary[600]
            : theme.color.text.secondary
        };
        &:not([aria-disabled]):hover {
          color: ${
            $isActive || $isLast
              ? isDark
                ? theme.color.primary[200]
                : theme.color.primary[700]
              : theme.color.text.primary
          }};
        }
      `}

      /* underline — subrayado en activo/último */
      ${isUnderline &&
      ($isActive || $isLast) &&
      css`
        padding: 2px ${theme.spacing.xs};
        color: ${isDark ? theme.color.primary[200] : theme.color.primary[600]};
        text-decoration: underline;
        text-decoration-color: ${isDark ? theme.color.primary[200] : theme.color.primary[400]};
        text-underline-offset: 1px;
      `}

      /* default — hover sutil */
      ${isDefault &&
      !$isLast &&
      css`
        padding: 2px 4px;
        margin: 0 -4px;
        &:hover {
          color: ${theme.color.text.primary};
          background: ${theme.color.neutral[100]};
          border-radius: ${theme.border.radius.xs};
        }
      `}
    `;
  }}
`;

// ─── Item as <a> ─────────────────────────────────────────────────────────────

export const ItemLink = styled.a<ItemProps>`
  ${itemBase}
  ${variantItem}
  text-decoration: none;
`;

// ─── Item as <span> (no-link / current) ──────────────────────────────────────

export const ItemSpan = styled.span<ItemProps>`
  ${itemBase}
  ${variantItem}
`;

// ─── Params badge ─────────────────────────────────────────────────────────────

export const ParamBadge = styled.span`
  ${({ theme }) => {
    return css`
      padding: 1px 5px;
      margin-left: 3px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      background: ${theme.isDark
        ? toRgba(getColor(theme, 'primary', 800), ALPHAS[32])
        : theme.color.primary[200]};
      color: ${theme.color.primary[800]};
      border-radius: ${theme.border.radius.xs};
      font-family: ${theme.typography.font.mono};
      font-size: 10px;
      font-weight: ${theme.typography.weight.semibold};
      line-height: 1.5;
    `;
  }}
`;

// ─── Dropdown trigger ─────────────────────────────────────────────────────────

export const DropTrigger = styled.button<{
  $variant: TBreadcrumbVariant;
  $isActive: boolean;
}>`
  ${({ theme, $variant, $isActive }) => {
    const isPills = $variant === 'pills';
    const isDefault = $variant === 'default';

    return css`
      margin: ${isDefault ? '0 -4px' : '0'};
      padding: ${isPills ? `${theme.spacing.xs} ${theme.spacing.sm}` : '2px 4px'};
      display: inline-flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      font-family: ${theme.typography.font.body};
      font-size: ${theme.typography.size.sm};
      font-weight: ${$isActive ? theme.typography.weight.semibold : theme.typography.weight.medium};
      white-space: nowrap;
      color: ${$isActive ? theme.color.primary[600] : theme.color.text.secondary};
      background: ${isPills && $isActive ? theme.color.primary[50] : 'transparent'};
      border: none;
      border-radius: ${theme.border.radius.sm};
      cursor: pointer;

      transition:
        color 0.15s ease,
        background 0.15s ease;

      svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }

      &:hover {
        color: ${theme.color.text.primary};
        background: ${theme.color.neutral[100]};
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }
    `;
  }}
`;

export const ChevronIcon = styled.span<{ $open: boolean }>`
  display: flex;
  align-items: center;
  opacity: 0.6;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 0.15s ease;
`;

// ─── Dropdown panel ───────────────────────────────────────────────────────────

export const DropPanel = styled.div<{ $open: boolean }>`
  ${({ theme, $open }) => {
    return css`
      min-width: 180px;
      padding: ${theme.spacing.xs} 0;
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      z-index: ${theme.zIndex.dropdown};
      background: ${theme.color.background.light};
      border: 1px solid ${theme.color.neutral[200]};
      border-radius: ${theme.border.radius.md};
      box-shadow: ${theme.effect.shadow.outer.xl};
      pointer-events: ${$open ? 'auto' : 'none'};
      opacity: ${$open ? 1 : 0};
      transform: ${$open ? 'translateY(0)' : 'translateY(-4px)'};
      transition:
        opacity 0.15s ease,
        transform 0.15s ease;
    `;
  }}
`;

export const DropWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

export const DropOption = styled.a`
  ${({ theme }) => {
    return css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};
      padding: ${`${theme.spacing.sm} ${theme.spacing.md}`};
      font-family: ${theme.typography.font.body};
      font-size: ${theme.typography.size.sm};
      font-weight: ${theme.typography.weight.medium};
      color: ${theme.color.text.primary};
      text-decoration: none;
      cursor: pointer;
      transition: background 0.1s ease;

      svg {
        width: 14px;
        height: 14px;
        opacity: 0.6;
      }

      &:hover {
        background: ${theme.color.neutral[50]};
        color: ${theme.color.primary[600]};
        svg {
          opacity: 1;
        }
      }
    `;
  }}
`;

// ─── Collapsed ellipsis ───────────────────────────────────────────────────────

export const EllipsisBtn = styled.button`
  ${({ theme }) => {
    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: ${theme.border.radius.xs};
      background: ${theme.color.neutral[100]};
      border: 1px solid ${theme.color.neutral[200]};
      color: ${theme.color.text.tertiary};
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.05em;
      line-height: 1;
      transition: background 0.15s ease;

      &:hover {
        background: ${theme.color.neutral[200]};
      }

      &:focus-visible {
        outline: 2px solid ${theme.color.primary[400]};
        outline-offset: 2px;
      }
    `;
  }}
`;
