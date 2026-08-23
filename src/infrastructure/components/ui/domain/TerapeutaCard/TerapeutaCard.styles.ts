import styled, { css, keyframes } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { TTerapeutaEstado } from '@domain/types';

// ── Shimmer animation for skeleton loading ─────────────────────────────────

export const shimmerAnim = keyframes`
  from { background-position: 200% 0 }
  to   { background-position: -200% 0 }
`;

// ── Card root (article) ────────────────────────────────────────────────────

export const StyledTerapeutaCard = styled.article`
  position: relative;
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.xl};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 180ms ease-out,
    box-shadow 180ms ease-out;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px oklch(0.12 0.01 67 / 0.08);
    }
  }
`;

// ── Card header (row 1) — horizontal: [avatar] [text] [3-dots] ────────────

export const StyledCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
`;

// ── Avatar (52 px compact — fits the horizontal header) ───────────────────

export const StyledAvatarWrap = styled.div`
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
`;

export const StyledAvatarCircle = styled.div`
  width: 52px;
  height: 52px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: linear-gradient(160deg, oklch(0.25 0.03 143) 0%, oklch(0.15 0.022 143) 100%);
  display: grid;
  place-items: center;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1.125rem;
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: oklch(0.74 0.1 75);
  letter-spacing: 0.04em;
`;

interface IStyledStatusDotProps {
  readonly $estado: TTerapeutaEstado;
}

const dotColorMap: Record<TTerapeutaEstado, string> = {
  en_sala: 'oklch(0.74 0.10 75)',
  disponible: 'oklch(0.58 0.13 132)',
  descanso: 'oklch(0.43 0.05 204)',
  inactivo: 'oklch(0.62 0.03 67)',
  ausente: 'oklch(0.73 0.16 56)',
};

export const StyledStatusDot = styled.span<IStyledStatusDotProps>`
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ $estado }) => dotColorMap[$estado]};
  border: 2px solid ${({ theme }) => theme.color.background.card};
`;

// ── Header text block ──────────────────────────────────────────────────────

export const StyledHeaderTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  flex: 1;
  min-width: 0;
  padding-top: 2px;
`;

export const StyledTerapeutaName = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1.125rem;
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledHeaderSubRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

export const StyledRoleLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  line-height: 1.4;
`;

// ── Status pill — inline (no longer absolute-positioned) ──────────────────

interface IStyledStatusPillProps {
  readonly $estado: TTerapeutaEstado;
}

const getStatusPillStyles = ($estado: TTerapeutaEstado, theme: DefaultTheme) => {
  const light: Record<TTerapeutaEstado, ReturnType<typeof css>> = {
    en_sala: css`
      background: oklch(0.84 0.06 67);
      color: oklch(0.33 0.06 75);
    `,
    disponible: css`
      background: oklch(0.93 0.04 132);
      color: oklch(0.39 0.1 132);
    `,
    descanso: css`
      background: oklch(0.94 0.01 67);
      color: oklch(0.43 0.05 204);
    `,
    inactivo: css`
      background: oklch(0.94 0.01 67);
      color: oklch(0.43 0.05 204);
    `,
    ausente: css`
      background: oklch(0.95 0.05 56);
      color: oklch(0.44 0.14 56);
    `,
  };

  const dark: Record<TTerapeutaEstado, ReturnType<typeof css>> = {
    en_sala: css`
      background: oklch(0.26 0.04 67);
      color: oklch(0.84 0.06 67);
    `,
    disponible: css`
      background: oklch(0.17 0.04 132);
      color: oklch(0.76 0.1 132);
    `,
    descanso: css`
      background: oklch(0.23 0.04 204);
      color: oklch(0.72 0.03 67);
    `,
    inactivo: css`
      background: oklch(0.23 0.04 204);
      color: oklch(0.72 0.03 67);
    `,
    ausente: css`
      background: oklch(0.18 0.05 56);
      color: oklch(0.84 0.13 56);
    `,
  };

  return theme.isDark ? dark[$estado] : light[$estado];
};

export const StyledStatusPill = styled.span<IStyledStatusPillProps>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  letter-spacing: 0.01em;
  line-height: 1.4;
  white-space: nowrap;
  ${({ $estado, theme }) => getStatusPillStyles($estado, theme)}
`;

// ── Actions menu (flex item in header — no longer absolute) ───────────────

export const StyledTerapeutaCardActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  flex-shrink: 0;
`;

export const StyledMenuTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.border.radius.full};
  color: ${({ theme }) => theme.color.text.muted};
  cursor: pointer;
  transition:
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: ${({ theme }) => theme.color.text.secondary};
      background: ${({ theme }) => theme.color.background.neutral};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.primary};
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ── Card info row (row 2): sala + desde date ───────────────────────────────

export const StyledCardInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
`;

export const StyledMetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    opacity: 0.6;
  }
`;

// ── Especialidades tag strip (left-aligned) ────────────────────────────────

export const StyledEspecialidadesStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
`;

export const StyledEspecialidadTag = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  background: oklch(0.95 0.03 75);
  color: oklch(0.49 0.08 75);
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.border.radius.xs};
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

// ── Week bar (labels above, bars below) ───────────────────────────────────

export const StyledWeekBarSection = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md}
    ${({ theme }) => theme.spacing.xs};
`;

export const StyledWeekBarDayLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xxs};
`;

export const StyledDayLabel = styled.span<{ readonly $isToday: boolean }>`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['3xs']};
  font-weight: ${({ theme, $isToday }) =>
    $isToday ? theme.typography.weight.bold : theme.typography.weight.regular};
  color: ${({ theme, $isToday }) => ($isToday ? 'oklch(0.62 0.09 75)' : theme.color.text.muted)};
  text-align: center;
  line-height: 1;
`;

export const StyledWeekBarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: end;
  height: 40px;
`;

interface IStyledWeekBarColProps {
  readonly $hasShift: boolean;
  readonly $isToday: boolean;
  readonly $heightPct: number;
}

export const StyledWeekBarCol = styled.div<IStyledWeekBarColProps>`
  border-radius: ${({ theme }) => theme.border.radius.xs};
  height: ${({ $heightPct }) => Math.max($heightPct, 8)}%;
  min-height: 4px;
  align-self: end;
  ${({ $isToday }) =>
    $isToday &&
    css`
      box-shadow: 0 0 0 1.5px oklch(0.74 0.1 75);
    `}
  ${({ $hasShift }) =>
    $hasShift
      ? css`
          background: linear-gradient(180deg, oklch(0.81 0.08 75) 0%, oklch(0.67 0.1 75) 100%);
        `
      : css`
          background: repeating-linear-gradient(
            -45deg,
            oklch(0.89 0.02 67) 0px 1px,
            oklch(0.94 0.01 67) 1px 4px
          );
        `}
`;

// ── Week meta row (row 5): total hours ← → proxima cita ──────────────────

export const StyledWeekMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md}
    ${({ theme }) => theme.spacing.sm};
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledHorasLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  white-space: nowrap;
`;

export const StyledProximaCita = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.tertiary};
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

// ── Foot stats (3-column strip) ────────────────────────────────────────────

export const StyledFootStats = styled.footer`
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: ${({ theme }) => theme.color.background.light};
  border-top: 1px solid ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledFootStatCell = styled.div<{ readonly $last?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xs};
  border-right: ${({ $last, theme }) =>
    $last ? 'none' : `1px solid ${theme.border.color.neutral.light}`};
  min-height: 52px;
`;

export const StyledFootStatValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1.375rem;
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.1;
`;

export const StyledFootStatValueMuted = styled(StyledFootStatValue)`
  color: ${({ theme }) => theme.color.text.muted};
  font-size: 1.125rem;
`;

export const StyledFootStatValueGold = styled(StyledFootStatValue)`
  color: oklch(0.62 0.09 75);
  font-style: italic;
`;

export const StyledFootStatLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['3xs']};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.muted};
  text-align: center;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1;
`;

export const StyledFootStatServicio = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 72px;
  line-height: 1.3;
  text-align: center;
`;

// ── Add card (dashed border variant) ──────────────────────────────────────

export const StyledAddCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.color.background.card};
  border: 2px dashed ${({ theme }) => theme.border.color.neutral.medium};
  border-radius: ${({ theme }) => theme.border.radius.xl};
  cursor: pointer;
  transition:
    border-color 180ms ease-out,
    background 180ms ease-out;
  min-height: 280px;
  width: 100%;
  text-align: center;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: oklch(0.74 0.1 75);
      background: ${({ theme }) =>
        theme.isDark ? theme.color.background.card : 'oklch(0.98 0.01 67)'};
    }
  }

  &:focus-visible {
    outline: 2px solid oklch(0.74 0.1 75);
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.border.radius.xl};
  }
`;

export const StyledAddIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: oklch(0.93 0.02 143);
  color: oklch(0.38 0.08 143);
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

export const StyledAddLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1.25rem;
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.3;
`;

export const StyledAddDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.tertiary};
  margin: 0;
  max-width: 200px;
  line-height: 1.5;
`;

// ── Skeleton ───────────────────────────────────────────────────────────────

export const StyledSkeletonCard = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.xl};
  overflow: hidden;
  min-height: 340px;
`;

export const StyledSkeletonLine = styled.div<{
  readonly $width?: string;
  readonly $height?: string;
  readonly $mx?: boolean;
}>`
  height: ${({ $height }) => $height ?? '14px'};
  width: ${({ $width }) => $width ?? '100%'};
  ${({ $mx }) =>
    $mx &&
    css`
      margin-left: auto;
      margin-right: auto;
    `}
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) =>
    theme.isDark
      ? `linear-gradient(90deg, oklch(0.23 0.04 204) 25%, oklch(0.32 0.05 204) 50%, oklch(0.23 0.04 204) 75%)`
      : `linear-gradient(90deg, oklch(0.94 0.01 67) 25%, oklch(0.89 0.02 67) 50%, oklch(0.94 0.01 67) 75%)`};
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.4s linear infinite;
`;
