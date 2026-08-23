import styled from 'styled-components';

/**
 * CalendarWeekStrip.styles — week zone of the AgendaCalendarOverlay.
 *
 * Seven equal day cells (`repeat(7, minmax(0, 1fr))` — the `minmax(0,…)` keeps a
 * dense count phrase from stretching the track). The per-day appointment count is
 * the dominant datum; density is signalled through THREE redundant channels
 * (number + label + background tint), never colour alone (WCAG 1.4.1). Only theme
 * tokens; focus ring is always `intent.focusRing` (WCAG 1.4.11).
 */

export const StyledWeekStrip = styled.div`
  grid-area: week;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledWeekDayButton = styled.button<{
  $isSelected: boolean;
  $isToday: boolean;
  $isDayOff: boolean;
  $empty: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.md};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ $isSelected, theme }) =>
      $isSelected
        ? theme.color.brand.gold.border
        : theme.isDark
          ? theme.border.color.neutral.light
          : theme.border.color.neutral.subtle};
  background: ${({ $isSelected, $isToday, theme }) =>
    $isSelected
      ? theme.color.brand.gold.bg
      : $isToday
        ? theme.color.brand.agenda.nowTrackBg
        : 'transparent'};
  color: ${({ theme }) => theme.color.text.primary};
  cursor: pointer;
  transition:
    background 150ms ${({ theme }) => theme.transition.timing.easeOut},
    border-color 150ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (hover: hover) {
    &:hover {
      background: ${({ $isSelected, theme }) =>
        $isSelected ? theme.color.brand.gold.bg : theme.color.brand.gold.glow};
    }
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StyledWeekDayLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledWeekDayNumber = styled.span<{ $isToday: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  line-height: 1;
  color: ${({ $isToday, theme }) =>
    $isToday ? theme.color.text.primary : theme.color.text.secondary};
`;

/** Count pill — the loudest element of the cell (the payload). */
export const StyledWeekDayCount = styled.span<{ $empty: boolean; $isSelected: boolean }>`
  display: inline-flex;
  align-items: baseline;
  padding: ${({ theme }) => theme.spacing.xxs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.md};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  line-height: 1.2;
  color: ${({ theme }) => theme.color.text.primary};
  background: ${({ $empty, theme }) => ($empty ? 'transparent' : theme.color.brand.gold.bg)};
  opacity: ${({ $empty }) => ($empty ? 0.5 : 1)};
`;
