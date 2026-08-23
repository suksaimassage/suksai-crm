import styled, { css, keyframes } from 'styled-components';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeSlideUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Card ─────────────────────────────────────────────────────────────────────

interface ISCardProps {
  $compact?: boolean;
}

export const SCard = styled.article<ISCardProps>`
  font-family: ${({ theme }) => theme.typography.font.body};
  width: 100%;
  overflow: hidden;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeSlideUp} 280ms ${({ theme }) => theme.effect.easing.out} both;
  }

  /* En modo compact, el outer Card.Body provee el padding. */
  padding: ${({ $compact, theme }) => ($compact ? '0' : theme.spacing.md)};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: ${({ $compact, theme }) => ($compact ? '0' : theme.spacing.lg)};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    padding: ${({ $compact, theme }) => ($compact ? '0' : theme.spacing.xl)};
  }
`;

// ─── Header ───────────────────────────────────────────────────────────────────

export const SHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

export const STitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.2;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
`;

export const SMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.text.tertiary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.duration.fast};
  flex-shrink: 0;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.color.neutral[50]};
    border-color: ${({ theme }) => theme.border.color.neutral.medium};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.secondary[500]};
    outline-offset: 2px;
  }
`;

// ─── Controls ─────────────────────────────────────────────────────────────────

export const SControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
  }
`;

export const SViewToggle = styled.div`
  display: flex;
  background: ${({ theme }) => theme.color.neutral[100]};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: 3px;
  flex-shrink: 0;
`;

interface ISViewButtonProps {
  $active: boolean;
}

export const SViewButton = styled.button<ISViewButtonProps>`
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.duration.fast};
  white-space: nowrap;

  ${({ $active, theme }) =>
    $active
      ? css`
          background: ${theme.color.background.light};
          color: ${theme.color.text.primary};
          box-shadow: ${theme.effect.shadow.outer.xs};
        `
      : css`
          background: transparent;
          color: ${theme.color.text.tertiary};
        `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.secondary[500]};
    outline-offset: 2px;
  }
`;

export const SNavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.light};
  color: ${({ theme }) => theme.color.text.secondary};
  font-size: ${({ theme }) => theme.typography.size.lg};
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition:
    border-color ${({ theme }) => theme.transition.duration.fast},
    color ${({ theme }) => theme.transition.duration.fast};

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.color.secondary[400]};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.secondary[500]};
    outline-offset: 2px;
  }
`;

export const SDateButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.light};
  color: ${({ theme }) => theme.color.text.primary};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex: 1 1 auto;
  min-width: 0;
  transition: border-color ${({ theme }) => theme.transition.duration.fast};

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.text.tertiary};
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.color.secondary[400]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.secondary[500]};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

// ─── Body: Grid + Sidebar ─────────────────────────────────────────────────────

export const SBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    gap: ${({ theme }) => theme.spacing.lg};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    flex-direction: row;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

// ─── Grid wrapper: horizontal scroll on mobile ────────────────────────────────

export const SGridWrapper = styled.div`
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.color.scrollbar.scrollbarThumb} transparent`};

  /* Fade affordance en el borde derecho para indicar scroll horizontal */
  mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    /* En desktop no hay overflow, quitar máscara */
    mask-image: none;
    -webkit-mask-image: none;
  }

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.color.scrollbar.scrollbarThumb};
    border-radius: ${({ theme }) => theme.border.radius.full};
  }
`;

// ─── Heatmap Grid ─────────────────────────────────────────────────────────────

interface ISGridProps {
  $cols: number;
}

export const SGrid = styled.div<ISGridProps>`
  display: grid;
  /* xs: 30 px min cell — 7 cols fit inside 320 px viewport without scroll */
  grid-template-columns: 40px ${({ $cols }) => `repeat(${$cols}, minmax(30px, 1fr))`};
  gap: 2px;
  min-width: ${({ $cols }) => 40 + $cols * 32}px;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: 52px ${({ $cols }) => `repeat(${$cols}, minmax(48px, 1fr))`};
    gap: 3px;
    min-width: ${({ $cols }) => 52 + $cols * 51}px;
  }
`;

// ─── Day column header ────────────────────────────────────────────────────────

export const SDayHeader = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.tertiary};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  user-select: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    padding-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

export const SDayHeaderToday = styled(SDayHeader)`
  color: ${({ theme }) => theme.color.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 4px;
    height: 4px;
    border-radius: ${({ theme }) => theme.border.radius.full};
    background: ${({ theme }) => theme.color.secondary[500]};
    margin: 2px auto 0;

    @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
      width: 6px;
      height: 6px;
      margin: 3px auto 0;
    }
  }
`;

// ─── Time row label ───────────────────────────────────────────────────────────

export const STimeLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.tertiary};
  height: 30px;
  white-space: nowrap;
  user-select: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    height: 44px;
    font-size: ${({ theme }) => theme.typography.size.xs};
    padding-right: ${({ theme }) => theme.spacing.sm};
  }
`;

// ─── Heatmap Cell ─────────────────────────────────────────────────────────────

interface ISCellProps {
  $bgColor: string;
  $textColor: string;
  $isEmpty: boolean;
  $selected: boolean;
}

export const SCell = styled.div<ISCellProps>`
  height: 30px;
  border-radius: ${({ theme }) => theme.border.radius.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    height: 44px;
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
  cursor: pointer;
  user-select: none;
  outline: none;
  position: relative;

  background: ${({ $bgColor, $isEmpty, theme }) =>
    $isEmpty ? (theme.isDark ? theme.color.neutral[600] : theme.color.neutral[50]) : $bgColor};
  color: ${({ $textColor, $isEmpty, theme }) =>
    $isEmpty ? theme.color.text.disabled : $textColor};

  transition:
    opacity ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    transform ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow ${({ theme }) => theme.transition.duration.fast};

  @media (prefers-reduced-motion: reduce) {
    transition: opacity ${({ theme }) => theme.transition.duration.fast};
  }

  ${({ $selected, theme }) =>
    $selected &&
    css`
      box-shadow: 0 0 0 2px ${theme.color.secondary[500]};
      z-index: ${theme.zIndex.base + 1};
    `}

  &:active {
    transform: scale(0.94);
    opacity: 0.85;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      opacity: 0.82;
      transform: scale(0.97);
    }
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.secondary[500]};
    z-index: ${({ theme }) => theme.zIndex.base + 1};
  }
`;

export const SCornerCell = styled.div``;

// ─── Side Panel (hidden on mobile, visible tablet+) ──────────────────────────

interface ISSidePanelProps {
  $forceVisible?: boolean;
}

export const SSidePanel = styled.aside<ISSidePanelProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};

  ${({ $forceVisible }) =>
    !$forceVisible &&
    css`
      display: none;
    `}

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    display: flex;
    flex: 0 0 180px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    flex: 0 0 200px;
  }
`;

export const SSectionTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  letter-spacing: 0.01em;
`;

export const SBusyList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const SBusyItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SBusyLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SBusyCount = styled.span`
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.tertiary};
`;

// ─── Mobile summary strip ─────────────────────────────────────────────────────

export const SMobileSummary = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    display: none;
  }
`;

export const SMobileSummaryChip = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.color.neutral[50]};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.md};
  gap: 2px;
  min-width: 120px;
`;

// ─── Color Legend ─────────────────────────────────────────────────────────────

export const SLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const SLegendBar = styled.div<{ $gradientCss: string }>`
  height: 10px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ $gradientCss }) => $gradientCss};
  width: 100%;
`;

export const SLegendLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
`;
