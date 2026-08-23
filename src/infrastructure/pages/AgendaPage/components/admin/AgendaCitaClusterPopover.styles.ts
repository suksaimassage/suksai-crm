import styled from 'styled-components';
import type { TEstadoCita, TAgendaTherapistColor } from '@domain/types';
import { estadoDotColor } from '../shared/agendaEstado';

// ── List container ──────────────────────────────────────────────────────────────
// Full-bleed list of edit-only rows (PopoverBody padding="none"). Scrolls past
// max-height for large clusters (E12); thin-scrollbar idiom matches the grid body.

export const StyledClusterList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;

  @media (max-width: 639px) {
    max-height: min(60vh, 420px);
  }
`;

// ── Row (the whole row is the click target → onEdit) ────────────────────────────

export const StyledClusterRow = styled.button<{ $optimistic: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.font.body};
  opacity: ${({ $optimistic }) => ($optimistic ? 0.6 : 1)};
  transition:
    background-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    opacity ${({ theme }) => theme.transition.duration.fast};

  & + & {
    border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) =>
        theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
  }

  @media (hover: hover) {
    &:hover {
      background: ${({ theme }) =>
        theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[50]};
    }
  }

  &:active {
    background: ${({ theme }) =>
      theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.solid}
      ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// ── Leading therapist color dot (mirrors legend ::before square) ─────────────────

export const StyledClusterRowColorDot = styled.span<{ $color: TAgendaTherapistColor }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.border.radius.xs};
  flex-shrink: 0;
  align-self: start;
  margin-top: 5px;
  background: ${({ $color, theme }) => {
    const acc = theme.color.brand.therapistAccent;
    const map: Record<TAgendaTherapistColor, string> = {
      a: acc.a,
      b: acc.b,
      c: acc.c,
      d: acc.d,
      e: acc.e,
      f: acc.f,
    };
    return map[$color];
  }};
`;

// ── Main two-line block (estado+time / client / meta) ───────────────────────────

export const StyledClusterRowMain = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const StyledClusterRowTop = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: space-between;
`;

export const StyledClusterRowEstado = styled.span<{ $estado: TEstadoCita }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ $estado, theme }) => estadoDotColor($estado, theme)};
  background: ${({ theme }) =>
    theme.isDark ? theme.color.background.elevated : theme.color.neutralWarm[100]};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.color.neutralWarm[200]};
`;

export const StyledClusterRowEstadoGlyph = styled.span`
  font-size: 10px;
  line-height: 1;
`;

export const StyledClusterRowTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 12px;
  flex-shrink: 0;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.secondary : theme.color.brand.ink[700])};
`;

export const StyledClusterRowClient = styled.span<{ $struck: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.color.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: ${({ $struck }) => ($struck ? 'line-through' : 'none')};
`;

export const StyledClusterRowMeta = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.muted : theme.color.brand.ink[500])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Trailing chevron ("this opens the editor"; aria-hidden) ─────────────────────

export const StyledClusterRowChevron = styled.span<{ $optimistic: boolean }>`
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
  color: ${({ theme }) => (theme.isDark ? theme.color.text.tertiary : theme.color.brand.ink[500])};
  visibility: ${({ $optimistic }) => ($optimistic ? 'hidden' : 'visible')};
  transition: transform ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.easeOut};

  ${StyledClusterRow}:hover & {
    transform: translateX(2px);
  }

  @media (max-width: 359px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
