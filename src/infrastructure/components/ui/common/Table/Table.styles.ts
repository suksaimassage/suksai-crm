/**
 * Table — Styled Components
 * SRP: solo estilos. Mobile First.
 */

import styled, { css } from 'styled-components';
import type { TTableVariant, TTableSize } from './Table.types';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const ROW_HEIGHT: Record<TTableSize, string> = {
  sm: '36px',
  md: '44px',
  lg: '52px',
};

const CELL_PADDING: Record<TTableSize, string> = {
  sm: '6px 10px',
  md: '10px 14px',
  lg: '14px 18px',
};

const FONT_SIZE: Record<TTableSize, string> = {
  sm: '0.8125rem',
  md: '0.875rem',
  lg: '1rem',
};

// ─── Wrapper raíz ─────────────────────────────────────────────────────────────

export const TableRoot = styled.div`
  ${({ theme }) => {
    const { spacing, color, border } = theme;

    return css`
      width: 100%;
      margin: ${spacing.sm} 0;
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.border.color.neutral.medium};
      border-radius: ${border.radius.xl};
      background: ${color.background.light};
    `;
  }}
  overflow: hidden;
`;

// ─── Header ───────────────────────────────────────────────────────────────────

export const TableHeader = styled.div`
  ${({ theme }) => {
    const { spacing, breakpoint } = theme;

    return css`
      padding: ${spacing.md};
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: ${spacing.sm};
      border-bottom: 1px solid ${theme.border.color.neutral.light};

      @media (min-width: ${breakpoint.md}) {
        flex-wrap: nowrap;
        padding: ${spacing.md} ${spacing.lg};
      }
    `;
  }}
`;

export const HeaderLeft = styled.div`
  ${({ theme }) => {
    const { spacing, breakpoint } = theme;

    return css`
      min-width: 0;
      display: flex;
      align-items: center;
      flex: 1;
      gap: ${spacing.sm};
      flex-wrap: wrap;

      @media (min-width: ${breakpoint.md}) {
        flex-wrap: nowrap;
      }
    `;
  }}
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;
`;

export const TableTitle = styled.h3`
  ${({ theme }) => {
    const { typography, color } = theme;

    return css`
      margin: 0;
      font-family: ${typography.font.display};
      font-size: ${typography.size.md};
      font-weight: ${typography.weight.semibold};
      color: ${color.text.primary};
      white-space: nowrap;
    `;
  }}
`;

// ─── Body wrapper (scroll horizontal) ────────────────────────────────────────

export const TableBody = styled.div`
  ${({ theme }) => {
    const { color } = theme;

    const thumb = color.scrollbar.scrollbarThumb;
    const thumbHover = color.scrollbar.scrollbarThumbHover;
    const SCROLLBAR_SIZE = 3;
    const RADIUS = 4;

    return css`
      flex: 1;
      overflow-x: auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;

      scrollbar-color: ${thumb} transparent;

      &::-webkit-scrollbar {
        width: ${SCROLLBAR_SIZE}px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: ${thumb};
        border-radius: ${RADIUS}px;
        transition: background 0.15s ease;

        &:hover {
          background: ${thumbHover};
        }
      }
    `;
  }}
`;

// ─── Table nativo ─────────────────────────────────────────────────────────────

export const StyledTable = styled.table<{ $variant: TTableVariant }>`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: auto;
`;

// ─── THead ────────────────────────────────────────────────────────────────────

export const THead = styled.thead`
  /* Arena band — semantic surface so it flips correctly in dark mode (design §6, F1) */
  background: ${({ theme }) => theme.color.background.neutral};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
`;

export const Th = styled.th<{
  $size: TTableSize;
  $align: 'left' | 'center' | 'right';
  $sticky: boolean;
  $sortable: boolean;
}>`
  ${({ theme, $size, $align, $sortable, $sticky }) => {
    const { typography, color, zIndex, transition } = theme;

    const padding = CELL_PADDING[$size];
    const fontSize = FONT_SIZE[$size];
    const isSortable = $sortable;
    const isSticky = $sticky;
    // Arena band — semantic surface (flips in dark mode, design §6/F1). The sticky-left
    // Th paints the SAME arena fill as THead so there is no seam at the pinned corner.
    const baseBg = color.background.neutral;
    const hoverBg = color.background.neutral;
    const borderColor = theme.border.color.neutral.medium;
    const textColor = color.text.secondary;
    const hoverTextColor = color.text.primary;
    const focusRing = color.intent.focusRing;
    const fast = `${transition.duration.fast} ${transition.timing.easeOut}`;

    return css`
      padding: ${padding};
      font-family: ${typography.font.body};
      font-size: ${fontSize};
      font-weight: ${typography.weight.semibold};
      color: ${textColor};
      text-align: ${$align};
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
      user-select: none;
      border-bottom: 1px solid ${borderColor};
      background: ${baseBg};
      cursor: ${isSortable ? 'pointer' : 'default'};
      transition:
        background ${fast},
        color ${fast};

      ${isSticky
        ? css`
            background: ${baseBg};
            position: sticky;
            left: 0;
            z-index: ${zIndex.sticky + 1};

            &::after {
              width: 1px;
              content: '';
              position: absolute;
              top: 0;
              right: -1px;
              bottom: 0;

              background: ${borderColor};
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.06);
            }
          `
        : ''}

      ${isSortable
        ? css`
            &:hover {
              background: ${hoverBg};
              color: ${hoverTextColor};
            }
          `
        : ''}

      /* WCAG 2.2 AA (1.4.11) — sortable Th is clickable, so it must show a focus ring */
      &:focus-visible {
        outline: 2px solid ${focusRing};
        outline-offset: 2px;
      }
    `;
  }}
`;

export const ThInner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

export const SortIcon = styled.span<{
  $active: boolean;
  $direction: 'asc' | 'desc' | null;
}>`
  ${({ theme, $active }) => {
    const { color, transition } = theme;

    const isActive = $active;

    const opacity = isActive ? 1 : 0.8;
    const textColor = isActive ? color.primary[500] : color.neutral[800];
    const fast = `${transition.duration.fast} ${transition.timing.easeOut}`;
    const GAP = 1;

    return css`
      display: inline-flex;
      flex-direction: column;
      gap: ${GAP}px;
      opacity: ${opacity};
      color: ${textColor};
      transition:
        opacity ${fast},
        color ${fast};
    `;
  }}
`;

// ─── TBody ────────────────────────────────────────────────────────────────────

export const TBody = styled.tbody``;

export const Tr = styled.tr<{
  $variant: TTableVariant;
  $selected: boolean;
  $index: number;
  $clickable?: boolean;
}>`
  ${({ theme, $variant, $index, $selected, $clickable }) => {
    const { color, transition } = theme;

    const isSelected = $selected;
    const isStriped = $variant === 'striped';
    const isBordered = $variant === 'bordered';
    const isOdd = $index % 2 === 1;

    // Every state sets an explicit background. This is the load-bearing fix (design §3):
    // the sticky first-column Td uses `background: inherit`, which resolves to THIS row's
    // computed bg — so the pinned cell tracks default/striped/hover/selected with no per-cell logic.
    //   selected  → brand champagne wash (primary[50]) — clearly "chosen", persists through hover
    //   striped   → real alternation: odd = warm tint (background.light), even = card (near-white)
    //   default   → card surface (brightest band, so data pops forward)
    const baseBg = isSelected
      ? theme.isDark
        ? color.primary[900]
        : color.primary[50]
      : isStriped && isOdd
        ? color.background.light
        : color.background.card;
    // Selected stays selected on hover; otherwise a subtle warm step-up.
    const hoverBg = isSelected
      ? theme.isDark
        ? color.primary[900]
        : color.primary[50]
      : theme.isDark
        ? color.background.neutral
        : color.neutral[100];

    const borderColor = theme.border.color.neutral.medium;
    const fast = `${transition.duration.fast} ${transition.timing.easeOut}`;

    return css`
      background: ${baseBg};
      transition: background ${fast};
      ${$clickable ? 'cursor: pointer;' : ''}
      &:hover {
        background: ${hoverBg};
      }

      ${isBordered
        ? css`
            border-bottom: 1px solid ${borderColor};
          `
        : ''}

      &:last-child {
        border-bottom: none;
      }
    `;
  }}
`;

export const Td = styled.td<{
  $size: TTableSize;
  $align: 'left' | 'center' | 'right';
  $sticky: boolean;
}>`
  ${({ theme, $size, $align, $sticky }) => {
    const { typography, color, zIndex } = theme;

    const padding = CELL_PADDING[$size];
    const fontSize = FONT_SIZE[$size];
    const rowHeight = ROW_HEIGHT[$size];
    const isSticky = $sticky;
    const borderColor = theme.border.color.neutral.medium;
    const stickyDivider = theme.border.color.neutral.medium;

    return css`
      padding: ${padding};
      font-family: ${typography.font.body};
      font-size: ${fontSize};
      color: ${color.text.primary};
      text-align: ${$align};
      vertical-align: middle;
      min-height: ${rowHeight};
      border-bottom: 1px solid ${borderColor};

      ${isSticky
        ? css`
            position: sticky;
            left: 0;
            /* KEEP inherit — resolves to the parent Tr's computed bg incl. hover/selected (design §3) */
            background: inherit;
            z-index: ${zIndex.sticky};

            &::after {
              content: '';
              position: absolute;
              top: 0;
              right: -1px;
              bottom: 0;

              width: 1px;

              background: ${stickyDivider};
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.06);
            }
          `
        : ''}
    `;
  }}
`;

// ─── Checkbox cell ────────────────────────────────────────────────────────────

export const CheckboxTh = styled.th<{ $size: TTableSize }>`
  padding: ${({ $size }) => CELL_PADDING[$size]};
  width: 40px;
  min-width: 40px;
  /* Match the arena Th: same surface + same 1px bottom hairline (design §3) */
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.medium};
  background: ${({ theme }) => theme.color.background.neutral};
  position: sticky;
  top: 0;
  vertical-align: middle;
`;

export const CheckboxTd = styled.td<{ $size: TTableSize }>`
  padding: ${({ $size }) => CELL_PADDING[$size]};
  width: 40px;
  min-width: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.neutral.medium};
  position: sticky;
  left: 0;
  top: 0;
  /* inherit so the pinned checkbox tracks the row bg on horizontal scroll (design §3) */
  background: inherit;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  vertical-align: middle;
`;

// ─── Empty / Loading states ───────────────────────────────────────────────────

export const EmptyRow = styled.tr``;

export const EmptyCell = styled.td`
  ${({ theme }) => {
    const { spacing, color, typography } = theme;

    return css`
      padding: ${spacing.xl} ${spacing.md};
      text-align: center;
      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      color: ${color.text.tertiary};
    `;
  }}
`;

export const SkeletonRow = styled.tr``;

export const SkeletonCell = styled.td<{ $size: TTableSize }>`
  ${({ theme, $size }) => {
    const padding = CELL_PADDING[$size];
    const borderColor = theme.border.color.neutral.medium;

    return css`
      padding: ${padding};
      border-bottom: 1px solid ${borderColor};
    `;
  }}
`;

/**
 * .attrs mueve el width dinámico a style inline — evita generar una clase CSS por cada valor
 */
export const SkeletonLine = styled.span.attrs<{ $w?: string }>(({ $w }) => ({
  style: { width: $w ?? '70%' },
}))`
  ${({ theme }) => {
    const { color, border } = theme;

    const base = color.background.neutral;
    const highlight = color.background.neutral;

    return css`
      display: block;
      height: 12px;
      background: linear-gradient(90deg, ${base} 25%, ${highlight} 50%, ${base} 75%);
      background-size: 200% 100%;
      border-radius: ${border.radius.xs};
      animation: shimmer 1.4s infinite;

      @keyframes shimmer {
        0% {
          background-position: 200% center;
        }
        100% {
          background-position: -200% center;
        }
      }
    `;
  }}
`;

export const TableFooter = styled.div`
  ${({ theme }) => {
    const { spacing, color, breakpoint } = theme;

    const gap = spacing.sm;
    const paddingMobile = `${spacing.sm} ${spacing.md}`;
    const paddingDesktop = `${spacing.sm} ${spacing.lg}`;
    const borderColor = theme.border.color.neutral.medium;
    // Footer warm-tint band, explicit so it reads distinct from the body card surface
    // and stays correct in dark mode (design §6). Light: neutralWarm[50]; dark: neutralDark[800].
    const footerBg = color.background.light;

    return css`
      padding: ${paddingMobile};
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${gap};
      background: ${footerBg};
      border-top: 1px solid ${borderColor};
      flex-wrap: wrap;

      @media (min-width: ${breakpoint.md}) {
        padding: ${paddingDesktop};
        flex-wrap: nowrap;
      }
    `;
  }}
`;

export const PaginationWrap = styled.div`
  ${({ theme }) => {
    const { breakpoint } = theme;

    return css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      flex-wrap: wrap;

      @media (min-width: ${breakpoint.md}) {
        flex-wrap: nowrap;
      }
    `;
  }}
`;

export const PageBtn = styled.button<{ $active?: boolean }>`
  ${({ theme, $active }) => {
    const { spacing, border, color, typography } = theme;

    const isActive = Boolean($active);
    const borderColor = isActive ? color.primary[400] : theme.border.color.neutral.medium;
    const background = isActive ? color.primary[500] : 'transparent';
    const textColor = isActive ? theme.color.text.inverse : color.text.secondary;
    const fontWeight = isActive ? typography.weight.semibold : typography.weight.medium;

    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 ${spacing.xs};
      border-radius: ${border.radius.sm};
      border: 1px solid ${borderColor};
      background: ${background};
      color: ${textColor};
      font-family: ${typography.font.body};
      font-size: ${typography.size.xs};
      font-weight: ${fontWeight};
      cursor: pointer;
      white-space: nowrap;

      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &:not(:disabled):not([data-active]):hover {
        background: ${color.background.neutral};
        border-color: ${color.neutral[300]};
        color: ${color.text.primary};
      }
    `;
  }}
`;

// ─── Column toggle panel ──────────────────────────────────────────────────────

export const ColumnPanel = styled.div<{
  $open: boolean;
  $top: number;
  $right: number;
}>`
  ${({ theme, $top, $right, $open }) => {
    const { color, border, spacing, zIndex } = theme;

    const isOpen = $open;
    const opacity = isOpen ? 1 : 0;
    const pointerEvents = isOpen ? 'auto' : 'none';
    const transform = isOpen ? 'translateY(0)' : 'translateY(-6px)';

    return css`
      position: fixed;
      top: ${$top}px;
      right: ${$right}px;
      z-index: ${zIndex.popover};
      min-width: 200px;
      background: ${color.background.light};
      border: 1px solid ${theme.border.color.neutral.medium};
      border-radius: ${border.radius.lg};
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
      padding: ${spacing.xs} 0;
      opacity: ${opacity};
      pointer-events: ${pointerEvents};
      transform: ${transform};
      transition:
        opacity 0.15s ease,
        transform 0.15s ease;
    `;
  }}
`;

export const ColumnPanelHead = styled.div`
  ${({ theme }) => {
    const { spacing, typography, color } = theme;

    return css`
      padding: ${spacing.xs} ${spacing.md};
      font-family: ${typography.font.body};
      font-size: 10px;
      font-weight: ${typography.weight.semibold};
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: ${color.text.tertiary};
      border-bottom: 1px solid ${theme.border.color.neutral.light};
      margin-bottom: ${spacing.xs};
    `;
  }}
`;

export const ColumnPanelItem = styled.label`
  ${({ theme }) => {
    const { spacing, typography, color } = theme;

    const gap = spacing.sm;
    const padding = `${spacing.xs} ${spacing.md}`;
    const hoverBg = color.background.neutral;

    return css`
      display: flex;
      align-items: center;
      gap: ${gap};
      padding: ${padding};
      font-family: ${typography.font.body};
      font-size: ${typography.size.sm};
      color: ${color.text.primary};
      cursor: pointer;
      transition: background 0.1s ease;

      &:hover {
        background: ${hoverBg};
      }
    `;
  }}
`;

export const ColumnPanelWrapper = styled.div`
  display: inline-flex;
  flex-shrink: 0;
`;

// ─── Icon button (header toolbar) ────────────────────────────────────────────

export const PaginationInfo = styled.span`
  ${({ theme }) => {
    const { typography, color } = theme;
    return css`
      font-size: ${typography.size.sm};
      color: ${color.text.secondary};
      white-space: nowrap;
      flex-shrink: 0;
    `;
  }}
`;

export const IconBtn = styled.button<{ $active?: boolean }>`
  ${({ theme, $active }) => {
    const { border, color } = theme;

    const isActive = Boolean($active);
    const borderColor = isActive ? color.primary[300] : theme.border.color.neutral.medium;
    const background = isActive
      ? theme.isDark
        ? color.primary[900]
        : color.primary[50]
      : 'transparent';
    const textColor = isActive ? color.primary[600] : color.text.secondary;
    const hoverBg = color.background.neutral;
    const hoverBorder = color.neutral[300];
    const hoverText = color.text.primary;
    const focusRing = color.primary[400];

    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      border-radius: ${border.radius.md};
      border: 1px solid ${borderColor};
      background: ${background};
      color: ${textColor};
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;

      &:hover {
        background: ${hoverBg};
        border-color: ${hoverBorder};
        color: ${hoverText};
      }

      &:focus-visible {
        outline: 2px solid ${focusRing};
        outline-offset: 2px;
      }

      svg {
        width: 16px;
        height: 16px;
      }
    `;
  }}
`;
