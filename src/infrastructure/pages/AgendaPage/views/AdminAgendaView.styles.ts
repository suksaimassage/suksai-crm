import styled from 'styled-components';

export const StyledAdminKpis = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;

  /* tablet: 3 columns */
  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  /* tablet portrait: 2 columns */
  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: repeat(2, 1fr);

    /* 5 KPIs is odd — last item stretches full width */
    & > *:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }

  /* mobile: tighter gap */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    gap: 10px;
  }
`;

export const StyledFilterBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 14px;

  /* On xs screens, allow the bar itself to scroll horizontally so it never
     causes page-level overflow */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const StyledDatePager = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: 999px;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
`;

export const StyledDatePagerBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.neutral : theme.color.neutralWarm[200]};
  cursor: pointer;
  display: grid;
  place-items: center;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[500])};
  transition: background 150ms;
  /* WCAG 2.5.5 — minimum touch target 44 × 44 px */
  min-width: 44px;
  min-height: 44px;

  &:hover {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.neutral : theme.color.neutralWarm[200]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    display: block;
  }
`;

export const StyledDatePagerLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  font-weight: 600;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.primary : theme.color.brand.ink[900])};
  white-space: nowrap;
  /* Rendered as a button (jump-to-today) — reset native chrome. */
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.neutral : theme.color.neutralWarm[200]};
  border: none;
  border-radius: 999px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledTodayChip = styled.button`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  font-weight: 600;
  padding: 0 10px;
  /* WCAG 2.5.5 — minimum touch target 44 × 44 px */
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.medium : theme.color.neutralWarm[300]};
  background: transparent;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[700])};
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms;

  &:hover {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.neutral : theme.color.neutralWarm[200]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledDatePickerPopup = styled.div`
  position: absolute;
  z-index: 100;
`;

export const StyledSegmented = styled.div`
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 999px;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[100]};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.subtle};
`;

export const StyledSegmentBtn = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  /* WCAG 2.5.5 — minimum touch target 44 × 44 px */
  min-height: 44px;
  transition:
    background 150ms,
    color 150ms;
  color: ${({ $active, theme }) =>
    $active
      ? theme.isDark
        ? theme.color.text.primary
        : theme.color.brand.ink[900]
      : theme.isDark
        ? theme.color.text.secondary
        : theme.color.brand.ink[500]};
  background: ${({ $active, theme }) =>
    $active
      ? theme.isDark
        ? theme.color.background.elevated
        : theme.color.background.card
      : 'transparent'};
  box-shadow: ${({ $active }) => ($active ? '0 1px 2px 0 oklch(0.11 0.03 204 / 0.08)' : 'none')};

  &:hover:not([data-active='true']) {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.neutral : 'rgba(0, 0, 0, 0.04)'};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledFilterChipGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  /* On very small phones prevent chip overflow from causing horizontal page scroll */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    /* Allow the group to shrink below its content width */
    min-width: 0;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const StyledFilterChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px 7px 11px;
  border-radius: 999px;
  /* WCAG 2.5.5 — minimum touch target 44 × 44 px */
  min-height: 44px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active
        ? theme.isDark
          ? theme.color.brand.gold[400]
          : theme.color.brand.gold[300]
        : theme.isDark
          ? theme.border.color.neutral.medium
          : theme.color.neutralWarm[200]};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  cursor: pointer;
  transition:
    border-color 150ms,
    background 150ms;
  background: ${({ $active, theme }) =>
    $active
      ? theme.isDark
        ? theme.color.brand.gold.bg
        : theme.color.brand.gold[50]
      : theme.color.background.card};
  color: ${({ $active, theme }) =>
    $active
      ? theme.isDark
        ? theme.color.brand.gold[300]
        : theme.color.brand.gold[700]
      : theme.isDark
        ? theme.color.text.secondary
        : theme.color.brand.ink[500]};

  &:hover {
    border-color: ${({ theme }) => theme.color.brand.gold[400]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

export const StyledFilterSep = styled.span`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.border.color.neutral.medium};
  flex-shrink: 0;
`;

export const StyledAdminGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledKpiMiniCard = styled.article<{ $accent: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  overflow: hidden;
  position: relative;

  background: ${({ $accent, theme }) =>
    $accent
      ? `radial-gradient(ellipse at 20% 12%, ${theme.color.brand.gold.bgHero}, transparent 55%),
         linear-gradient(180deg, ${theme.color.brand.jungle[900]} 0%, ${theme.color.brand.jungle[700]} 100%)`
      : theme.color.background.card};
`;

export const StyledKpiMiniLabel = styled.span<{ $accent: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ $accent, theme }) =>
    $accent
      ? theme.color.brand.gold[300]
      : theme.isDark
        ? theme.color.text.secondary
        : theme.color.brand.ink[500]};
`;

export const StyledKpiMiniValue = styled.span<{ $accent: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  font-weight: 300;
  line-height: 1;
  color: ${({ $accent, theme }) =>
    $accent
      ? theme.color.brand.gold[50]
      : theme.isDark
        ? theme.color.text.primary
        : theme.color.brand.ink[900]};

  em {
    font-style: normal;
    font-size: 0.55em;
    color: ${({ $accent, theme }) =>
      $accent
        ? theme.color.brand.gold[300]
        : theme.isDark
          ? theme.color.text.secondary
          : theme.color.brand.ink[500]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
`;

export const StyledKpiMiniSub = styled.span<{ $accent: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11.5px;
  color: ${({ $accent, theme }) =>
    $accent
      ? theme.color.brand.gold.subText
      : theme.isDark
        ? theme.color.text.secondary
        : theme.color.brand.ink[500]};
  margin-top: 2px;
`;

/** Right-pinned cluster (Nueva-cita) that wraps gracefully (§2.3). */
export const StyledFilterBarRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
  }
`;

/** Configuration empty-state wrapper when the user has no centre (§3.8). */
export const StyledNullCentroWrap = styled.div`
  padding: 48px 24px;
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
`;

export const StyledNewAppointmentButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  min-height: 44px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: ${({ theme }) =>
    theme.isDark ? theme.color.brand.jungle[700] : theme.color.brand.ink[900]};
  color: ${({ theme }) => theme.color.neutralWarm[50]};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background 200ms;

  &:hover:not(:disabled) {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.brand.gold[700] : theme.color.brand.jungle[700]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    flex: 1;
  }
`;

export const StyledModeEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 16px;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[500])};
`;
