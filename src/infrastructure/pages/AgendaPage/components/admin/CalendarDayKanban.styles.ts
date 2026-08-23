import styled from 'styled-components';
import type { TAgendaTherapistColor } from '@domain/types';
import type { TTheme } from '@infra/styles/themes/light.theme';
import type { TKanbanColumnId } from '../../agenda.constants';

/**
 * CalendarDayKanban.styles — the bottom-left "kanban" zone of the overlay.
 *
 * Two columns (sinAsignar / asignadas). Each column scrolls
 * independently (`min-height: 0; overflow-y: auto`) so a busy day never pushes the
 * overlay card past its max height. Column identity is carried by an inline SVG
 * icon + a text label (never colour alone). Card identity (the therapist) is on a
 * `border-left`; the focus ring is always `intent.focusRing`. Only theme tokens.
 */

// ── Therapist accent → border-left colour (mirrors the week-grid idiom) ────────
function therapistAccent(color: TAgendaTherapistColor, theme: TTheme): string {
  const acc = theme.color.brand.therapistAccent;
  switch (color) {
    case 'a':
      return acc.a;
    case 'b':
      return acc.b;
    case 'c':
      return acc.c;
    case 'd':
      return acc.d;
    case 'e':
      return acc.e;
    case 'f':
      return acc.f;
  }
}

function columnAccent(columnId: TKanbanColumnId, theme: TTheme): string {
  switch (columnId) {
    case 'sinAsignar':
      return theme.color.intent.warning;
    case 'asignadas':
      return theme.color.intent.success;
  }
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export const StyledKanban = styled.section`
  grid-area: kanban;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  min-height: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.color.background.card};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledKanbanTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.text.primary};
`;

/**
 * Both columns keep a comfortable minimum width and scroll HORIZONTALLY as a
 * unit if the kanban panel itself is narrower than that (e.g. the overlay's
 * side-by-side kanban|form layout on a tablet) rather than stacking the two
 * columns — the panel's OWN vertical scroll (per-column StyledKanbanList)
 * stays independent of this horizontal one.
 */
export const StyledKanbanColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  min-height: 0;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

export const StyledKanbanColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 0;
`;

export const StyledKanbanColumnHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledKanbanColumnIcon = styled.span<{ $columnId: TKanbanColumnId }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $columnId, theme }) => columnAccent($columnId, theme)};
`;

export const StyledKanbanColumnTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledKanbanColumnCount = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xxs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.text.secondary};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.dark : theme.color.background.neutral};
`;

export const StyledKanbanList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 0;
  overflow-y: auto;
`;

export const StyledKanbanEmpty = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md} 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
`;

// ── Card ─────────────────────────────────────────────────────────────────────

export const StyledKanbanCard = styled.button<{
  $accent: TAgendaTherapistColor | null;
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.elevated : theme.color.background.light};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.light};
  border-left: ${({ theme }) => theme.border.width.md} ${({ theme }) => theme.border.style.solid}
    ${({ $accent, theme }) =>
      $accent === null ? theme.color.intent.warning : therapistAccent($accent, theme)};
  border-radius: ${({ theme }) => theme.border.radius.md};
  cursor: pointer;
  transition: box-shadow 150ms ${({ theme }) => theme.transition.timing.easeOut};

  @media (hover: hover) {
    &:hover {
      box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
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

export const StyledKanbanCardTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size.md};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledKanbanCardService = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledKanbanCardMeta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  line-height: 1.35;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledKanbanMetaItem = styled.span<{ $unassigned: boolean }>`
  color: ${({ $unassigned, theme }) =>
    $unassigned ? theme.color.intent.warning : theme.color.text.secondary};
  font-weight: ${({ $unassigned, theme }) =>
    $unassigned ? theme.typography.weight.semibold : theme.typography.weight.regular};
`;

export const StyledKanbanMetaSep = styled.span`
  color: ${({ theme }) => theme.color.text.muted};
`;

// ── Status bands (loading / error) ────────────────────────────────────────────

export const StyledKanbanError = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.intent.errorZone};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledKanbanRetry = styled.button`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.intent.primary};
  color: ${({ theme }) => theme.color.text.inverse};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledKanbanSkeleton = styled.div`
  height: 64px;
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.elevated : theme.color.background.neutral};
  opacity: 0.6;
`;
