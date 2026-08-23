import styled from 'styled-components';
import type { TEstadoCita } from '@domain/types';
import type { TTheme } from '@infra/styles/themes/light.theme';

export const StyledList = styled.section`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  border-radius: 16px;
  overflow: hidden;
`;

export const StyledListEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 14px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
`;

// ── Day group ─────────────────────────────────────────────────────────────────

export const StyledListDayGroup = styled.div`
  display: flex;

  & + & {
    border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) =>
        theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  }

  /* The 80px day-label sidebar eats too much of a phone's width from every
     row underneath it — stack it as a compact header bar above the day's
     items instead. */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-direction: column;
  }
`;

export const StyledListDayLabel = styled.div`
  width: 80px;
  flex-shrink: 0;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: 100%;
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-start;
    gap: 8px;
    padding: 8px 14px;
    border-right: none;
    border-bottom: ${({ theme }) => theme.border.width.xs}
      ${({ theme }) => theme.border.style.solid}
      ${({ theme }) =>
        theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  }
`;

export const StyledListDayName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[500]};
`;

export const StyledListDayNumber = styled.span<{ $isToday: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 26px;
  font-weight: 300;
  line-height: 1;
  color: ${({ $isToday, theme }) =>
    $isToday
      ? theme.isDark
        ? theme.color.brand.gold[300]
        : theme.color.brand.clay[500]
      : theme.isDark
        ? theme.color.text.primary[300]
        : theme.color.brand.ink[900]};
`;

export const StyledListDayItems = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// ── Individual list item ──────────────────────────────────────────────────────

export const StyledListItem = styled.div<{ $selected?: boolean; $optimistic?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  cursor: pointer;
  transition: background 120ms;
  background: ${({ $selected, theme }) => ($selected ? theme.color.brand.gold[50] : 'transparent')};
  opacity: ${({ $optimistic }) => ($optimistic ? 0.6 : 1)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 2px 0 0 0 ${theme.color.brand.gold[400]}` : 'none'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.light : theme.color.neutralWarm[50]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: -2px;
  }

  /* Time(52px) + Right(status badge+sala, unconstrained) leave too little
     room for the client name on a phone — let Right wrap onto its own full
     line instead of squeezing Meta down to near-nothing. */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-wrap: wrap;
  }
`;

export const StyledListItemTime = styled.div`
  width: 52px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;

export const StyledListItemStartTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[900]};
`;

export const StyledListItemEndTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 11px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[500]};
`;

export const StyledListItemMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const StyledListItemClient = styled.span<{ $struck?: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.text.primary[100] : theme.color.brand.ink[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: ${({ $struck }) => ($struck ? 'line-through' : 'none')};
  opacity: ${({ $struck }) => ($struck ? 0.7 : 1)};
`;

/** Leading estado glyph inside the status badge (aria-hidden). */
export const StyledListStatusGlyph = styled.span`
  margin-right: 4px;
  font-size: 10px;
  line-height: 1;
`;

export const StyledListItemService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledListItemRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;

  /* Wraps onto its own full-width second line (StyledListItem's flex-wrap)
     instead of competing with the client name for space on one line. */
  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-left: 66px; /* aligns with StyledListItemMeta's start (52px time + 14px gap) */
  }
`;

export const StyledListItemSala = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};
`;

// ── Status badge ──────────────────────────────────────────────────────────────

function estadoBadgeStyles(estado: TEstadoCita, theme: TTheme): string {
  switch (estado) {
    case 'completada':
      return `background:${theme.isDark ? theme.color.brand.jungle[700] : theme.color.brand.jungle.bg};color:${theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.jungle[700]};border-color:${theme.color.brand.jungle.border};`;
    case 'confirmada':
      return `background:${theme.isDark ? theme.color.brand.gold[700] : theme.color.brand.gold.bg};color:${theme.isDark ? theme.color.brand.gold[100] : theme.color.brand.gold[700]};border-color:${theme.color.brand.gold.border};`;
    case 'en_curso':
      return `background:${theme.isDark ? theme.color.brand.clay[600] : theme.color.brand.clay.bg};color:${theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.clay[600]};border-color:${theme.color.brand.clay.border};`;
    case 'pendiente':
      return `background:${theme.isDark ? theme.color.neutralWarm[100] : theme.color.neutralWarm[100]};color:${theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};border-color:${theme.color.brand.gold.border};`;
    case 'cancelada':
      return `background:${theme.isDark ? theme.color.neutralWarm[100] : theme.color.neutralWarm[100]};color:${theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.ink[500]};border-color:${theme.color.neutralWarm[300]};`;
    case 'no_presentado':
      return `background:${theme.isDark ? theme.color.brand.lotus.bg : theme.color.brand.lotus.bg};color:${theme.isDark ? theme.color.brand.lotus.text : theme.color.brand.lotus.text};border-color:${theme.color.brand.lotus.border};`;
    case 'sin_asignar':
      return `background:${theme.isDark ? theme.color.background.dark : theme.color.neutralWarm[50]};color:${theme.color.text.muted};border-color:${theme.border.color.neutral.light};`;
  }
}

export const StyledListStatusBadge = styled.span<{ $estado: TEstadoCita }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  ${({ $estado, theme }) => estadoBadgeStyles($estado, theme)}
`;
